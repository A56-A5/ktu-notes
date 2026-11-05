'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { kvGet, kvSet, putAsset, getAsset, delAssetsFor } from './db';
import {
  childrenOf,
  descendants,
  nextOrder,
  canMove,
  uid,
  isNote,
  progressOf,
  byOrder,
} from './tree';
import {
  buildSeed,
  buildExamScheduleNote,
  EXAM_SCHEDULE_VERSION,
  SEMESTER_ID,
  SUBJECT_DEFS,
  syllabusHtml,
  NOTE_LIBRARY,
  MODULE_LIBRARY,
  LIBRARY_VERSION,
} from './seed';

const Store = createContext(null);
const LS_KEY = 'ktu-notes-fallback-v2';

function countDescendants(list, id) {
  const childMap = new Map();
  for (const n of list) {
    if (!childMap.has(n.parentId)) childMap.set(n.parentId, []);
    childMap.get(n.parentId).push(n);
  }
  const seen = new Set();
  const walk = (pid) => {
    let c = 0;
    for (const n of childMap.get(pid) || []) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      c += 1 + walk(n.id);
    }
    return c;
  };
  return walk(id);
}

// One-time refresh of library-backed subjects (e.g. Data Mining) that were
// seeded before the ready-made module libraries existed. When a subject's
// libraryVersion is missing or older, its old scaffolded subtree (old note
// ids like ...-t1-n1) is replaced with the current module > topic > note
// library, preserving any user-created nodes (they are re-parented under the
// subject). Deterministic ids, so the same upgrade on another device merges
// cleanly. Idempotent once a subject carries the current libraryVersion.
function upgradeModuleLibrary(list) {
  let out = list.slice();
  let changed = false;
  const childMap = new Map();
  for (const n of out) {
    if (!childMap.has(n.parentId)) childMap.set(n.parentId, []);
    childMap.get(n.parentId).push(n);
  }
  const subtree = (sid) => {
    const set = new Set([sid]);
    const stack = [sid];
    while (stack.length) {
      for (const c of childMap.get(stack.pop()) || []) {
        if (!set.has(c.id)) {
          set.add(c.id);
          stack.push(c.id);
        }
      }
    }
    return set;
  };
  for (const key of Object.keys(MODULE_LIBRARY)) {
    const sid = `sub-${key}`;
    const subject = out.find((n) => n.id === sid);
    if (!subject || subject.libraryVersion === LIBRARY_VERSION) continue;
    const seed = buildSeed();
    const fresh = seed.filter((n) => n.id === sid || n.id.startsWith(`${key}-`));
    const seedIds = new Set(fresh.map((n) => n.id));
    const seedShape = new RegExp(`^${key}(-syllabus|-m\\d+(-t\\d+(-[ns]\\d+)?)?)$`);
    const inTree = subtree(sid);
    const keep = out.filter((n) => !inTree.has(n.id));
    const userNodes = out
      .filter(
        (n) =>
          inTree.has(n.id) &&
          n.id !== sid &&
          !seedShape.test(n.id) &&
          !seedIds.has(n.id)
      )
      .map((n) => (inTree.has(n.parentId) && !seedShape.test(n.parentId) ? n : { ...n, parentId: sid }));
    const byId = new Map(fresh.map((n) => [n.id, n]));
    byId.set(sid, { ...subject, libraryVersion: LIBRARY_VERSION });
    out = [...keep, ...Array.from(byId.values()), ...userNodes];
    changed = true;
  }
  return { nodes: out, changed };
}

// Adds the semester exam-timetable note to notebooks that were saved before it
// existed. Never overwrites an existing (possibly edited) copy.
function ensureExamNote(list) {
  const semester = list.find((n) => n.type === 'semester');
  if (!semester) return { nodes: list, changed: false };
  const id = `${semester.id}-exams`;
  const fresh = buildExamScheduleNote(semester.id);
  const existing = list.find((n) => n.id === id);
  if (!existing) return { nodes: [...list, fresh], changed: true };
  // Refresh a copy that still carries the generated text (nobody edited it) so
  // an updated timetable actually shows up. Edited copies are left alone.
  const untouched = Math.abs((existing.modified || 0) - (existing.createdAt || 0)) < 5000;
  if (untouched && (existing.seedVersion || 0) < EXAM_SCHEDULE_VERSION) {
    return {
      nodes: list.map((n) =>
        n.id === id
          ? { ...n, body: fresh.body, description: fresh.description, seedVersion: EXAM_SCHEDULE_VERSION, modified: Date.now() }
          : n
      ),
      changed: true,
    };
  }
  return { nodes: list, changed: false };
}

