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
import Account from '../components/Account';
import MoveDialog from '../components/MoveDialog';
import AddEditDialog from '../components/AddEditDialog';
import { Menu, useUI } from '../components/ui';
import { useStore } from '../lib/store';
import { ancestors, childrenOf, descendants, isFolder, isNote, searchNodes, subjectOf, uid, progressOf } from '../lib/tree';
import { buildExport, downloadJSON, exportZip, safeName } from '../lib/io';
import { configured, sb, pull, push, uploadAsset, downloadAsset, deleteAssets, cloudHealth } from '../lib/cloud';
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

  const [user, setUser] = useState(null);
  const [cloudMode, setCloudMode] = useState(configured ? 'local' : 'unconfigured');
  const [cloudLabel, setCloudLabel] = useState(configured ? 'Local only' : 'Local mode');
  const [cloudError, setCloudError] = useState('');
  const [cloudPrompt, setCloudPrompt] = useState(null);
  const [busy, setBusy] = useState(false);
  const decision = useRef(null);
  const pushTimer = useRef(null);
  const skipPush = useRef(false);
  const knownIds = useRef(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const semester = nodes.find((n) => n.id === semesterId) || nodes.find((n) => n.type === 'semester');
  const subject = subjectId ? nodes.find((n) => n.id === subjectId) : null;

  useEffect(() => {
    if (!semester && nodes.length) {
      const first = nodes.find((n) => n.type === 'semester');
      if (first) setSemesterId(first.id);
    }
  }, [nodes, semester]);

  // ------------------------------------------------------------- cloud auth
  useEffect(() => {
    if (!configured) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setUser(data.session?.user || null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (alive) setUser(session?.user || null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      decision.current = null;
      setCloudMode(configured ? 'local' : 'unconfigured');
      setCloudLabel(configured ? 'Local only' : 'Local mode');
      setCloudPrompt(null);
      hooks.put = hooks.get = hooks.del = null;
      return;
    }

    let alive = true;
    (async () => {
      setCloudError('');
      setCloudLabel('Checking cloud…');
      const health = await cloudHealth(user.id);
      if (!alive) return;
      if (!health.ok) {
        setCloudLabel('Cloud not ready');
        setCloudError(
          health.reason === 'missing-tables'
            ? 'Cloud tables are missing. Run supabase/schema.sql in the Supabase SQL editor.'
            : health.reason === 'rls'
            ? 'Row Level Security blocked the request. Check the policies in supabase/schema.sql.'
            : health.reason
        );
        setCloudMode('error');
        return;
      }
      hooks.put = (id, blob, meta) => uploadAsset(user.id, id, blob, meta);
      hooks.get = (id) => downloadAsset(id);
      hooks.del = (ids) => deleteAssets(ids);
      hooks.err = (e) => setCloudError(String(e.message || e));

      try {
        const remote = await pull(user.id);
        if (!alive) return;
        if (!remote.length) {
          await push(nodesRef.current, user.id);
          knownIds.current = new Set(nodesRef.current.map((n) => n.id));
          decision.current = 'cloud';
          setCloudMode('cloud');
          setCloudLabel('Synced');
        } else {
          setCloudPrompt({ count: remote.length, rows: remote });
          setCloudLabel('Choose a copy');
          setCloudMode('local');
        }
      } catch (e) {
        setCloudError(String(e.message || e));
        setCloudMode('error');
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  // Push after edits, but only once a copy decision exists.
  useEffect(() => {
    if (cloudMode !== 'cloud' || !user || !store.ready) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    setCloudLabel('Saving to cloud…');
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await push(nodesRef.current, user.id, { knownIds: knownIds.current });
        knownIds.current = new Set(nodesRef.current.map((n) => n.id));
        setCloudLabel('Synced');
        setCloudError('');
      } catch (e) {
        setCloudLabel('Sync failed');
        setCloudError(String(e.message || e));
      }
    }, 1600);
    return () => clearTimeout(pushTimer.current);
  }, [nodes, cloudMode, user, store.ready]);

  const signIn = async (email, password) => {
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return '';
    } finally {
      setBusy(false);
    }
  };
  const signUp = async (email, password) => {
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      return data.session ? 'Account created and signed in.' : 'Check your email to confirm, then sign in.';
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    await sb.auth.signOut();
    setAccount(false);
    setCloudMode('local');
    setCloudLabel('Local only');
  };
  const loadCloud = async () => {
    if (!cloudPrompt) return;
    const ok = await ui.confirm({
      title: 'Load the cloud copy?',
      body: 'The notebook in this browser will be replaced by the cloud copy. Export a backup first if you are unsure.',
      confirmText: 'Load cloud copy',
      danger: false,
    });
    if (!ok) return;
    skipPush.current = true;
    store.replaceAll(cloudPrompt.rows);
    knownIds.current = new Set(cloudPrompt.rows.map((n) => n.id));
    decision.current = 'cloud';
    setCloudPrompt(null);
    setCloudMode('cloud');
    setCloudLabel('Synced');
    setAccount(false);
  };
  const uploadLocal = async () => {
    const ok = await ui.confirm({
      title: 'Upload this browser’s notebook?',
      body: 'The cloud copy will be replaced by what is in this browser. Images will upload too.',
      confirmText: 'Upload this copy',
      danger: false,
    });
    if (!ok) return;
    setBusy(true);
    try {
      for (const a of await listAssets()) await uploadAsset(user.id, a.id, a.blob, a);
      await push(nodesRef.current, user.id);
      knownIds.current = new Set(nodesRef.current.map((n) => n.id));
      decision.current = 'cloud';
      setCloudPrompt(null);
      setCloudMode('cloud');
      setCloudLabel('Synced');
      setAccount(false);
      ui.toast('Notebook uploaded', 'ok');
    } catch (e) {
      setCloudError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };
  const uploadedFor = useRef(null);
  useEffect(() => {
    if (cloudMode !== 'cloud' || !user || uploadedFor.current === user.id) return;
    uploadedFor.current = user.id;
    (async () => {
      try {
        for (const a of await listAssets()) await uploadAsset(user.id, a.id, a.blob, a);
      } catch (e) {
        setCloudError(String(e.message || e));
      }
    })();
  }, [cloudMode, user]);

  const syncNow = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const remote = await pull(user.id);
      if (remote.length) {
        skipPush.current = true;
        store.replaceAll(remote);
        knownIds.current = new Set(remote.map((n) => n.id));
        setCloudLabel('Synced');
        setCloudError('');
        ui.toast('Pulled the latest cloud copy', 'ok');
      } else {
        await push(nodesRef.current, user.id);
      }
    } catch (e) {
      setCloudError(String(e.message || e));
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
        ui.toast(`ZIP ready${r.missing ? ` — ${r.missing} image(s) missing` : ''}`, r.missing ? 'error' : 'ok', 5000);
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
        mode={cloudMode === 'cloud' ? 'cloud' : cloudMode === 'error' ? 'error' : cloudLabel.includes('Saving') ? 'syncing' : 'local'}
        syncLabel={cloudLabel}
        onCloud={() => setAccount(true)}
        onToggleSidebar={() => setSidebar((s) => !s)}
        showSidebarToggle={Boolean(subjectId)}
      />

      {cloudMode === 'error' && cloudError && (
        <div className="paper pink torn-c" style={{ marginBottom: 18, padding: '14px 18px' }}>
          <div className="mono" style={{ fontSize: '.66rem', lineHeight: 1.6 }}>
            <ShieldAlert size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
            <strong>Cloud sync is not available right now.</strong> Your notebook is safe in this browser and keeps working locally.
            <div style={{ marginTop: 4 }}>{cloudError}</div>
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
              {cloudMode === 'local' && (
                <div className="offline-note">
                  Local-only mode. This notebook lives in this browser — export a ZIP backup now and then.
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

      <Account
        open={account}
        onClose={() => setAccount(false)}
        configured={configured}
        user={user}
        syncLabel={cloudLabel}
        syncError={cloudError}
        onSignIn={signIn}
        onSignUp={signUp}
        onSignOut={signOut}
        onSyncNow={syncNow}
        cloudPrompt={cloudPrompt}
        onLoadCloud={loadCloud}
        onUploadLocal={uploadLocal}
        localCount={nodes.length}
        cloudCount={cloudPrompt?.count || 0}
        busy={busy}
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
          {cloudMode === 'cloud' ? 'cloud sync on' : configured ? 'cloud configured, local copy active' : 'local mode'}
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
