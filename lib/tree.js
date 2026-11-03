// Pure helpers for the recursive content tree.
export const uid = (prefix = 'n') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const TYPES = ['semester', 'subject', 'folder', 'module', 'topic', 'subtopic', 'note', 'resource'];
export const FOLDER_TYPES = new Set(['semester', 'subject', 'folder', 'module', 'topic']);
export const isFolder = (n) => !!n && FOLDER_TYPES.has(n.type);
export const isNote = (n) => !!n && (n.type === 'note' || n.type === 'resource' || n.type === 'subtopic');

export const byOrder = (a, b) =>
  (a.order ?? 0) - (b.order ?? 0) || String(a.title).localeCompare(String(b.title));

export function childrenOf(nodes, parentId) {
  return nodes.filter((n) => (n.parentId ?? null) === (parentId ?? null)).sort(byOrder);
}

export function descendants(nodes, id) {
  const out = [];
  const walk = (pid) => {
    for (const n of nodes) {
      if ((n.parentId ?? null) === pid) {
        out.push(n);
        walk(n.id);
      }
    }
  };
  walk(id);
  return out;
}

export function ancestors(nodes, id) {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const out = [];
  let cur = map.get(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? map.get(cur.parentId) : null;
  }
  return out;
}

export function counts(nodes, id) {
  const all = descendants(nodes, id);
  return {
    all: all.length,
    notes: all.filter(isNote).length,
    folders: all.filter(isFolder).length,
  };
}

export function subjectOf(nodes, id) {
  const chain = ancestors(nodes, id);
  return chain.find((n) => n.type === 'subject') || null;
}

export function slug(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Prevent moving a folder inside itself or its own descendants.
export function canMove(nodes, nodeId, targetId) {
  if (!targetId) return false;
  if (nodeId === targetId) return false;
  const target = nodes.find((n) => n.id === targetId);
  if (!target || !isFolder(target)) return false;
  const bad = new Set([nodeId, ...descendants(nodes, nodeId).map((n) => n.id)]);
  return !bad.has(targetId);
}

export function nextOrder(nodes, parentId) {
  const kids = childrenOf(nodes, parentId);
  return kids.length ? Math.max(...kids.map((k) => k.order ?? 0)) + 1 : 0;
}

// Build the readable location used in search results and breadcrumbs.
export function breadcrumbText(nodes, id, sep = ' › ') {
  return ancestors(nodes, id)
    .filter((n) => n.type !== 'semester')
    .map((n) => n.title)
    .join(sep);
}

export function plainText(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchNodes(nodes, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = [];
  for (const n of nodes) {
    if (n.type === 'semester') continue;
    const title = String(n.title || '').toLowerCase();
    const code = String(n.code || '').toLowerCase();
    const desc = String(n.description || '').toLowerCase();
    const body = plainText(n.body || '').toLowerCase();
    const path = breadcrumbText(nodes, n.id).toLowerCase();
    const hay = `${title} ${code} ${desc} ${body} ${path}`;
    if (!terms.every((t) => hay.includes(t))) continue;
    let score = 0;
    if (title.includes(q)) score += 8;
    if (code.includes(q)) score += 8;
    if (title.startsWith(q)) score += 4;
    if (path.includes(q)) score += 3;
    if (body.includes(q)) score += 2;
    if (!isNote(n)) score += 1;
    scored.push({ node: n, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 60).map((s) => s.node);
}

export function progressOf(nodes, subjectId) {
  const leaves = descendants(nodes, subjectId).filter(isNote);
  if (!leaves.length) return 0;
  const done = leaves.filter((n) => n.progress === 'done').length;
  return Math.round((done / leaves.length) * 100);
}

export function relativeTime(ts) {
  if (!ts) return 'not opened yet';
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  return new Date(ts).toLocaleDateString();
}
