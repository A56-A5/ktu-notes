'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Hash,
  Paperclip,
  Plus,
  MoreHorizontal,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { childrenOf, ancestors, isFolder, isNote } from '../lib/tree';

const ICONS = {
  semester: GraduationCap,
  subject: BookOpen,
  folder: Folder,
  module: Layers,
  topic: Hash,
  note: FileText,
  resource: Paperclip,
};

export default function Tree({ nodes, subjectId, selectedId, onSelect, onAdd, onMenu, onMove }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    const chain = ancestors(nodes, selectedId);
    setExpanded((prev) => {
      const next = new Set(prev);
      chain.forEach((n) => {
        if (n.id !== selectedId) next.add(n.id);
      });
      return next;
    });
  }, [selectedId, nodes]);

  useEffect(() => {
    if (!subjectId) return;
    setExpanded((prev) => new Set(prev).add(subjectId));
  }, [subjectId]);

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const subject = nodes.find((n) => n.id === subjectId);
  const roots = useMemo(() => (subject ? childrenOf(nodes, subject.id) : []), [nodes, subject]);

  if (!subject) return null;

  return (
    <div role="tree" aria-label={`${subject.title} contents`}>
      {roots.map((n) => (
        <Row
          key={n.id}
          node={n}
          depth={0}
          nodes={nodes}
          expanded={expanded}
          toggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onMenu={onMenu}
          dragId={dragId}
          setDragId={setDragId}
          dropTarget={dropTarget}
          setDropTarget={setDropTarget}
          onMove={onMove}
        />
      ))}
      {!roots.length && <div className="tree-empty">This subject is empty. Add a module or folder.</div>}
    </div>
  );
}

function Row({
  node,
  depth,
  nodes,
  expanded,
  toggle,
  selectedId,
  onSelect,
  onAdd,
  onMenu,
  dragId,
  setDragId,
  dropTarget,
  setDropTarget,
  onMove,
}) {
  const kids = childrenOf(nodes, node.id);
  const open = expanded.has(node.id);
  const Icon = ICONS[node.type] || Folder;
  const note = isNote(node);
  const drop = dropTarget?.id === node.id ? dropTarget.pos : null;

  const onDragOver = (e) => {
    if (!dragId || dragId === node.id) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - r.top;
    let pos;
    if (isFolder(node)) pos = y < r.height * 0.28 ? 'before' : y > r.height * 0.72 ? 'after' : 'inside';
    else pos = y < r.height / 2 ? 'before' : 'after';
    setDropTarget({ id: node.id, pos });
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragId && dropTarget?.id === node.id) onMove(dragId, node.id, dropTarget.pos);
    setDragId(null);
    setDropTarget(null);
  };

  return (
    <div role="treeitem" aria-expanded={kids.length ? open : undefined} aria-selected={selectedId === node.id}>
      <div
        className={`tree-row ${selectedId === node.id ? 'active' : ''} ${
          drop ? `drop-${drop}` : ''
        }`}
        style={{ paddingLeft: depth * 15 + 2 }}
        draggable
        onDragStart={(e) => {
          setDragId(node.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', node.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setDropTarget(null);
        }}
        onDragOver={onDragOver}
        onDragLeave={() => dropTarget?.id === node.id && setDropTarget(null)}
        onDrop={onDrop}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => kids.length && toggle(node.id)}
      >
        {depth > 0 && (
          <span className="tree-indent" aria-hidden>
            {Array.from({ length: depth }).map((_, i) => (
              <i key={i} />
            ))}
          </span>
        )}
        <button
          className="twist"
          aria-label={open ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            if (kids.length) toggle(node.id);
          }}
          style={{ visibility: kids.length ? 'visible' : 'hidden' }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span className="ico" aria-hidden>
          {node.type === 'module' ? (
            <Layers size={14} />
          ) : node.type === 'subject' ? (
            <BookOpen size={14} />
          ) : open && kids.length ? (
            <FolderOpen size={14} />
          ) : (
            <Icon size={14} />
          )}
        </span>
        <button className="tree-title" title={node.title} onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}>
          {node.title}
          {node.progress === 'done' && <CheckCircle2 size={11} style={{ marginLeft: 4, color: '#6a9a4f', display: 'inline' }} />}
        </button>
        <span className="row-meta">{kids.length ? kids.length : note ? '' : ''}</span>
        <span className="row-actions">
          <button
            className="icon-btn"
            style={{ width: 24, height: 24 }}
            title="Add child"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node);
            }}
          >
            <Plus size={13} />
          </button>
          <button
            className="icon-btn"
            style={{ width: 24, height: 24 }}
            title="More actions"
            onClick={(e) => {
              e.stopPropagation();
              onMenu(e, node);
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </span>
      </div>
      {open && kids.length > 0 && (
        <div className="tree-children" role="group">
          {kids.map((k) => (
            <Row
              key={k.id}
              node={k}
              depth={depth + 1}
              nodes={nodes}
              expanded={expanded}
              toggle={toggle}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onMenu={onMenu}
              dragId={dragId}
              setDragId={setDragId}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}