// Fills empty seed-note bodies from the study library (notes-cn and friends),
// drops exact duplicate node ids, and merges duplicate seed subjects with the
// same code (keeping the copy that has content). Idempotent.
function healNotes(list, defs) {
  let changed = false;
  // Keep printed course codes current. A subject whose title matches a seeded
  // subject but whose code no longer does (e.g. PECST525 -> PECDT525 when the
  // timetable code changed) is corrected in place; the fresh `modified` lets
  // the fix win the cloud merge and reach other devices.
  const codeFixes = new Map();
  list = list.map((n) => {
    if (n.type !== 'subject' || !n.title) return n;
    const def = defs.find((d) => d.code === n.code) || defs.find((d) => d.title === n.title);
    if (!def || n.code === def.code) return n;
    changed = true;
    if (n.code) codeFixes.set(n.id, { from: n.code, to: def.code });
    return { ...n, code: def.code, modified: Date.now() };
  });
  if (codeFixes.size) {
    // The generated Syllabus note repeats the course code in its heading and
    // verification line - keep that text in step with the renamed subject.
    list = list.map((n) => {
      const fix = codeFixes.get(n.parentId);
      if (!fix || n.category !== 'syllabus' || !n.body || !n.body.includes(fix.from)) return n;
      changed = true;
      return { ...n, body: n.body.split(fix.from).join(fix.to), modified: Date.now() };
    });
  }
  const parent = new Map(list.map((n) => [n.id, n]));
  const subjectOf = (n) => {
    let p = n;
    let guard = 0;
    while (p && guard++ < 16) {
      if (p.type === 'subject') return p;
      p = p.parentId ? parent.get(p.parentId) : null;
    }
    return null;
  };
  const libraryFor = (subj) => {
    if (!subj) return null;
    const def =
      defs.find((d) => d.code === subj.code) || defs.find((d) => d.title === subj.title);
    return (def && NOTE_LIBRARY[def.key]) || null;
  };
  let out = list.map((n) => {
    if (n.type !== 'note' || n.body) return n;
    const lib = libraryFor(subjectOf(parent.get(n.parentId) || n));
    const body = lib && lib[n.title];
    if (!body) return n;
    changed = true;
    return { ...n, body, source: n.source === 'official' ? 'official' : n.source };
  });
  // Exact duplicate ids: keep the first copy.
  const seen = new Set();
  out = out.filter((n) => {
    if (seen.has(n.id)) {
      changed = true;
      return false;
    }
    seen.add(n.id);
    return true;
  });
  // Duplicate subjects with the same code: keep the one with the most
  // children, move the loser's children under the winner.
  const byCode = new Map();
  for (const n of out) {
    if (n.type !== 'subject' || !n.code) continue;
    if (!byCode.has(n.code)) byCode.set(n.code, []);
    byCode.get(n.code).push(n);
  }
  const dropIds = new Set();
  for (const group of byCode.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => countDescendants(out, b.id) - countDescendants(out, a.id));
    const keep = group[0];
    for (const dup of group.slice(1)) {
      dropIds.add(dup.id);
      out = out.map((c) => (c.parentId === dup.id ? { ...c, parentId: keep.id } : c));
    }
  }
  if (dropIds.size) {
    changed = true;
    out = out.filter((n) => !dropIds.has(n.id));
  }
  return { nodes: out, changed };
}

