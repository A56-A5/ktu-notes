'use client';
import { useMemo } from 'react';
import {
  BookOpen, Plus, Star, MoreHorizontal, ArrowRight, Search, Sparkles, FolderOpen,
  CalendarDays,
} from 'lucide-react';
import { childrenOf, descendants, isNote, progressOf, relativeTime, breadcrumbText, plainText } from '../lib/tree';
import { examInfo, formatExamDate, formatExamDay } from '../lib/syllabus';

const TONES = ['', 'blue', 'green', 'pink', 'violet'];

export default function Home({
  nodes,
  semester,
  onOpenSubject,
  onAddSubject,
  onPin,
  onMenu,
  onOpenNode,
  onImport,
  onExport,
  onRestore,
  query,
  results,
  onClearSearch,
}) {
  const subjects = useMemo(() => {
    const scoped = semester ? childrenOf(nodes, semester.id).filter((n) => n.type === 'subject') : [];
    // Recovery: if the selected semester is missing or empty, still show every
    // subject in the notebook instead of a blank home page.
    return scoped.length ? scoped : nodes.filter((n) => n.type === 'subject');
  }, [nodes, semester]);
  const examRows = useMemo(
    () =>
      subjects
        .map((subject) => ({ subject, exam: examInfo(subject) }))
        .filter((r) => r.exam)
        .sort((a, b) => String(a.exam.date).localeCompare(String(b.exam.date))),
    [subjects]
  );
  const stats = useMemo(() => {
    const all = semester ? descendants(nodes, semester.id) : nodes.filter((n) => n.type !== 'semester');
    const notes = all.filter(isNote);
    const done = notes.filter((n) => n.progress === 'done').length;
    return {
      subjects: subjects.length,
      modules: all.filter((n) => n.type === 'module').length,
      notes: notes.length,
      done,
      pct: notes.length ? Math.round((done / notes.length) * 100) : 0,
    };
  }, [nodes, semester, subjects.length]);

  const sorted = useMemo(
    () => [...subjects].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0)),
    [subjects]
  );

  return (
    <div>
      <section className="paper hero torn-a">
        <span className="tape" />
        <svg className="doodle" width="92" height="92" viewBox="0 0 92 92" fill="none" stroke="#6f6250" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M18 66c10-22 28-38 48-42" />
          <path d="M58 18c8 2 14 8 16 16" />
          <path d="M64 28c-2 10 3 20 12 25" />
          <circle cx="28" cy="68" r="3" fill="#f0dfa4" />
          <path d="M12 26c5-3 10 0 10 5" />
        </svg>
        <div className="kicker">APJ Abdul Kalam Technological University · 2024 Scheme</div>
        <h2>Semester 5 notebook</h2>
        <p>
          B.Tech Computer Science and Engineering. Five theory courses with four modules each, the two lab
          manuals experiment by experiment, and a place for every topic, diagram and half-finished thought.
          Everything here is yours to edit.
        </p>
        <div className="stats">
          <div className="stat"><b>{stats.subjects}</b>subjects</div>
          <div className="stat"><b>{stats.modules}</b>modules</div>
          <div className="stat"><b>{stats.notes}</b>notes</div>
          <div className="stat"><b>{stats.pct}%</b>studied</div>
        </div>
        <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          <button className="btn primary" onClick={onAddSubject}><Plus size={15} /> Add subject</button>
          <button className="btn" onClick={onImport}>Import JSON / ZIP</button>
          <button className="btn" onClick={onExport}>Export backup</button>
          <button className="btn ghost" onClick={onRestore} title="Re-add any missing default syllabus entries">Restore defaults</button>
          <a className="btn ghost" href="/ai-guide" title="Prompt an AI to generate importable notes">AI content guide</a>
        </div>
      </section>

      {query.trim() && (
        <section className="paper white results torn-c">
          <h3>
            <Search size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {results.length ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”` : `Nothing found for “${query}”`}
          </h3>
          {!results.length && (
            <p className="muted" style={{ fontSize: '.86rem' }}>
              Try a course code (PCCST501), a module name, or a phrase from a note. Search covers titles, codes,
              descriptions and note text.
            </p>
          )}
          {results.map((r) => (
            <button key={r.id} className="result-row" onClick={() => onOpenNode(r.id)}>
              <span style={{ marginTop: 2, color: 'var(--ink-soft)' }}>
                {r.type === 'subject' ? <BookOpen size={15} /> : <FolderOpen size={15} />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="rt">{r.title}</span>
                {r.code && <span className="rc"> · {r.code}</span>}
                <span className="rc" style={{ display: 'block' }}>{breadcrumbText(nodes, r.id)}</span>
                {r.body && <span className="snippet">{plainText(r.body).slice(0, 180)}</span>}
              </span>
            </button>
          ))}
          <div className="row end" style={{ marginTop: 10 }}>
            <button className="btn xs ghost" onClick={onClearSearch}>Clear search</button>
          </div>
        </section>
      )}

      <div className="section-head">
        <h3>Subjects</h3>
        <span className="rule" />
        <span className="hint"><Sparkles size={11} style={{ verticalAlign: -1 }} /> pinned subjects stay on top</span>
      </div>

      {!sorted.length && (
        <div className="paper white torn-c" style={{ marginBottom: 22 }}>
          <h3 className="hand" style={{ fontSize: '1.5rem', margin: '0 0 6px' }}>No subjects in this notebook yet</h3>
          <p className="muted" style={{ fontSize: '.9rem', margin: '0 0 14px' }}>
            Add a subject, import a JSON/ZIP file, or restore the default Semester 5 subjects.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={onAddSubject}><Plus size={14} /> Add subject</button>
            <button className="btn" onClick={onImport}>Import file</button>
            <button className="btn ghost" onClick={onRestore}>Restore defaults</button>
          </div>
        </div>
      )}

      {examRows.length > 0 && (
        <section className="paper white exam-strip torn-c">
          <h3>
            <CalendarDays size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Exam schedule
            <span className="kbd-hint" style={{ marginLeft: 8, fontWeight: 400 }}>
              end-semester dates for these subjects
            </span>
          </h3>
          <ul className="exam-list">
            {examRows.map(({ subject, exam }) => (
              <li key={subject.id}>
                <button className="exam-row" onClick={() => onOpenSubject(subject.id)}>
                  <span className="ec mono">Slot {exam.slot || '?'}</span>
                  <span className="et">{subject.title}</span>
                  <span className="ed">
                    {formatExamDate(exam.date)}
                    <span className="eday">{formatExamDay(exam.date)}</span>
                  </span>
                  <span className="es mono">{exam.paperCode || subject.code || ''}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="kbd-hint" style={{ marginBottom: 0 }}>
            Slots A-E from the Exam Schedule note under Semester 5. A subject's own exam date wins over the
            table, so you can move a date without touching this list.
          </p>
        </section>
      )}

      <div className="subject-grid">
        {sorted.map((s, i) => {
          const kids = childrenOf(nodes, s.id);
          const all = descendants(nodes, s.id);
          const notes = all.filter(isNote);
          const modules = kids.filter((k) => k.type === 'module').length;
          const pct = progressOf(nodes, s.id);
          const exam = examInfo(s);
          return (
            <article
              key={s.id}
              className={`subject-card ${TONES[i % TONES.length]} ${s.pinned ? 'pinned' : ''}`}
              onClick={() => onOpenSubject(s.id)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenSubject(s.id)}
            >
              <span className="folder-tab">{s.code || 'SUBJECT'}</span>
              <button
                className="icon-btn star"
                title={s.pinned ? 'Unpin subject' : 'Pin subject'}
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(s);
                }}
              >
                <Star size={16} fill={s.pinned ? '#d99a3d' : 'none'} color={s.pinned ? '#a06a1f' : 'var(--ink-soft)'} />
              </button>
              <h4>{s.title}</h4>
              <p className="desc">{s.description || 'No description yet - open the subject to add one.'}</p>
              <div className="progress-line" title={`${pct}% of notes marked studied`}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="meta">
                <span><b>{modules}</b> modules</span>
                <span><b>{notes.length}</b> notes</span>
                <span>{pct}% studied</span>
              </div>
              <div className="meta" style={{ marginTop: 4 }}>
                <span>{s.accessed ? `opened ${relativeTime(s.accessed)}` : 'not opened yet'}</span>
                {exam && (
                  <span className="exam-line" title={exam.slot ? `Slot ${exam.slot}` : 'Exam date'}>
                    <CalendarDays size={11} /> {formatExamDate(exam.date)}
                    {exam.slot ? ` · ${exam.slot}` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <span className="open-cue">Open folder <ArrowRight size={13} /></span>
                <button
                  className="icon-btn"
                  style={{ marginLeft: 'auto' }}
                  title="Subject actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenu(e, s);
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </article>
          );
        })}

        <button className="subject-card add-card" onClick={onAddSubject}>
          <Plus size={26} />
          <span className="hand" style={{ fontSize: '1.3rem', marginTop: 6 }}>Add a subject</span>
          <span className="mono" style={{ fontSize: '.6rem', color: 'var(--ink-faint)' }}>name, code, description</span>
        </button>
      </div>

      <p className="kbd-hint" style={{ marginTop: 30, textAlign: 'center' }}>
        Official syllabus content is marked <span className="badge official">official</span> and can be edited or deleted.
        Your own notes are marked <span className="badge personal">personal</span>.
      </p>
    </div>
  );
}