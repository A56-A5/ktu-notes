'use client';
import {
  Plus, MoreHorizontal, FileText, Folder, Layers, Hash, Paperclip, BookOpen,
  CheckCircle2, Circle, Download, Upload, RotateCcw, Pencil, Trash2, ArrowUpRight,
} from 'lucide-react';
import { childrenOf, descendants, isNote, progressOf, relativeTime, plainText } from '../lib/tree';

const ICON = { folder: Folder, module: Layers, topic: Hash, note: FileText, resource: Paperclip, subject: BookOpen };

export default function FolderView({
  node,
  nodes,
  onSelect,
  onAdd,
  onMenu,
  onEdit,
  onDelete,
  onExport,
  onImport,
  onRestore,
  onToggleProgress,
}) {
  const kids = childrenOf(nodes, node.id);
  const folders = kids.filter((k) => !isNote(k));
  const notes = kids.filter(isNote);
  const all = descendants(nodes, node.id);
  const noteCount = all.filter(isNote).length;
  const pct = node.type === 'subject' ? progressOf(nodes, node.id) : 0;
  const isSubject = node.type === 'subject';
  const isModule = node.type === 'module';

  return (
    <div>
      <section className="paper folder-head torn-a">
        <span className="tape left" />
        <div className="kicker">
          {isSubject ? 'Subject folder' : isModule ? `Module ${node.moduleNo || ''}` : node.type}
          {node.code ? ` · ${node.code}` : ''}
          {node.hours ? ` · ${node.hours} contact hours` : ''}
        </div>
        <h2>{node.title}</h2>
        {node.subtitle && <p className="hand" style={{ fontSize: '1.25rem', color: 'var(--ink-soft)', margin: '0 0 4px' }}>{node.subtitle}</p>}
        <p>{node.description || (isSubject ? 'No description yet. Use Edit to add one.' : '')}</p>
        <div className="badges">
          <span className={`badge ${node.source || 'personal'}`}>{node.source || 'personal'}</span>
          {node.unverified && <span className="badge unverified">unverified</span>}
          {isSubject && <span className="badge">{folders.filter((f) => f.type === 'module').length} modules</span>}
          <span className="badge">{noteCount} notes</span>
          {node.accessed && <span className="badge">opened {relativeTime(node.accessed)}</span>}
        </div>
        {isSubject && (
          <div style={{ marginTop: 12, maxWidth: 420 }}>
            <div className="progress-line"><span style={{ width: `${pct}%` }} /></div>
            <div className="kbd-hint">{pct}% of notes marked studied</div>
          </div>
        )}
        <div className="actions">
          <button className="btn sm primary" onClick={() => onAdd(node)}><Plus size={13} /> Add {isSubject ? 'module / folder' : 'child'}</button>
          <button className="btn sm" onClick={() => onEdit(node)}><Pencil size={13} /> Edit</button>
          <button className="btn sm" onClick={() => onExport(node)}><Download size={13} /> Export</button>
          <button className="btn sm" onClick={() => onImport(node)}><Upload size={13} /> Import here</button>
          {isSubject && <button className="btn sm ghost" onClick={() => onRestore(node)}><RotateCcw size={13} /> Restore syllabus</button>}
          <button className="btn sm danger" onClick={() => onDelete(node)}><Trash2 size={13} /> Delete</button>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} title="More actions" onClick={(e) => onMenu(e, node)}>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </section>

      {folders.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 6 }}>
            <h3>{isSubject ? 'Modules & folders' : 'Folders'}</h3>
            <span className="rule" />
            <span className="hint">{folders.length} item{folders.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mini-grid">
            {folders.map((f, i) => {
              const Icon = ICON[f.type] || Folder;
              const count = descendants(nodes, f.id).filter(isNote).length;
              return (
                <button key={f.id} className={`mini-card ${f.type} tone-${(i % 3) + 1}`} onClick={() => onSelect(f.id)}>
                  <span className="kind"><Icon size={11} style={{ verticalAlign: -1, marginRight: 4 }} />{f.type}{f.hours ? ` · ${f.hours}h` : ''}</span>
                  <span className="t">{f.title}</span>
                  {f.subtitle && <span className="sub">{f.subtitle}</span>}
                  {!f.subtitle && f.description && <span className="sub">{f.description}</span>}
                  <span className="foot">{count} note{count === 1 ? '' : 's'} · {childrenOf(nodes, f.id).length} item(s)</span>
                </button>
              );
            })}
            <button className="mini-card" onClick={() => onAdd(node)} style={{ border: '1.5px dashed rgba(58,49,38,.35)', borderRadius: 8, background: 'transparent', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
              <Plus size={20} />
              <span className="t" style={{ fontSize: '1rem' }}>Add folder</span>
            </button>
          </div>
        </>
      )}

      {notes.length > 0 && (
        <>
          <div className="section-head">
            <h3>Notes</h3>
            <span className="rule" />
            <span className="hint">click to open the editor</span>
          </div>
          <div className="mini-grid">
            {notes.map((n, i) => (
              <div key={n.id} className={`mini-card note tone-${(i % 3) + 1}`} onClick={() => onSelect(n.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(n.id)}>
                <span className="kind">
                  <FileText size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {n.category === 'syllabus' ? 'official syllabus' : n.category === 'subtopic' ? 'subtopic' : 'note'}
                  {n.progress === 'done' && <CheckCircle2 size={11} style={{ color: '#6a9a4f', marginLeft: 4, verticalAlign: -1 }} />}
                </span>
                <span className="t">{n.title}</span>
                <span className="sub">{plainText(n.body || '').slice(0, 110) || 'Empty note - open it and start writing.'}</span>
                <span className="foot" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {relativeTime(n.modified)}
                  <button
                    className="icon-btn"
                    style={{ width: 20, height: 20, marginLeft: 'auto' }}
                    title={n.progress === 'done' ? 'Mark not studied' : 'Mark studied'}
                    onClick={(e) => { e.stopPropagation(); onToggleProgress(n.id); }}
                  >
                    {n.progress === 'done' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  </button>
                  <button className="icon-btn" style={{ width: 20, height: 20 }} title="Note actions" onClick={(e) => { e.stopPropagation(); onMenu(e, n); }}>
                    <MoreHorizontal size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!kids.length && (
        <div className="empty-state">
          <div>This folder is empty.</div>
          <p>Add a module, a topic folder, or a note. You can nest as deeply as you need.</p>
          <button className="btn primary" onClick={() => onAdd(node)}><Plus size={14} /> Add the first item</button>
        </div>
      )}

      {isSubject && (
        <p className="kbd-hint" style={{ marginTop: 26 }}>
          <ArrowUpRight size={11} style={{ verticalAlign: -1 }} /> Tip: drag items in the contents panel to reorder or move them into another folder.
        </p>
      )}
    </div>
  );
}