// Supabase integration for a shared, login-free notebook.
// This is deliberately a "public wiki" setup: there is no authentication and no
// per-user isolation. The anon/publishable key is the only key ever used in the
// browser - it is safe to ship, and anyone who can open the site can read and
// edit the same notebook. The service-role key must never appear here.
import { createClient } from '@supabase/supabase-js';
import { RETIRED_NODE_IDS } from './seed';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// All rows of the shared notebook live under one workspace id. Override with
// NEXT_PUBLIC_WORKSPACE if you ever run several independent notebooks off the
// same Supabase project.
export const WORKSPACE = process.env.NEXT_PUBLIC_WORKSPACE || 'public';

export const configured = Boolean(url && key);
export const BUCKET = 'note-assets';

let projectHost = '';
try {
  projectHost = new URL(url).host;
} catch {}

export const sb = configured
  ? createClient(url, key, {
      auth: {
        // No sessions, no refresh tokens - the notebook is anonymous on purpose.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: undefined,
      },
    })
  : null;

const NODE_COLS =
  'id,parent_id,type,title,code,description,source,sort_order,pinned,unverified,semester_no,hours,category,progress,credits,contact_hours,accessed,created,modified';

const toRow = (n) => ({
  workspace_id: WORKSPACE,
  id: n.id,
  parent_id: n.parentId ?? null,
  type: n.type,
  title: n.title || 'Untitled',
  code: n.code ?? null,
  description: n.description ?? null,
  source: n.source ?? 'personal',
  sort_order: n.order ?? 0,
  pinned: Boolean(n.pinned),
  unverified: Boolean(n.unverified),
  semester_no: n.semesterNo ?? null,
  hours: n.hours ?? null,
  category: n.category ?? null,
  progress: n.progress ?? null,
  credits: n.credits ?? null,
  contact_hours: n.contactHours ?? null,
  accessed: n.accessed ?? null,
  created: n.created ?? Date.now(),
  modified: n.modified ?? Date.now(),
});

const fromRow = (r, body) => ({
  id: r.id,
  parentId: r.parent_id,
  type: r.type,
  title: r.title,
  ...(r.code ? { code: r.code } : {}),
  ...(r.description ? { description: r.description } : {}),
  source: r.source || 'personal',
  order: r.sort_order ?? 0,
  ...(r.pinned ? { pinned: true } : {}),
  ...(r.unverified ? { unverified: true } : {}),
  ...(r.semester_no != null ? { semesterNo: r.semester_no } : {}),
  ...(r.hours != null ? { hours: r.hours } : {}),
  ...(r.category ? { category: r.category } : {}),
  ...(r.progress ? { progress: r.progress } : {}),
  ...(r.credits != null ? { credits: r.credits } : {}),
  ...(r.contact_hours ? { contactHours: r.contact_hours } : {}),
  ...(r.accessed ? { accessed: Number(r.accessed) } : {}),
  ...(r.created ? { created: Number(r.created) } : {}),
  modified: r.modified ? Number(r.modified) : Date.now(),
  ...(body != null ? { body } : {}),
});

