'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Home as HomeIcon, Plus, Upload, Download, Star, Folder, FileText, Copy, ArrowUp, ArrowDown,
  Trash2, Pencil, UploadCloud, RotateCcw, CheckCircle2, Circle, MoreHorizontal, Cloud, ShieldAlert,
} from 'lucide-react';
import Header from '../components/Header';
import HomeView from '../components/Home';
import Tree from '../components/Tree';
import FolderView from '../components/FolderView';
import NoteEditor from '../components/Editor';
import ImportExport from '../components/ImportExport';
import CloudPanel from '../components/CloudPanel';
import MoveDialog from '../components/MoveDialog';
import AddEditDialog from '../components/AddEditDialog';
import { Menu, useUI } from '../components/ui';
import { useStore } from '../lib/store';
import { ancestors, childrenOf, descendants, isFolder, isNote, searchNodes, subjectOf, uid, progressOf } from '../lib/tree';
import { buildExport, downloadJSON, exportZip, safeName } from '../lib/io';
import { buildSeed } from '../lib/seed';
import {
  configured,
  WORKSPACE,
  pull,
  push,
  mergeNotebook,
  sameNotebook,
  uploadAsset,
  downloadAsset,
  deleteAssets,
  cloudHealth,
} from '../lib/cloud';
import { hooks, listAssets } from '../lib/db';