export function StoreProvider({ children }) {
  const [nodes, setNodes] = useState(null);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [storageError, setStorageError] = useState('');
  const timer = useRef(null);
  const first = useRef(true);
  const healedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let loaded = null;
      try {
        loaded = await kvGet('nodes');
      } catch (e) {
        setStorageError(e.message || 'IndexedDB unavailable');
      }
      if (!loaded) {
        try {
          const raw = localStorage.getItem(LS_KEY);
          loaded = raw ? JSON.parse(raw) : null;
        } catch {}
      }
      if (!loaded || !Array.isArray(loaded) || !loaded.length) {
        loaded = buildSeed();
      } else {
        // Repair notebooks that predate the semester node, or that were
        // imported without one, so the home page always has a shelf to show.
        const hasSemester = loaded.some((n) => n.type === 'semester');
        if (!hasSemester) {
          const now = Date.now();
          const sem = {
            id: 'sem-ktu-2024-s5',
            parentId: null,
            type: 'semester',
            title: 'Semester 5',
            subtitle: 'KTU B.Tech CSE · 2024 Scheme',
            order: 0,
            source: 'official',
            scheme: '2024 Scheme',
            program: 'KTU B.Tech CSE',
            semesterNo: 5,
            createdAt: now,
            modified: now,
          };
          const ids = new Set(loaded.map((n) => n.id));
          loaded = [
            sem,
            ...loaded.map((n) =>
              n.type !== 'semester' && (!n.parentId || !ids.has(n.parentId))
                ? { ...n, parentId: sem.id }
                : n
            ),
          ];
        } else {
          const sem = loaded.find((n) => n.type === 'semester');
          const ids = new Set(loaded.map((n) => n.id));
          loaded = loaded.map((n) =>
            n.type === 'subject' && (!n.parentId || !ids.has(n.parentId))
              ? { ...n, parentId: sem.id }
              : n
          );
        }
        // Self-heal notebooks that were saved before the seed subjects were
        // added (or imported empty): if a semester exists but not a single
        // subject, seed the five default syllabus subjects into it so the
        // home page is never blank. User edits are never touched.
        if (!loaded.some((n) => n.type === 'subject')) {
          const semesterId =
            (loaded.find((n) => n.type === 'semester') || {}).id || SEMESTER_ID;
          const existing = new Set(loaded.map((n) => n.id));
          const seed = buildSeed();
          const add = seed
            .filter((n) => !existing.has(n.id))
            .map((n) => (n.type === 'subject' ? { ...n, parentId: semesterId } : n));
          loaded = [...loaded, ...add];
        }
      }
      if (!alive) return;
      const upgraded = upgradeModuleLibrary(loaded);
      if (upgraded.changed) healedRef.current = true;
      loaded = upgraded.nodes;
      const healed = healNotes(loaded, SUBJECT_DEFS);
      if (healed.changed) healedRef.current = true;
      const withExams = ensureExamNote(healed.nodes);
      if (withExams.changed) healedRef.current = true;
      setNodes(withExams.nodes);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !nodes) return;
    if (first.current && !healedRef.current) {
      first.current = false;
      return;
    }
    first.current = false;
    setSaveState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await kvSet('nodes', nodes);
        setSaveState('saved');
      } catch (e) {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(nodes));
          setStorageError('IndexedDB write failed - using localStorage fallback.');
          setSaveState('saved');
        } catch {
          setStorageError('Could not save changes in this browser.');
          setSaveState('error');
        }
      }
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1600);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [nodes, ready]);

  const patchNode = useCallback((id, patch) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch, modified: Date.now() } : n)));
  }, []);

  const touchNode = useCallback((id) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, accessed: Date.now() } : n)));
  }, []);

  const addNode = useCallback((data) => {
    const now = Date.now();
    const node = {
      id: uid(data.type?.[0] || 'n'),
      parentId: data.parentId ?? null,
      type: data.type || 'folder',
      title: data.title || 'Untitled',
      order: data.order ?? 0,
      source: data.source || 'personal',
      body: data.body || '',
      createdAt: now,
      modified: now,
      ...data,
    };
    setNodes((ns) => {
      node.order = data.order ?? nextOrder(ns, node.parentId);
      return [...ns, node];
    });
    return node;
  }, []);

  const removeNodes = useCallback(async (id) => {
    let ids = [];
    setNodes((ns) => {
      ids = [id, ...descendants(ns, id).map((n) => n.id)];
      return ns.filter((n) => !ids.includes(n.id));
    });
    try {
      await delAssetsFor(ids);
    } catch {}
    return ids;
  }, []);

  const duplicateNode = useCallback(async (id) => {
    const source = nodes?.find((n) => n.id === id);
    if (!source) return null;
    const srcIds = [id, ...descendants(nodes, id).map((n) => n.id)];
    const assets = [];
    for (const node of nodes.filter((n) => srcIds.includes(n.id) && isNote(n))) {
      const refs = [...new Set(String(node.body || '').match(/asset:[a-z0-9-]+/gi) || [])];
      for (const ref of refs) {
        const aid = ref.slice(6);
        try {
          const a = await getAsset(aid);
          if (a) assets.push({ nodeId: node.id, aid, blob: a.blob, name: a.name, type: a.type });
        } catch {}
      }
    }
    const idMap = new Map(srcIds.map((old) => [old, uid(source.type?.[0] || 'n')]));
    const now = Date.now();
    const clones = nodes
      .filter((n) => srcIds.includes(n.id))
      .map((n) => {
        const newId = idMap.get(n.id);
        let body = n.body || '';
        for (const a of assets) {
          if (a.nodeId !== n.id) continue;
          const newAid = uid('a');
          body = body.replaceAll(`asset:${a.aid}`, `asset:${newAid}`);
          putAsset(newAid, a.blob, { noteId: newId, name: a.name, type: a.type }).catch(() => {});
        }
        return {
          ...n,
          id: newId,
          parentId: n.id === id ? source.parentId : idMap.get(n.parentId),
          title: n.id === id ? `${n.title} (copy)` : n.title,
          body,
          order: n.id === id ? nextOrder(nodes, source.parentId) : n.order,
          source: 'personal',
          modified: now,
          createdAt: now,
        };
      });
    setNodes((ns) => [...ns, ...clones]);
    return clones.find((c) => c.parentId === source.parentId) || null;
  }, [nodes]);

  const moveNode = useCallback((id, newParentId, index = null) => {
    setNodes((ns) => {
      if (!canMove(ns, id, newParentId)) return ns;
      const siblings = childrenOf(ns, newParentId).filter((n) => n.id !== id);
      const node = ns.find((n) => n.id === id);
      if (!node) return ns;
      const at = index == null ? siblings.length : Math.max(0, Math.min(index, siblings.length));
      siblings.splice(at, 0, node);
      const orderMap = new Map(siblings.map((n, i) => [n.id, i]));
      return ns.map((n) => {
        if (n.id === id) return { ...n, parentId: newParentId, order: orderMap.get(n.id) };
        if (orderMap.has(n.id)) return { ...n, order: orderMap.get(n.id) };
        return n;
      });
    });
  }, []);

  const reorder = useCallback((id, delta) => {
    setNodes((ns) => {
      const node = ns.find((n) => n.id === id);
      if (!node) return ns;
      const sibs = childrenOf(ns, node.parentId);
      const i = sibs.findIndex((n) => n.id === id);
      const j = i + delta;
      if (j < 0 || j >= sibs.length) return ns;
      const a = sibs[i];
      const b = sibs[j];
      return ns.map((n) =>
        n.id === a.id ? { ...n, order: b.order } : n.id === b.id ? { ...n, order: a.order } : n
      );
    });
  }, []);

  const addSubject = useCallback(({ title, code, description, semesterId = SEMESTER_ID }) => {
    setNodes((ns) => {
      const list = childrenOf(ns, semesterId);
      const now = Date.now();
      const sid = `sub-${uid('s')}`;
      const m1 = uid('f');
      return [
        ...ns,
        {
          id: sid,
          parentId: semesterId,
          type: 'subject',
          title,
          code,
          description: description || '',
          order: list.length,
          source: 'personal',
          createdAt: now,
          modified: now,
        },
        {
          id: m1,
          parentId: sid,
          type: 'module',
          title: 'Module 1',
          order: 0,
          source: 'personal',
          createdAt: now,
          modified: now,
        },
      ];
    });
  }, []);

  // Re-add any missing default syllabus nodes without touching user edits.
  const restoreDefaults = useCallback(() => {
    const seed = buildSeed();
    setNodes((ns) => {
      const existing = new Set(ns.map((n) => n.id));
      const add = seed.filter((n) => !existing.has(n.id));
      return add.length ? [...ns, ...add] : ns;
    });
  }, []);

  const restoreSubjectSyllabus = useCallback((subjectId) => {
    const seed = buildSeed();
    const def = seed.find((n) => n.id === subjectId);
    if (!def) return false;
    const key = def.id.replace('sub-', '');
    const template = SUBJECT_DEFS.find((d) => d.key === key);
    if (!template) return false;
    const wanted = seed.filter((n) => n.id.startsWith(`${key}-`));
    setNodes((ns) => {
      const existing = new Set(ns.map((n) => n.id));
      return [...ns, ...wanted.filter((n) => !existing.has(n.id))];
    });
    return true;
  }, []);

  const toggleProgress = useCallback((id) => {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === id
          ? { ...n, progress: n.progress === 'done' ? 'todo' : 'done', modified: Date.now() }
          : n
      )
    );
  }, []);

  const setBody = useCallback((id, body) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, body, modified: Date.now() } : n)));
  }, []);

  const replaceAll = useCallback((next) => setNodes(next), []);

  const semesters = useMemo(() => childrenOf(nodes || [], null), [nodes]);
  const value = useMemo(
    () => ({
      nodes: nodes || [],
      ready,
      saveState,
      storageError,
      semesters,
      subjectDefs: SUBJECT_DEFS,
      syllabusHtml,
      patchNode,
      touchNode,
      addNode,
      removeNodes,
      duplicateNode,
      moveNode,
      reorder,
      addSubject,
      restoreDefaults,
      restoreSubjectSyllabus,
      toggleProgress,
      setBody,
      replaceAll,
      setNodes,
      progressOf,
      childrenOf: (pid) => childrenOf(nodes || [], pid),
      semesterId: (nodes || []).find((n) => n.type === 'semester')?.id || SEMESTER_ID,
    }),
    [
      nodes,
      ready,
      saveState,
      storageError,
      semesters,
      patchNode,
      touchNode,
      addNode,
      removeNodes,
      duplicateNode,
      moveNode,
      reorder,
      addSubject,
      restoreDefaults,
      restoreSubjectSyllabus,
      toggleProgress,
      setBody,
      replaceAll,
    ]
  );

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useStore() {
  const v = useContext(Store);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}