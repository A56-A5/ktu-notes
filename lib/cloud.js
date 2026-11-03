// Supabase integration (optional). The anon/publishable key is the only key
// ever used in the browser. The service-role key must never appear here.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const configured = Boolean(url && key);
export const BUCKET = 'note-assets';

export const sb = configured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const NODE_COLS =
  'id,parent_id,type,title,code,description,source,sort_order,pinned,unverified,semester_no,hours,category,progress,credits,contact_hours,accessed,created,modified';

const toRow = (n, userId) => ({
  user_id: userId,
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

async function allRows(table, cols, userId) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from(table)
      .select(cols)
      .eq('user_id', userId)
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export async function pull(userId) {
  const rows = await allRows('content_nodes', NODE_COLS, userId);
  if (!rows.length) return [];
  const docs = await allRows('documents', 'node_id,html', userId);
  const bodies = new Map(docs.map((d) => [d.node_id, d.html]));
  return rows.map((r) => fromRow(r, bodies.has(r.id) ? bodies.get(r.id) : undefined));
}

export async function push(nodes, userId, { knownIds = null } = {}) {
  for (let i = 0; i < nodes.length; i += 400) {
    const chunk = nodes.slice(i, i + 400);
    const { error } = await sb
      .from('content_nodes')
      .upsert(chunk.map((n) => toRow(n, userId)), { onConflict: 'user_id,id' });
    if (error) throw error;

    const docs = chunk
      .filter((n) => ['note', 'resource', 'subtopic'].includes(n.type))
      .map((n) => ({
        user_id: userId,
        node_id: n.id,
        html: n.body || '',
        updated_at: new Date(n.modified || Date.now()).toISOString(),
      }));
    if (docs.length) {
      const { error: dErr } = await sb
        .from('documents')
        .upsert(docs, { onConflict: 'user_id,node_id' });
      if (dErr) throw dErr;
    }
  }

  const keepNodes = new Set(nodes.map((n) => n.id));
  const remoteIds = (await allRows('content_nodes', 'id', userId)).map((r) => r.id);
  // Only delete rows this client had already synced. Rows created by another
  // device that we have not seen yet are preserved.
  const goneNodes = remoteIds.filter(
    (id) => !keepNodes.has(id) && (!knownIds || knownIds.has(id))
  );
  for (let i = 0; i < goneNodes.length; i += 100) {
    const { error } = await sb
      .from('content_nodes')
      .delete()
      .eq('user_id', userId)
      .in('id', goneNodes.slice(i, i + 100));
    if (error) throw error;
  }

  // Note bodies should exist only for note-like nodes that still exist.
  const nonNoteIds = nodes
    .filter((n) => !['note', 'resource', 'subtopic'].includes(n.type))
    .map((n) => n.id);
  for (let i = 0; i < nonNoteIds.length; i += 100) {
    const { error } = await sb
      .from('documents')
      .delete()
      .eq('user_id', userId)
      .in('node_id', nonNoteIds.slice(i, i + 100));
    if (error) throw error;
  }
}

export async function uploadAsset(userId, id, blob, meta) {
  const path = `${userId}/${id}`;
  const up = await sb.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: meta.type || blob.type || 'application/octet-stream',
  });
  if (up.error) throw up.error;
  const row = await sb.from('assets').upsert(
    {
      user_id: userId,
      id,
      node_id: meta.noteId,
      name: meta.name || '',
      type: meta.type || blob.type,
      path,
      size: blob.size || 0,
    },
    { onConflict: 'user_id,id' }
  );
  if (row.error) throw row.error;
}

export async function downloadAsset(id) {
  const { data: row, error } = await sb.from('assets').select('*').eq('id', id).maybeSingle();
  if (error || !row) return null;
  const { data, error: dErr } = await sb.storage.from(BUCKET).download(row.path);
  if (dErr || !data) return null;
  return { blob: data, noteId: row.node_id, name: row.name, type: row.type };
}

export async function deleteAssets(noteIds) {
  for (let i = 0; i < noteIds.length; i += 100) {
    const { data } = await sb.from('assets').select('id,path').in('node_id', noteIds.slice(i, i + 100));
    if (!data?.length) continue;
    await sb.storage.from(BUCKET).remove(data.map((r) => r.path));
    await sb.from('assets').delete().in('id', data.map((r) => r.id));
  }
}

export async function recordImport(userId, summary) {
  const { error } = await sb.from('import_history').insert({ user_id: userId, ...summary });
  if (error) throw error;
}

export async function cloudHealth(userId) {
  const { error } = await sb.from('content_nodes').select('id').eq('user_id', userId).limit(1);
  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) return { ok: false, reason: 'missing-tables' };
    if (/permission|policy|denied/i.test(error.message)) return { ok: false, reason: 'rls' };
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}