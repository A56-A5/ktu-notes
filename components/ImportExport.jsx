'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Download, FileJson, FileArchive, Check, AlertTriangle, BookOpen, FolderOpen } from 'lucide-react';
import { Modal, useUI } from './ui';
import { validateDoc, buildImport, buildExport, downloadJSON, exportZip, readZip, EXAMPLE, FORMAT, VERSION, safeName } from '../lib/io';
import { putAsset } from '../lib/db';
import { childrenOf, ancestors, uid, isNote } from '../lib/tree';

function PreviewTree({ list, depth = 0 }) {
  return (
    <>
      {list.map((n, i) => (
        <div className="pv" key={i} style={{ paddingLeft: depth * 14 }}>
          {depth > 0 ? '└ ' : ''}
          {n.title}
          <span className="ty">{n.type}</span>
          {n.children?.length ? <PreviewTree list={n.children} depth={depth + 1} /> : null}
        </div>
      ))}
    </>
  );
}

function flattenPreview(nodes, out = []) {
  for (const n of nodes) {
    out.push(n);
    if (n.children) flattenPreview(n.children, out);
  }
  return out;
}

export default function ImportExport({ open, onClose, nodes, semesterId, currentId, onCommit, initialTab = 'import' }) {
  const ui = useUI();
  const [tab, setTab] = useState(initialTab);
  const [doc, setDoc] = useState(null);
  const [zipFiles, setZipFiles] = useState(null);
  const [fileName, setFileName] = useState('');
  const [validation, setValidation] = useState(null);
  const [target, setTarget] = useState(currentId || semesterId);
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const targets = useMemo(() => {
    const list = [];
    for (const n of nodes) {
      if (['semester', 'subject', 'folder', 'module', 'topic'].includes(n.type)) {
        list.push({ id: n.id, label: ancestors(nodes, n.id).map((a) => a.title).join(' › ') });
      }
    }
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [nodes]);

  const existingIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const targetNode = nodes.find((n) => n.id === target);
  const targetAllowed = !targetNode || ['semester', 'subject', 'folder', 'module', 'topic'].includes(targetNode.type);

  const resetFile = () => {
    setDoc(null);
    setZipFiles(null);
    setFileName('');
    setValidation(null);
    setSummary(null);
  };

  const loadFile = async (file) => {
    if (!file) return;
    resetFile();
    setBusy(true);
    try {
      let parsed;
      let zf = null;
      if (file.name.toLowerCase().endsWith('.zip')) {
        const r = await readZip(file);
        parsed = r.doc;
        zf = r.files;
      } else {
        const text = await file.text();
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          throw new Error(`That file is not valid JSON: ${e.message}`);
        }
      }
      setDoc(parsed);
      setZipFiles(zf);
      setFileName(file.name);
      const v = validateDoc(parsed, {
        existingIds,
        targetType: target && target !== semesterId ? targetNode?.type : null,
      });
      if (!targetAllowed) v.errors.push('Choose a folder, subject or the semester as the import target.');
      setValidation(v);
    } catch (e) {
      setValidation({ errors: [e.message], warnings: [], count: 0 });
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    if (!doc || validation?.errors.length) return;
    if (mode === 'replace') {
      const ok = await ui.confirm({
        title: 'Replace matching entries?',
        body: `Replace mode overwrites existing item(s) whose IDs match this file. Anything not in the file is left alone — no other notes are deleted. This cannot be undone without a backup.`,
        confirmText: 'Replace and import',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      let working = doc;
      if (zipFiles) {
        const map = new Map();
        for (const a of doc.assets || []) {
          const entry = zipFiles[a.file];
          if (!entry) continue;
          const blob = await entry.async('blob');
          map.set(a.id, { blob, name: a.name, type: a.type });
        }
        // Assets are materialised after node ids exist; keep a lookup on the doc.
        working = { ...doc, __zipAssets: map };
      }
      const parentId = target || semesterId;
      const imported = buildImport(working, {
        mode,
        parentId,
        existingIds,
        semesterId,
        startOrder: childrenOf(nodes, parentId).length,
      });

      // Re-link images: asset:<old> → fresh asset:<new> owned by the new note.
      let linked = 0;
      if (working.__zipAssets) {
        for (const n of imported) {
          if (!isNote(n) || !n.body) continue;
          const refs = [...new Set(n.body.match(/asset:[a-z0-9-]+/gi) || [])];
          for (const ref of refs) {
            const old = ref.slice(6);
            const a = working.__zipAssets.get(old);
            if (!a) continue;
            const newId = uid('a');
            await putAsset(newId, a.blob, { noteId: n.id, name: a.name, type: a.type });
            n.body = n.body.replaceAll(ref, `asset:${newId}`);
            linked++;
          }
        }
      }

      const incoming = new Set(imported.map((n) => n.id));
      const byId = new Map(nodes.map((n) => [n.id, n]));
      imported.forEach((n) => byId.set(n.id, n));
      const next = [...byId.values()];
      onCommit(next);
      const nodesCount = imported.length;
      const noteCount = imported.filter(isNote).length;
      setSummary({
        nodes: nodesCount,
        notes: noteCount,
        images: linked,
        mode,
        target: targetNode ? targetNode.title : 'Semester',
      });
      setTab('done');
      ui.toast(`Imported ${nodesCount} items`, 'ok');
    } catch (e) {
      ui.toast(`Import failed: ${e.message}`, 'error', 6000);
    } finally {
      setBusy(false);
    }
  };

  const exportNow = async (scopeId, label, kind) => {
    const scoped = scopeId ? nodes.filter((n) => n.id === scopeId) : null;
    if (!scoped) return;
    setBusy(true);
    try {
      if (kind === 'zip') {
        const r = await exportZip(nodes, scopeId ? [scopeId] : null, label);
        ui.toast(`ZIP backup ready${r.missing ? ` — ${r.missing} image(s) missing` : ''}`, r.missing ? 'error' : 'ok', 5000);
      } else {
        const out = buildExport(nodes, scopeId ? [scopeId] : null);
        downloadJSON(`${safeName(label)}.json`, out);
        ui.toast('JSON export downloaded', 'ok');
      }
    } catch (e) {
      ui.toast(`Export failed: ${e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Modal title="Import & export" sub="Move your notebook between devices, or back it up before big edits." onClose={onClose} wide>
      <div className="tabs">
        <button className={tab === 'import' ? 'on' : ''} onClick={() => setTab('import')}>Import</button>
        <button className={tab === 'export' ? 'on' : ''} onClick={() => setTab('export')}>Export</button>
        <button className={tab === 'format' ? 'on' : ''} onClick={() => setTab('format')}>JSON format</button>
      </div>

      {tab === 'import' && (
        <div>
          <button className="btn primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload size={15} /> {busy ? 'Reading…' : 'Choose a JSON or ZIP file'}
          </button>
          <input ref={fileRef} type="file" accept=".json,.zip,application/json,application/zip" hidden onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }} />
          {fileName && <span className="mono" style={{ fontSize: '.64rem', marginLeft: 10 }}>{fileName}</span>}

          <hr className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            <div>
              <label className="lbl" htmlFor="imp-target">Import into</label>
              <select id="imp-target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="kbd-hint" style={{ marginTop: 4 }}>Import into the semester to create new subjects.</p>
            </div>
            <div>
              <span className="lbl">Conflict handling</span>
              <div className="row">
                <label className="mono" style={{ fontSize: '.64rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Merge (fresh IDs)
                </label>
                <label className="mono" style={{ fontSize: '.64rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace by ID
                </label>
              </div>
              <p className="kbd-hint" style={{ marginTop: 4 }}>Merge never overwrites. Replace asks before writing.</p>
            </div>
          </div>

          {validation && (
            <>
              <hr className="divider" />
              {validation.errors?.length > 0 && (
                <div className="error-box">
                  <strong>Can’t import yet:</strong>
                  <ul className="plain">
                    {validation.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                  {validation.errors.length > 30 && <div>…and {validation.errors.length - 30} more.</div>}
                </div>
              )}
              {validation.errors?.length === 0 && (
                <div className="ok-box">
                  <Check size={12} /> {validation.count} item(s) validated. {validation.collisions?.length ? `${validation.collisions.length} ID collision(s) detected — merge keeps both, replace overwrites.` : 'No ID collisions.'}
                </div>
              )}
              {validation.warnings?.length > 0 && (
                <div className="warn-box" style={{ marginTop: 8 }}>
                  {validation.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                </div>
              )}
              {doc && (
                <>
                  <label className="lbl">Hierarchy preview</label>
                  <div className="preview-tree">
                    <PreviewTree list={doc.nodes || []} />
                  </div>
                </>
              )}
            </>
          )}

          <div className="row end">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={!doc || busy || validation?.errors?.length > 0} onClick={doImport}>
              {busy ? 'Importing…' : `Import ${validation?.count ? `${validation.count} items` : ''}`}
            </button>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div>
          <p className="sub" style={{ marginTop: 0 }}>
            JSON preserves the hierarchy and note HTML. ZIP adds every referenced image so the backup restores on another device.
          </p>
          {[
            { label: 'Whole notebook (all semesters)', id: null, name: 'notebook' },
            { label: 'Current subject / folder', id: currentId, name: nodes.find((n) => n.id === currentId)?.title || 'item' },
          ].map((row) =>
            row.id === null || nodes.some((n) => n.id === row.id) ? (
              <div key={row.label} style={{ borderTop: '1px dashed var(--line)', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--label)', fontWeight: 400, fontSize: '1.05rem' }}>{row.label}</strong>
                  <span className="badge">{row.id ? 'selected' : 'everything'}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="btn xs" disabled={busy} onClick={() => exportNow(row.id, row.name, 'json')}><FileJson size={12} /> JSON</button>
                    <button className="btn xs accent" disabled={busy} onClick={() => exportNow(row.id, row.name, 'zip')}><FileArchive size={12} /> ZIP + images</button>
                  </span>
                </div>
              </div>
            ) : null
          )}
          <div className="note-box" style={{ marginTop: 12 }}>
            The whole-notebook JSON is the complete application data (semesters, subjects, nested folders, notes). Keep it somewhere safe.
            ZIP files also include an <code>assets/</code> folder and a README.
          </div>
        </div>
      )}

      {tab === 'format' && (
        <div>
          <div className="note-box">
            <strong>{FORMAT}</strong> v{VERSION}: <code>{'{ format, version, nodes: [Node…] }'}</code>. Each node needs
            <code> type</code> and <code>title</code>; <code>children</code> nests without a practical depth limit. Optional fields:
            <code> id, code, description, body, hours, source</code>. Note <code>body</code> is TipTap HTML. Images are
            <code> asset:&lt;id&gt;</code> references and travel inside ZIP backups.
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => downloadJSON('ktu-notes-example.json', EXAMPLE)}><Download size={14} /> Example JSON template</button>
            <button className="btn ghost" onClick={() => downloadBlobText('JSON_SCHEMA.md', SCHEMA_TEXT)}>Download schema notes</button>
          </div>
          <pre style={{ background: 'var(--paper)', border: '1px dashed var(--line)', borderRadius: 6, padding: 12, overflow: 'auto', fontFamily: 'var(--mono)', fontSize: '.62rem', lineHeight: 1.6 }}>
{`{
  "format": "ktu-notes",
  "version": 1,
  "nodes": [
    {
      "type": "subject",
      "title": "Computer Networks",
      "code": "PCCST501",
      "children": [
        { "type": "module", "title": "Module 1",
          "children": [
            { "type": "topic", "title": "Protocol layering",
              "children": [
                { "type": "note", "title": "OSI model",
                  "body": "<h2>OSI model</h2><p>…</p>" }
              ] } ] } ] } ] }`}
          </pre>
        </div>
      )}

      {tab === 'done' && summary && (
        <div>
          <div className="ok-box" style={{ fontSize: '.72rem' }}>
            <strong>Import complete.</strong>
            <div style={{ marginTop: 6 }}>
              {summary.nodes} items added · {summary.notes} notes · {summary.images} image(s) re-linked · {summary.mode} mode · into “{summary.target}”.
            </div>
          </div>
          <div className="row end">
            <button className="btn" onClick={() => { resetFile(); setTab('import'); }}>Import another</button>
            <button className="btn primary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function downloadBlobText(name, text) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const SCHEMA_TEXT = `# KTU Notes JSON format

Root: { "format": "ktu-notes", "version": 1, "nodes": [Node, ...] }

Node:
- type (required): semester | subject | folder | module | topic | subtopic | note | resource
- title (required): non-empty string
- id (optional): string; used for duplicate/collision detection
- code (optional): course code, mainly for subjects
- description, subtitle, category (optional strings)
- hours (optional number)
- body (optional string): TipTap HTML for notes
- children (optional array): unlimited nesting (validator caps at 60 levels)

Images in body are asset:<id>. Export as ZIP to include the binary files and
let the importer re-link them to each new note.

Import modes:
- Merge (default): every imported node gets a fresh id and is appended; nothing is overwritten.
- Replace by ID: nodes with matching ids are replaced after an explicit confirmation.

At the home/semester level, top-level nodes must be subjects. Inside a subject or
folder, any type is allowed. Array order becomes display order.
`;