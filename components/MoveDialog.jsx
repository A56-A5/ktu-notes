'use client';
import { useMemo, useState } from 'react';
import { Search, Folder, BookOpen, Layers, Hash } from 'lucide-react';
import { Modal } from './ui';
import { ancestors, canMove, isFolder } from '../lib/tree';

const ICON = { semester: BookOpen, subject: BookOpen, folder: Folder, module: Layers, topic: Hash };

export default function MoveDialog({ node, nodes, onClose, onMove }) {
  const [q, setQ] = useState('');
  const [target, setTarget] = useState('');
  const options = useMemo(
    () =>
      nodes
        .filter((n) => isFolder(n) && canMove(nodes, node.id, n.id))
        .map((n) => ({ id: n.id, label: ancestors(nodes, n.id).map((a) => a.title).join(' › '), type: n.type }))
        .filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [nodes, node.id, q]
  );

  return (
    <Modal
      title={`Move “${node.title}”`}
      sub="Pick a new parent folder. The item keeps all of its children."
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!target} onClick={() => onMove(node.id, target)}>Move here</button>
        </>
      }
    >
      <div className="searchbox" style={{ minWidth: 0 }}>
        <Search size={13} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter destinations…" autoFocus />
      </div>
      <div className="preview-tree" style={{ marginTop: 10, maxHeight: 300 }}>
        {options.map((o) => {
          const Icon = ICON[o.type] || Folder;
          return (
            <button
              key={o.id}
              className={`pv`}
              onClick={() => setTarget(o.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
                border: 0, background: target === o.id ? 'var(--yellow)' : 'transparent',
                borderRadius: 4, padding: '5px 7px', cursor: 'pointer', whiteSpace: 'normal',
              }}
            >
              <Icon size={13} />
              <span>{o.label}</span>
            </button>
          );
        })}
        {!options.length && <div className="pv">No other folder can hold this item.</div>}
      </div>
    </Modal>
  );
}