async function allRows(table, cols, orderBy = 'id') {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from(table)
      .select(cols)
      .eq('workspace_id', WORKSPACE)
      .order(orderBy)
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export async function pull() {
  const rows = await allRows('content_nodes', NODE_COLS);
  if (!rows.length) return [];
  const docs = await allRows('documents', 'node_id,html', 'node_id');
  const bodies = new Map(docs.map((d) => [d.node_id, d.html]));
  return rows.map((r) => fromRow(r, bodies.has(r.id) ? bodies.get(r.id) : undefined));
}

export async function push(nodes, { knownIds = null } = {}) {
  for (let i = 0; i < nodes.length; i += 400) {
    const chunk = nodes.slice(i, i + 400);
    const { error } = await sb
      .from('content_nodes')
      .upsert(chunk.map(toRow), { onConflict: 'workspace_id,id' });
    if (error) throw error;

    const docs = chunk
      .filter((n) => ['note', 'resource', 'subtopic'].includes(n.type))
      .map((n) => ({
        workspace_id: WORKSPACE,
        node_id: n.id,
        html: n.body || '',
        updated_at: new Date(n.modified || Date.now()).toISOString(),
      }));
    if (docs.length) {
      const { error: dErr } = await sb
        .from('documents')
        .upsert(docs, { onConflict: 'workspace_id,node_id' });
      if (dErr) throw dErr;
    }
  }

  const keepNodes = new Set(nodes.map((n) => n.id));
  const remoteIds = (await allRows('content_nodes', 'id')).map((r) => r.id);
  // Delete rows this client had already synced but no longer has. Rows created
  // by another device while this client was offline are preserved.
  const goneNodes = remoteIds.filter(
    (id) => !keepNodes.has(id) && (!knownIds || knownIds.has(id))
  );
  for (let i = 0; i < goneNodes.length; i += 100) {
    const chunk = goneNodes.slice(i, i + 100);
    const { error } = await sb
      .from('content_nodes')
      .delete()
      .eq('workspace_id', WORKSPACE)
      .in('id', chunk);
    if (error) throw error;
    const { error: dErr } = await sb
      .from('documents')
      .delete()
      .eq('workspace_id', WORKSPACE)
      .in('node_id', chunk);
    if (dErr) throw dErr;
  }

  // Note bodies should exist only for note-like nodes that still exist.
  const nonNoteIds = nodes
    .filter((n) => !['note', 'resource', 'subtopic'].includes(n.type))
    .map((n) => n.id);
  for (let i = 0; i < nonNoteIds.length; i += 100) {
    const { error } = await sb
      .from('documents')
      .delete()
      .eq('workspace_id', WORKSPACE)
      .in('node_id', nonNoteIds.slice(i, i + 100));
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Merge the local tree and the remote tree into one shared notebook.
// `seen` maps node id -> modified timestamp from the last successful sync.
// Rules (best-effort for concurrent editors):
//   - same id     -> keep the copy whose `modified` is newer
//   - only remote -> take it, unless this client had already synced it and
//                    deleted it locally (a local delete wins)
//   - only local  -> keep it, unless the cloud had it at the last sync and this
//                    client has made no newer change (then it was deleted remotely)
// ---------------------------------------------------------------------------
export function mergeNotebook(local, remote, seen = null, seedIds = null) {
  const retired = new Set(RETIRED_NODE_IDS);
  local = local.filter((n) => !retired.has(n.id));
  remote = remote.filter((n) => !retired.has(n.id));
  const localById = new Map(local.map((n) => [n.id, n]));
  const remoteById = new Map(remote.map((n) => [n.id, n]));
  const merged = [];
  for (const r of remote) {
    const l = localById.get(r.id);
    if (!l) {
      if (seen && seen.has(r.id)) continue; // deleted locally already
      merged.push(r);
      continue;
    }
    merged.push((l.modified || 0) > (r.modified || 0) ? l : r);
  }
  for (const l of local) {
    if (remoteById.has(l.id)) continue;
    if (seen && seen.has(l.id) && (l.modified || 0) <= (seen.get(l.id) || 0)) continue; // deleted remotely
    // First sync on a new device: don't resurrect untouched default nodes that
    // the shared notebook no longer has.
    if (!seen && seedIds && seedIds.has(l.id)) continue;
    merged.push(l);
  }
  return merged;
}

export function sameNotebook(a, b) {
  if (a.length !== b.length) return false;
  const map = new Map(a.map((n) => [n.id, n]));
  for (const n of b) {
    const x = map.get(n.id);
    if (!x || x.modified !== n.modified) return false;
  }
  return true;
}

// ------------------------------------------------------------------ binary assets
export async function uploadAsset(id, blob, meta) {
  const path = `${WORKSPACE}/${id}`;
  const up = await sb.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: meta.type || blob.type || 'application/octet-stream',
  });
  if (up.error) throw up.error;
  const { error } = await sb.from('assets').upsert(
    {
      workspace_id: WORKSPACE,
      id,
      node_id: meta.noteId,
      name: meta.name || '',
      type: meta.type || blob.type,
      path,
      size: blob.size || 0,
    },
    { onConflict: 'workspace_id,id' }
  );
  if (error) throw error;
}

export async function downloadAsset(id) {
  const { data: row, error } = await sb
    .from('assets')
    .select('*')
    .eq('workspace_id', WORKSPACE)
    .eq('id', id)
    .maybeSingle();
  if (error || !row) return null;
  const { data, error: dErr } = await sb.storage.from(BUCKET).download(row.path);
  if (dErr || !data) return null;
  return { blob: data, noteId: row.node_id, name: row.name, type: row.type };
}

export async function deleteAssets(noteIds) {
  for (let i = 0; i < noteIds.length; i += 100) {
    const { data } = await sb
      .from('assets')
      .select('id,path')
      .eq('workspace_id', WORKSPACE)
      .in('node_id', noteIds.slice(i, i + 100));
    if (!data?.length) continue;
    await sb.storage.from(BUCKET).remove(data.map((r) => r.path));
    await sb.from('assets').delete().eq('workspace_id', WORKSPACE).in('id', data.map((r) => r.id));
  }
}

export async function recordImport(summary) {
  const { error } = await sb.from('import_history').insert({ workspace_id: WORKSPACE, ...summary });
  if (error) throw error;
}

export async function cloudHealth() {
  const { error } = await sb.from('content_nodes').select('id').eq('workspace_id', WORKSPACE).limit(1);
  if (error) {
    if (/workspace_id|user_id/i.test(error.message) && /column|schema cache/i.test(error.message))
      return { ok: false, reason: 'legacy-schema', host: projectHost };
    if (/relation|schema cache|does not exist/i.test(error.message))
      return { ok: false, reason: 'missing-tables', host: projectHost };
    if (/permission|policy|denied|row-level security|violates/i.test(error.message))
      return { ok: false, reason: 'rls', host: projectHost };
    return { ok: false, reason: error.message, host: projectHost };
  }
  return { ok: true, host: projectHost };
}