import { isNote, uid, TYPES } from './tree';

export const FORMAT = 'ktu-notes';
export const VERSION = 1;

const sortKids = (nodes, parentId) =>
  nodes.filter((n) => (n.parentId ?? null) === (parentId ?? null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const assetRefs = (html = '') => [...new Set(String(html).match(/asset:[a-z0-9-]+/gi) || [])];

function toDoc(doc, n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    ...(n.code ? { code: n.code } : {}),
    ...(n.description ? { description: n.description } : {}),
    ...(n.subtitle ? { subtitle: n.subtitle } : {}),
    ...(n.source ? { source: n.source } : {}),
    ...(n.hours != null ? { hours: n.hours } : {}),
    ...(n.category ? { category: n.category } : {}),
    ...(n.progress ? { progress: n.progress } : {}),
    ...(n.body ? { body: n.body } : {}),
    children: sortKids(doc, n.id).map((c) => toDoc(doc, c)),
  };
}

export function buildExport(nodes, rootIds, meta = {}) {
  const roots = rootIds
    ? rootIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean)
    : sortKids(nodes, null);
  const doc = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    generator: 'KTU Notes',
    ...meta,
    nodes: roots.map((n) => toDoc(nodes, n)),
  };
  return doc;
}

export function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function downloadJSON(name, obj) {
  downloadBlob(name, new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
}

export function safeName(s = 'ktu-notes') {
  return `ktu-${String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)}`;
}

// ---------------------------------------------------------------- validation

export function validateDoc(data, { existingIds = new Set(), targetType = null } = {}) {
  const errors = [];
  const warnings = [];
  const duplicates = new Set();
  const collisions = new Set();
  const seen = new Set();
  let count = 0;
  const maxDepth = 60;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { errors: ['The file does not contain a JSON object.'], warnings, count: 0, duplicates, collisions };
  }
  if (data.format !== FORMAT) {
    errors.push(`Root field "format" must be "${FORMAT}" (found ${JSON.stringify(data.format)}).`);
  }
  if (data.version !== undefined && data.version !== VERSION) {
    warnings.push(`File version ${data.version}; this app reads version ${VERSION}.`);
  }
  if (!Array.isArray(data.nodes)) {
    errors.push('Root field "nodes" must be an array.');
    return { errors, warnings, count, duplicates, collisions };
  }

  const walk = (list, path, depth) => {
    if (depth > maxDepth) {
      errors.push(`${path}: nesting is deeper than ${maxDepth} levels.`);
      return;
    }
    list.forEach((n, i) => {
      const p = `${path}[${i}]${n && n.title ? ` (“${String(n.title).slice(0, 40)}”)` : ''}`;
      count++;
      if (!n || typeof n !== 'object' || Array.isArray(n)) {
        errors.push(`${p}: each node must be an object.`);
        return;
      }
      if (typeof n.title !== 'string' || !n.title.trim()) errors.push(`${p}: "title" must be a non-empty string.`);
      if (!TYPES.includes(n.type)) {
        errors.push(`${p}: "type" must be one of ${TYPES.join(', ')}.`);
      }
      if (depth === 0 && targetType === null && n.type !== 'subject') {
        errors.push(`${p}: top level must be "subject" when importing at the home page.`);
      }
      for (const f of ['code', 'body', 'id', 'description', 'subtitle', 'category']) {
        if (n[f] !== undefined && typeof n[f] !== 'string') errors.push(`${p}: "${f}" must be a string.`);
      }
      if (n.hours !== undefined && typeof n.hours !== 'number') errors.push(`${p}: "hours" must be a number.`);
      if (n.id) {
        if (seen.has(n.id)) duplicates.add(n.id);
        seen.add(n.id);
        if (existingIds.has(n.id)) collisions.add(n.id);
      }
      if (n.children !== undefined) {
        if (!Array.isArray(n.children)) errors.push(`${p}: "children" must be an array.`);
        else walk(n.children, `${p}.children`, depth + 1);
      }
    });
  };
  walk(data.nodes, 'nodes', 0);

  if (!count) errors.push('The file contains no nodes.');
  if (duplicates.size) warnings.push(`${duplicates.size} duplicate id(s) inside the file: ${[...duplicates].slice(0, 5).join(', ')}. Merge mode will assign fresh ids.`);
  if (collisions.size) warnings.push(`${collisions.size} id(s) already exist in this notebook. Merge mode keeps both by assigning new ids; Replace mode overwrites those entries.`);

  return { errors, warnings, count, duplicates: [...duplicates], collisions: [...collisions] };
}

// -------------------------------------------------------------- import build

