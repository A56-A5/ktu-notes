// One-off: overwrite the shared notebook's Data Analytics Lab rows with the
// shipped seed (retired experiments deleted, note bodies rebuilt).
// Usage: node scripts/override-dalab-cloud.mjs
import { readFileSync } from 'node:fs';
import { DATA_ANALYTICS_LAB_EXPERIMENTS } from '../lib/notes-dalab.js';
import { experimentHtml, labSyllabusHtml, expTitle } from '../lib/lab.js';
import { DATA_ANALYTICS_LAB } from '../lib/syllabus-labs.js';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const KEY = 'data-analytics-lab';
const now = Date.now();
const fresh = [
  {
    id: `sub-${KEY}`, parent_id: null, type: 'subject', title: DATA_ANALYTICS_LAB.title,
    code: DATA_ANALYTICS_LAB.code, description: DATA_ANALYTICS_LAB.description,
    source: 'official', sort_order: 3, category: null,
    credits: DATA_ANALYTICS_LAB.credits, contact_hours: DATA_ANALYTICS_LAB.contactHours,
    semester_no: 5, body: null,
  },
  {
    id: `${KEY}-syllabus`, parent_id: `sub-${KEY}`, type: 'note', title: 'Syllabus',
    source: 'official', sort_order: 0, category: 'syllabus',
    description: `${DATA_ANALYTICS_LAB.code} lab manual`,
    body: labSyllabusHtml(DATA_ANALYTICS_LAB, DATA_ANALYTICS_LAB_EXPERIMENTS),
  },
  ...DATA_ANALYTICS_LAB_EXPERIMENTS.map((e) => ({
    id: `${KEY}-e${e.no}`, parent_id: `sub-${KEY}`, type: 'note', title: expTitle(e),
    source: 'official', sort_order: e.no, category: 'experiment',
    description: e.aim, body: experimentHtml(e),
  })),
];
const freshIds = new Set(fresh.map((n) => n.id));

const { data: rows, error } = await sb.from('content_nodes').select('id').eq('workspace_id', 'public');
if (error) throw error;
const cloudIds = new Set(rows.map((r) => r.id));
const reallyDrop = [...cloudIds].filter(
  (id) => (id.startsWith(`${KEY}-`) || id === `sub-${KEY}`) && !freshIds.has(id)
);
console.log('on cloud:', [...cloudIds].filter((i) => i.startsWith(KEY)).length, '| will delete:', reallyDrop);

for (const n of fresh) {
  if (!cloudIds.has(n.id)) { console.log('skip (absent):', n.id); continue; }
  const { error: e1 } = await sb.from('content_nodes').upsert({
    workspace_id: 'public', id: n.id, parent_id: n.parent_id ?? `sub-${KEY}`, type: n.type,
    title: n.title, code: n.code ?? null, description: n.description ?? null,
    source: n.source, sort_order: n.sort_order, category: n.category ?? null,
    credits: n.credits ?? null, contact_hours: n.contact_hours ?? null,
    semester_no: n.semester_no ?? null, modified: now,
  }, { onConflict: 'workspace_id,id' });
  if (e1) throw e1;
  if (n.body != null) {
    const { error: e2 } = await sb.from('documents').upsert({
      workspace_id: 'public', node_id: n.id, html: n.body, updated_at: new Date(now).toISOString(),
    }, { onConflict: 'workspace_id,node_id' });
    if (e2) throw e2;
  }
  console.log('updated:', n.id);
}

if (reallyDrop.length) {
  const { error: e3 } = await sb.from('content_nodes').delete().eq('workspace_id', 'public').in('id', reallyDrop);
  if (e3) throw e3;
  const { error: e4 } = await sb.from('documents').delete().eq('workspace_id', 'public').in('node_id', reallyDrop);
  if (e4) throw e4;
  console.log('deleted:', reallyDrop.join(', '));
}
console.log('done');