export default function Page() {
  const store = useStore();
  const ui = useUI();
  const nodes = store.nodes;
  const [semesterId, setSemesterId] = useState(store.semesterId);
  const [subjectId, setSubjectId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [menu, setMenu] = useState(null);
  const [addDlg, setAddDlg] = useState(null);
  const [editDlg, setEditDlg] = useState(null);
  const [moveDlg, setMoveDlg] = useState(null);
  const [io, setIo] = useState({ open: false, target: null });
  const [account, setAccount] = useState(false);

  const [sync, setSync] = useState({
    state: configured ? 'connecting' : 'off',
    label: configured ? 'Connecting…' : 'Local only',
    error: '',
    at: 0,
    count: 0,
    host: '',
  });
  const [autoSync, setAutoSync] = useState(true);
  const [busy, setBusy] = useState(false);
  const pushTimer = useRef(null);
  const skipPush = useRef(true);
  const known = useRef(null);
  const syncing = useRef(false);
  const assetsUploaded = useRef(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const storeRef = useRef(store);
  storeRef.current = store;
  const seedIdsRef = useRef(null);
  const seedIds = () => {
    if (!seedIdsRef.current) seedIdsRef.current = new Set(buildSeed().map((n) => n.id));
    return seedIdsRef.current;
  };

  const syncState = sync.state;
  const live = syncState === 'live';

  const semester = nodes.find((n) => n.id === semesterId) || nodes.find((n) => n.type === 'semester');
  const subject = subjectId ? nodes.find((n) => n.id === subjectId) : null;

  useEffect(() => {
    if (!semester && nodes.length) {
      const first = nodes.find((n) => n.type === 'semester');
      if (first) setSemesterId(first.id);
    }
  }, [nodes, semester]);

  // ------------------------------------------------------- shared cloud sync
  // No login: everyone shares one notebook. Each sync pulls the remote tree,
  // merges it with what is in this browser (newest `modified` wins per node),
  // then pushes the merged result back.
  const runSync = useCallback(async () => {
    if (!configured || syncing.current) return;
    syncing.current = true;
    try {
      setSync((x) => ({ ...x, state: 'syncing', label: 'Syncing…', error: '' }));
      const health = await cloudHealth();
      if (!health.ok) {
        setSync((x) => ({
          ...x,
          state: 'error',
          label: 'Cloud not ready',
          error:
            health.reason === 'legacy-schema'
              ? 'This Supabase project still uses the old login schema. Run supabase/schema.sql once to migrate it to the shared notebook. Everything stays editable locally until then.'
              : health.reason === 'missing-tables'
              ? 'Cloud tables are missing. Run supabase/schema.sql in the Supabase SQL editor.'
              : health.reason === 'rls'
              ? 'Row Level Security blocked the request. Re-run supabase/schema.sql to allow the shared notebook.'
              : health.reason,
          host: health.host || '',
        }));
        return;
      }
      const remote = await pull();
      const local = nodesRef.current || [];
      let next = local;
      if (!remote.length) {
        if (local.length) await push(local);
      } else {
        next = mergeNotebook(local, remote, known.current, known.current ? null : seedIds());
        if (!sameNotebook(local, next)) {
          skipPush.current = true;
          storeRef.current.replaceAll(next);
        }
        await push(next, { knownIds: known.current });
      }
      known.current = new Map(next.map((n) => [n.id, n.modified || 0]));
      setSync({
        state: 'live',
        label: 'Shared · synced',
        error: '',
        at: Date.now(),
        count: next.length,
        host: health.host || '',
      });
      if (!assetsUploaded.current) {
        assetsUploaded.current = true;
        try {
          for (const a of await listAssets()) await uploadAsset(a.id, a.blob, a);
        } catch (e) {
          setSync((x) => ({ ...x, error: String(e.message || e) }));
        }
      }
    } catch (e) {
      setSync((x) => ({ ...x, state: 'error', label: 'Sync failed', error: String(e.message || e) }));
    } finally {
      syncing.current = false;
    }
  }, []);

  // Images are mirrored through the same anonymous connection.
  useEffect(() => {
    if (!configured) return;
    hooks.put = (id, blob, meta) => uploadAsset(id, blob, meta);
    hooks.get = (id) => downloadAsset(id);
    hooks.del = (ids) => deleteAssets(ids);
    hooks.err = (e) => setSync((x) => ({ ...x, error: String(e.message || e) }));
    return () => {
      hooks.put = hooks.get = hooks.del = null;
    };
  }, []);

  // First sync once the local notebook has loaded.
  useEffect(() => {
    if (!configured || !store.ready) return;
    runSync();
  }, [configured, store.ready, runSync]);

  // Push after edits, ~1.4 s after they settle.
  useEffect(() => {
    if (!configured || !store.ready) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => runSync(), 1400);
    return () => clearTimeout(pushTimer.current);
  }, [nodes, store.ready, runSync]);

  // Poll for other people's edits while the tab is visible.
  useEffect(() => {
    if (!configured || !store.ready || !autoSync) return;
    const tick = () => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) runSync();
    };
    const id = setInterval(tick, 20000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', tick);
    };
  }, [configured, store.ready, autoSync, runSync]);

  const syncNow = async () => {
    setBusy(true);
    try {
      await runSync();
    } finally {
      setBusy(false);
    }
  };
  const pullCloud = async () => {
    if (!configured) return;
    const ok = await ui.confirm({
      title: 'Replace this browser’s copy?',
      body: 'Everything here is replaced by the shared notebook from the cloud. Local changes that were never synced are lost.',
      confirmText: 'Pull cloud copy',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const remote = await pull();
      skipPush.current = true;
      storeRef.current.replaceAll(remote);
      known.current = new Map(remote.map((n) => [n.id, n.modified || 0]));
      setSync((x) => ({ ...x, state: 'live', label: 'Shared · synced', error: '', at: Date.now(), count: remote.length }));
      ui.toast('Pulled the shared notebook', 'ok');
    } catch (e) {
      ui.toast(`Pull failed: ${e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };
  const uploadLocal = async () => {
    if (!configured) return;
    const ok = await ui.confirm({
      title: 'Overwrite the shared notebook?',
      body: 'The cloud copy becomes exactly what is in this browser, including deleting items that only exist in the cloud. Images upload too.',
      confirmText: 'Overwrite cloud',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      for (const a of await listAssets()) await uploadAsset(a.id, a.blob, a);
      await push(nodesRef.current, { knownIds: null });
      known.current = new Map(nodesRef.current.map((n) => [n.id, n.modified || 0]));
      setSync((x) => ({ ...x, state: 'live', label: 'Shared · synced', error: '', at: Date.now(), count: nodesRef.current.length }));
      ui.toast('Shared notebook replaced', 'ok');
    } catch (e) {
      setSync((x) => ({ ...x, state: 'error', label: 'Sync failed', error: String(e.message || e) }));
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------- navigation
  const touch = store.touchNode;
  const openNode = useCallback(
    (id) => {
      const n = nodesRef.current.find((x) => x.id === id);
      if (!n) return;
      const subj = subjectOf(nodesRef.current, id);
      if (subj) setSubjectId(subj.id);
      setSelectedId(n.type === 'semester' ? null : id);
      if (n.type === 'semester') {
        setSemesterId(n.id);
        setSubjectId(null);
      }
      touch(id);
      setQuery('');
      setSidebar(false);
    },
    [touch]
  );

  const openSubject = (id) => {
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n) return;
    setSubjectId(id);
    setSelectedId(null);
    touch(id);
    setQuery('');
    setSidebar(false);
  };

  const home = () => {
    setSubjectId(null);
    setSelectedId(null);
    setQuery('');
    setSemesterId(store.semesterId);
  };

  // ------------------------------------------------------------- actions
  const openMenu = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, node });
  };

  const menuItems = useMemo(() => {
    const n = menu?.node;
    if (!n) return [];
    const items = [];
    if (isFolder(n)) items.push({ label: 'Open folder', icon: <Folder size={13} />, onClick: () => openNode(n.id) });
    if (isNote(n)) items.push({ label: 'Open note', icon: <FileText size={13} />, onClick: () => openNode(n.id) });
    if (n.type === 'subject') items.push({ label: 'Edit subject', icon: <Pencil size={13} />, onClick: () => setEditDlg(n) });
    else items.push({ label: 'Rename', icon: <Pencil size={13} />, onClick: () => renameNode(n) });
    if (isFolder(n)) items.push({ label: 'Add child…', icon: <Plus size={13} />, onClick: () => setAddDlg(n) });
    items.push({ sep: true });
    items.push({ label: 'Duplicate', icon: <Copy size={13} />, onClick: () => duplicate(n) });
    items.push({ label: 'Move to…', icon: <UploadCloud size={13} />, onClick: () => setMoveDlg(n) });
    items.push({ label: 'Move up', icon: <ArrowUp size={13} />, onClick: () => store.reorder(n.id, -1) });
    items.push({ label: 'Move down', icon: <ArrowDown size={13} />, onClick: () => store.reorder(n.id, 1) });
    if (n.type === 'subject' || isFolder(n)) {
      items.push({
        label: n.pinned ? 'Unpin' : 'Pin to top',
        icon: <Star size={13} />,
        onClick: () => store.patchNode(n.id, { pinned: !n.pinned }),
      });
    }
    if (isNote(n)) {
      items.push({
        label: n.progress === 'done' ? 'Mark not studied' : 'Mark studied',
        icon: n.progress === 'done' ? <Circle size={13} /> : <CheckCircle2 size={13} />,
        onClick: () => store.toggleProgress(n.id),
      });
    }
    items.push({ sep: true });
    items.push({ label: 'Export JSON', icon: <Download size={13} />, onClick: () => exportNode(n, 'json') });
    items.push({ label: 'Export ZIP + images', icon: <Download size={13} />, onClick: () => exportNode(n, 'zip') });
    if (n.type === 'subject') {
      items.push({
        label: 'Restore missing syllabus',
        icon: <RotateCcw size={13} />,
        onClick: async () => {
          const ok = await ui.confirm({
            title: 'Restore the default syllabus?',
            body: 'Missing default modules, topics and subtopics are re-added. Existing (edited) items are left untouched.',
            confirmText: 'Restore',
            danger: false,
          });
          if (ok) {
            const added = store.restoreSubjectSyllabus(n.id);
            ui.toast(added ? 'Missing syllabus entries restored' : 'Nothing to restore', added ? 'ok' : 'error');
          }
        },
      });
    }
    items.push({ label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => deleteNode(n) });
    return items;
  }, [menu, openNode]);

  const addChild = (parent) => {
    setMenu(null);
    if (parent.type === 'semester') setAddDlg(parent);
    else if (parent.type === 'note') setAddDlg(nodes.find((n) => n.id === parent.parentId) || parent);
    else setAddDlg(parent);
  };

  const renameNode = async (n) => {
    const title = await ui.prompt({ title: 'Rename', label: 'Title', initial: n.title, confirmText: 'Rename' });
    if (title) {
      store.patchNode(n.id, { title });
      ui.toast('Renamed', 'ok', 1500);
    }
  };

  const duplicate = async (n) => {
    if (isNote(n) && String(n.body || '').includes('<img')) {
      ui.toast('Duplicating with images…');
    }
    const clone = await store.duplicateNode(n.id);
    if (clone) {
      ui.toast(`Duplicated “${n.title}”`, 'ok');
      openNode(clone.id);
    }
  };

  const deleteNode = async (n) => {
    const desc = descendants(nodes, n.id);
    const notes = desc.filter(isNote).length;
    const ok = await ui.confirm({
      title: `Delete “${n.title}”?`,
      body: desc.length
        ? `${desc.length} nested item(s) will go too${notes ? `, including ${notes} note(s) and their images` : ''}. This cannot be undone.`
        : isNote(n)
        ? 'The note and its images will be removed. This cannot be undone.'
        : 'This empty folder will be removed.',
    });
    if (!ok) return;
    const ids = await store.removeNodes(n.id);
    if (selectedId && ids.includes(selectedId)) {
      const parent = n.parentId;
      setSelectedId(null);
      if (parent === subjectId) openNode(parent);
    }
    if (subjectId === n.id) setSubjectId(null);
    ui.toast('Deleted', 'ok');
  };

  const exportNode = async (n, kind) => {
    try {
      if (kind === 'zip') {
        const r = await exportZip(nodes, [n.id], n.title);
        ui.toast(`ZIP ready${r.missing ? ` - ${r.missing} image(s) missing` : ''}`, r.missing ? 'error' : 'ok', 5000);
      } else {
        downloadJSON(`${safeName(n.title)}.json`, buildExport(nodes, [n.id]));
        ui.toast('JSON export downloaded', 'ok');
      }
    } catch (e) {
      ui.toast(`Export failed: ${e.message}`, 'error');
    }
  };

  const saveDialog = (data) => {
    if (data.mode === 'edit') {
      const patch = { title: data.title, description: data.description };
      if (data.node?.type === 'subject' || data.node?.type === 'semester') patch.code = data.code;
      store.patchNode(data.node.id, patch);
      setEditDlg(null);
      ui.toast('Saved', 'ok');
      return;
    }
    if (data.mode === 'semester') {
      const node = store.addNode({
        parentId: null,
        type: 'semester',
        title: data.title,
        semesterNo: data.semesterNo,
        source: 'personal',
        order: 99,
      });
      setAddDlg(null);
      setSemesterId(node.id);
      setSubjectId(null);
      ui.toast('Semester added', 'ok');
      return;
    }
    if (data.type === 'subject') {
      store.addSubject({ title: data.title, code: data.code, description: data.description, semesterId: data.parentId });
      setAddDlg(null);
      ui.toast('Subject added', 'ok');
      setQuery('');
      setTimeout(() => {
        const created = nodesRef.current.find((n) => n.type === 'subject' && n.title === data.title);
        if (created) openSubject(created.id);
      }, 60);
      return;
    }
    const node = store.addNode({
      parentId: data.parentId,
      type: data.type,
      title: data.title,
      description: data.description,
      body: '',
      source: 'personal',
    });
    setAddDlg(null);
    setTimeout(() => openNode(node.id), 80);
    ui.toast(`${data.type} added`, 'ok');
  };

  // ------------------------------------------------------------- derived
  const results = useMemo(() => (query.trim() ? searchNodes(nodes, query) : []), [nodes, query]);
  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const paneNode = selected && selected.type !== 'semester' ? selected : subject;
  const crumbNode = selected || subject;

  const onMoveDrop = (dragId, targetId, pos) => {
    if (!dragId || dragId === targetId) return;
    const target = nodes.find((n) => n.id === targetId);
    if (!target) return;
    if (pos === 'inside') {
      if (!isFolder(target)) return;
      store.moveNode(dragId, target.id, null);
    } else {
      const parentId = target.parentId ?? null;
      const sibs = childrenOf(nodes, parentId).filter((n) => n.id !== dragId);
      let index = sibs.findIndex((n) => n.id === targetId);
      if (index < 0) index = sibs.length;
      if (pos === 'after') index += 1;
      store.moveNode(dragId, parentId, index);
    }
    ui.toast('Moved', 'ok', 1400);
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (e.key === '/' && !editing) {
        e.preventDefault();
        document.querySelector('.searchbox input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const importTarget = io.target || selectedId || subjectId || semesterId;

  // ------------------------------------------------------------- render
  if (!store.ready) {
    return (
      <div className="shell">
        <div className="brand" style={{ marginBottom: 26 }}>
          <span className="mark">📒</span>
          <div><h1>KTU Notes</h1><small>opening the notebook…</small></div>
        </div>
        <div className="paper yellow torn-a" style={{ padding: 30 }}>
          <span className="hand" style={{ fontSize: '1.5rem' }}>Finding your place…</span>
        </div>
      </div>
    );
  }
  return (
    <div className="shell">
      <Header
        semesters={nodes.filter((n) => n.type === 'semester').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
        semesterId={semester?.id}
        onSemester={(id) => {
          setSemesterId(id);
          setSubjectId(null);
          setSelectedId(null);
          setQuery('');
        }}
        onAddSemester={() => setAddDlg({ mode: 'semester', parent: semester || { semesterNo: 5 } })}
        query={query}
        setQuery={setQuery}
        onHome={home}
        onImport={() => setIo({ open: true, target: importTarget })}
        onExport={() => setIo({ open: true, target: importTarget, tab: 'export' })}
        onAddSubject={() => setAddDlg(semester || { id: null, type: 'semester', title: 'Semester' })}
        mode={live ? 'cloud' : syncState === 'error' ? 'error' : syncState === 'syncing' || syncState === 'connecting' ? 'syncing' : 'local'}
        syncLabel={sync.label}
        onCloud={() => setAccount(true)}
        onToggleSidebar={() => setSidebar((s) => !s)}
        showSidebarToggle={Boolean(subjectId)}
      />

      {syncState === 'error' && sync.error && (
        <div className="paper pink torn-c" style={{ marginBottom: 18, padding: '14px 18px' }}>
          <div className="mono" style={{ fontSize: '.66rem', lineHeight: 1.6 }}>
            <ShieldAlert size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
            <strong>Cloud sync is not available right now.</strong> Your notebook is safe in this browser and keeps working locally.
            <div style={{ marginTop: 4 }}>{sync.error}</div>
            <button className="btn xs" style={{ marginTop: 8 }} onClick={() => setAccount(true)}>Storage settings</button>
          </div>
        </div>
      )}

      {query.trim() ? (
        <HomeView
          nodes={nodes}
          semester={semester}
          onOpenSubject={openSubject}
          onAddSubject={() => setAddDlg(semester || { id: null, type: 'semester', title: 'Semester' })}
          onPin={(n) => store.patchNode(n.id, { pinned: !n.pinned })}
          onMenu={openMenu}
          onOpenNode={openNode}
          onImport={() => setIo({ open: true, target: importTarget })}
          onExport={() => setIo({ open: true, target: importTarget, tab: 'export' })}
          onRestore={restoreAll}
          query={query}
          results={results}
          onClearSearch={() => setQuery('')}
        />
      ) : subject ? (
        <div className="workspace">
          <aside className={`binder ${sidebar ? '' : 'mobile-hidden'}`} aria-label="Contents">
            <div className="rings" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => <i key={i} />)}
            </div>
            <div className="binder-head">
              <button className="crumb" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={home}>
                ← Semester {semester?.semesterNo || 5}
              </button>
              <h3>{subject.title}</h3>
              <div className="code">{subject.code}</div>
            </div>
            <div className="binder-scroll">
              {!live && (
                <div className="offline-note">
                  Not synced to the shared notebook. This copy lives in this browser - export a ZIP backup now and then.
                </div>
              )}
              <Tree
                nodes={nodes}
                subjectId={subject.id}
                selectedId={selectedId}
                onSelect={openNode}
                onAdd={addChild}
                onMenu={openMenu}
                onMove={onMoveDrop}
              />
            </div>
            <div className="binder-foot">
              <button className="btn xs primary" onClick={() => addChild(subject)}><Plus size={12} /> Add</button>
              <button className="btn xs" onClick={() => setIo({ open: true, target: selectedId || subjectId })}><Upload size={12} /> Import</button>
              <button className="btn xs" onClick={() => exportNode(selected || subject, 'zip')}><Download size={12} /> ZIP</button>
              <button className="btn xs ghost" onClick={home}><HomeIcon size={12} /> Home</button>
            </div>
          </aside>

          <main className="pane">
            <nav className="crumb-bar" aria-label="Breadcrumb">
              <button onClick={home}><HomeIcon size={11} /> Notebook</button>
              {(semester ? [semester, ...ancestors(nodes, crumbNode?.id || subject.id).filter((n) => n.type !== 'semester')] : ancestors(nodes, crumbNode?.id || subject.id)).map((n, i, arr) => (
                <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className="sep">›</span>
                  <button
                    className={i === arr.length - 1 ? 'current' : ''}
                    onClick={() => {
                      if (n.type === 'semester') home();
                      else openNode(n.id);
                    }}
                  >
                    {n.type === 'module' ? `Module ${n.moduleNo || ''}` : n.title}
                  </button>
                </span>
              ))}
            </nav>

            {paneNode && isNote(paneNode) ? (
              <NoteEditor
                key={paneNode.id}
                node={paneNode}
                onSave={(body) => store.setBody(paneNode.id, body)}
                onTitle={(title) => store.patchNode(paneNode.id, { title })}
                onBack={() => {
                  const parent = nodes.find((n) => n.id === paneNode.parentId);
                  if (parent) openNode(parent.id);
                }}
                onDelete={deleteNode}
                onDuplicate={duplicate}
                onToggleProgress={store.toggleProgress}
                onOpenMove={(n) => setMoveDlg(n)}
              />
            ) : paneNode ? (
              <FolderView
                node={paneNode}
                nodes={nodes}
                onSelect={openNode}
                onAdd={addChild}
                onMenu={openMenu}
                onEdit={(n) => setEditDlg(n)}
                onDelete={deleteNode}
                onExport={(n) => exportNode(n, 'zip')}
                onImport={(n) => setIo({ open: true, target: n.id })}
                onRestore={async (n) => {
                  const ok = await ui.confirm({
                    title: 'Restore the default syllabus?',
                    body: 'Missing default modules, topics and subtopics are re-added. Existing items (including your edits) are untouched.',
                    confirmText: 'Restore',
                    danger: false,
                  });
                  if (ok) {
                    const added = store.restoreSubjectSyllabus(n.id);
                    ui.toast(added ? 'Missing syllabus entries restored' : 'Nothing to restore', added ? 'ok' : 'error');
                  }
                }}
                onToggleProgress={store.toggleProgress}
              />
            ) : (
              <div className="empty-state">Select an item from the contents panel.</div>
            )}

            {selected && isNote(selected) && selected.category === 'syllabus' && (
              <p className="kbd-hint" style={{ marginTop: 12, textAlign: 'right' }}>
                Official syllabus content · editable and deletable like any other note.
              </p>
            )}
          </main>
        </div>
      ) : (
        <HomeView
          nodes={nodes}
          semester={semester}
          onOpenSubject={openSubject}
          onAddSubject={() => setAddDlg(semester || { id: null, type: 'semester', title: 'Semester' })}
          onPin={(n) => store.patchNode(n.id, { pinned: !n.pinned })}
          onMenu={openMenu}
          onOpenNode={openNode}
          onImport={() => setIo({ open: true, target: importTarget })}
          onExport={() => setIo({ open: true, target: importTarget, tab: 'export' })}
          onRestore={restoreAll}
          query={query}
          results={results}
          onClearSearch={() => setQuery('')}
        />
      )}

      <ImportExport
        open={io.open}
        onClose={() => setIo({ open: false, target: null })}
        nodes={nodes}
        semesterId={semester?.id || store.semesterId}
        currentId={io.target || selectedId || subjectId}
        initialTab={io.tab || 'import'}
        onCommit={(next) => {
          skipPush.current = true;
          store.replaceAll(next);
        }}
      />

      <CloudPanel
        open={account}
        onClose={() => setAccount(false)}
        configured={configured}
        workspace={WORKSPACE}
        host={sync.host}
        state={syncState}
        label={sync.label}
        error={sync.error}
        lastSync={sync.at}
        localCount={nodes.length}
        cloudCount={sync.count}
        busy={busy}
        autoSync={autoSync}
        onAutoSync={setAutoSync}
        onSyncNow={syncNow}
        onPullCloud={pullCloud}
        onUploadLocal={uploadLocal}
      />

      <AddEditDialog
        open={Boolean(addDlg)}
        mode={addDlg?.mode === 'semester' ? 'semester' : 'add'}
        parent={addDlg?.mode === 'semester' ? addDlg.parent : addDlg}
        onClose={() => setAddDlg(null)}
        onSave={saveDialog}
      />
      <AddEditDialog
        open={Boolean(editDlg)}
        mode="edit"
        node={editDlg}
        onClose={() => setEditDlg(null)}
        onSave={saveDialog}
      />
      {moveDlg && (
        <MoveDialog
          node={moveDlg}
          nodes={nodes}
          onClose={() => setMoveDlg(null)}
          onMove={(id, target) => {
            store.moveNode(id, target, null);
            setMoveDlg(null);
            ui.toast('Moved', 'ok');
          }}
        />
      )}

      {menu && <Menu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}

      <footer style={{ marginTop: 44, paddingTop: 14, borderTop: '1px dashed var(--line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="kbd-hint">
          {store.saveState === 'saving' ? 'saving locally…' : store.saveState === 'error' ? 'local save failed' : 'saved in this browser'}
          {' · '}
          {live ? 'shared cloud sync on' : configured ? 'shared cloud not synced' : 'local mode'}
        </span>
        {store.storageError && <span className="kbd-hint" style={{ color: 'var(--red)' }}>{store.storageError}</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn xs ghost" onClick={() => setIo({ open: true, target: semesterId, tab: 'format' })}>JSON format</button>
          <button className="btn xs ghost" onClick={() => setIo({ open: true, target: semesterId, tab: 'export' })}><Download size={11} /> Backup</button>
        </span>
      </footer>
    </div>
  );

  async function restoreAll() {
    const ok = await ui.confirm({
      title: 'Restore default syllabus content?',
      body: 'Any missing default subject, module, topic or subtopic is re-added. Your edits and personal notes are kept.',
      confirmText: 'Restore defaults',
      danger: false,
    });
    if (!ok) return;
    store.restoreDefaults();
    ui.toast('Default entries restored where missing', 'ok');
  }
}