function flattenImport(list, parentId, startOrder, makeId, now, out, inherited) {
  list.forEach((n, i) => {
    const id = makeId(n);
    const node = {
      id,
      parentId: parentId ?? null,
      type: n.type,
      title: n.title.trim(),
      order: (startOrder ?? 0) + i,
      source: 'imported',
      createdAt: now,
      modified: now,
      ...(n.code ? { code: n.code } : {}),
      ...(n.description ? { description: n.description } : {}),
      ...(n.subtitle ? { subtitle: n.subtitle } : {}),
      ...(n.hours != null ? { hours: n.hours } : {}),
      ...(n.category ? { category: n.category } : {}),
      ...(n.progress ? { progress: n.progress } : {}),
      ...(n.body ? { body: n.body } : {}),
      ...(inherited || {}),
    };
    out.push(node);
    if (Array.isArray(n.children) && n.children.length) {
      flattenImport(n.children, id, 0, makeId, now, out, n.childrenMapping);
    }
  });
  return out;
}

/**
 * Build nodes ready to insert.
 * mode "merge"   → new ids, appended, nothing overwritten (default)
 * mode "replace" → keeps original ids where possible; caller confirms overwrite
 */
export function buildImport(data, { mode = 'merge', parentId = null, existingIds = new Set(), semesterId = null, startOrder = 0 } = {}) {
  const now = Date.now();
  const used = new Set(existingIds);
  const makeId = (n) => {
    if (mode === 'replace' && n.id) {
      used.add(n.id);
      return n.id;
    }
    let id = uid('i');
    while (used.has(id)) id = uid('i');
    used.add(id);
    return id;
  };
  const inherited = parentId && parentId !== semesterId ? {} : semesterId ? { semesterNo: 5 } : {};
  return flattenImport(data.nodes, parentId, startOrder, makeId, now, [], inherited);
}

// ------------------------------------------------------------------- ZIP I/O

export async function exportZip(nodes, rootIds, name, fileName) {
  const JSZip = (await import('jszip')).default;
  const doc = buildExport(nodes, rootIds);
  const refs = assetRefs(JSON.stringify(doc));
  const zip = new JSZip();
  doc.assets = [];
  let missing = 0;
  const { getAsset } = await import('./db');
  for (const ref of refs) {
    const assetId = ref.slice(6);
    let asset = null;
    try {
      asset = await getAsset(assetId);
    } catch {}
    if (!asset) {
      missing++;
      continue;
    }
    const ext = ((asset.type || 'image/png').split('/')[1] || 'png').split('+')[0].replace('jpeg', 'jpg');
    const file = `assets/${assetId}.${ext}`;
    zip.file(file, asset.blob);
    doc.assets.push({ id: assetId, file, name: asset.name || '', type: asset.type || '' });
  }
  zip.file('data.json', JSON.stringify(doc, null, 2));
  zip.file(
    'README.txt',
    `KTU Notes backup\nCreated: ${new Date().toISOString()}\n\nIncluded: data.json (full hierarchy + note HTML) and ${doc.assets.length} asset file(s).\nRestore: open KTU Notes → Import → choose this ZIP. Images are re-linked automatically.\n`
  );
  const blob = await zip.generateAsync({ type: 'blob' });
  const finalName = `${fileName || safeName(name)}.zip`;
  downloadBlob(finalName, blob);
  return { images: doc.assets.length, missing, fileName: finalName, doc };
}

export async function readZip(file) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('The ZIP does not contain data.json at its root.');
  const text = await dataFile.async('string');
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    throw new Error(`data.json is not valid JSON: ${e.message}`);
  }
  const files = {};
  for (const [pathName, entry] of Object.entries(zip.files)) {
    if (entry.dir || pathName === 'data.json') continue;
    if (pathName.startsWith('assets/')) files[pathName] = entry;
  }
  return { doc, files };
}

export function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

export const EXAMPLE = {
  format: FORMAT,
  version: VERSION,
  generator: 'KTU Notes example template',
  nodes: [
    {
      type: 'subject',
      title: 'Example Subject',
      code: 'EXAMPLE101',
      description: 'Template only - replace with your own subject.',
      children: [
        {
          type: 'note',
          title: 'Syllabus',
          body: '<h2>Example syllabus</h2><p>Official syllabus text would go here.</p>',
        },
        {
          type: 'module',
          title: 'Module 1',
          children: [
            {
              type: 'topic',
              title: 'Example topic',
              children: [
                {
                  type: 'note',
                  title: 'Example subtopic',
                  body: '<p>Your notes live here. Images are referenced as <code>asset:&lt;id&gt;</code> in ZIP backups.</p>',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};