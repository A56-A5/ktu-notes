'use client';
import { useEffect, useState } from 'react';
import { Modal } from './ui';
import { TYPES } from '../lib/tree';

const TYPE_LABELS = {
  subject: 'Subject',
  folder: 'Folder',
  module: 'Module',
  topic: 'Topic',
  subtopic: 'Subtopic',
  note: 'Note',
  resource: 'Resource / link page',
  semester: 'Semester',
};

function typesFor(parentType) {
  switch (parentType) {
    case 'semester':
      return ['subject', 'folder'];
    case 'subject':
      return ['module', 'folder', 'topic', 'note'];
    case 'module':
      return ['topic', 'folder', 'note'];
    case 'topic':
      return ['note', 'subtopic', 'folder'];
    case 'subtopic':
    case 'folder':
      return ['folder', 'module', 'topic', 'note', 'resource'];
    default:
      return ['folder', 'note', 'topic'];
  }
}

export default function AddEditDialog({ open, mode, parent, node, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('folder');
  const [semesterNo, setSemesterNo] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (mode === 'edit' && node) {
      setTitle(node.title || '');
      setCode(node.code || '');
      setDescription(node.description || '');
      setType(node.type);
      setSemesterNo(node.semesterNo || 5);
    } else if (mode === 'semester') {
      setTitle('');
      setSemesterNo((parent?.semesterNo || 5) + 0 || 5);
      setCode('');
      setDescription('');
    } else {
      const options = typesFor(parent?.type);
      setTitle('');
      setCode('');
      setDescription('');
      setType(options[0] || 'folder');
    }
  }, [open, mode, node, parent]);

  if (!open) return null;

  const isSubject = type === 'subject';
  const isSemester = mode === 'semester';
  const options = mode === 'edit' ? null : mode === 'semester' ? null : typesFor(parent?.type);

  const submit = () => {
    if (!title.trim()) {
      setError('A title is required.');
      return;
    }
    if (isSubject && !code.trim()) {
      setError('Course codes keep subjects searchable — add one (or write “no code”).');
      return;
    }
    onSave({
      mode,
      node,
      parentId: parent?.id ?? null,
      type: isSemester ? 'semester' : type,
      title: title.trim(),
      code: code.trim(),
      description: description.trim(),
      semesterNo: Number(semesterNo) || 5,
    });
  };

  return (
    <Modal
      title={
        mode === 'edit'
          ? `Edit “${node?.title}”`
          : mode === 'semester'
          ? 'Add a semester'
          : `New item in “${parent?.title || 'notebook'}”`
      }
      sub={
        mode === 'edit'
          ? 'Changes apply immediately after saving.'
          : 'Choose what to add. You can keep nesting folders and topics later.'
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>{mode === 'edit' ? 'Save changes' : 'Add'}</button>
        </>
      }
    >
      {mode !== 'edit' && !isSemester && (
        <>
          <label className="lbl" htmlFor="nd-type">Type</label>
          <select id="nd-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {(options || []).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </>
      )}

      <label className="lbl" htmlFor="nd-title">{isSemester ? 'Semester name' : isSubject ? 'Subject name' : 'Title'}</label>
      <input
        id="nd-title"
        className="field"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isSemester ? 'Semester 6' : isSubject ? 'e.g. Compiler Design' : 'e.g. Module 2 — Data Preprocessing'}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />

      {(isSubject || (mode === 'edit' && node?.type === 'subject')) && (
        <>
          <label className="lbl" htmlFor="nd-code">Course code</label>
          <input id="nd-code" className="field" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PCCST501" />
        </>
      )}

      {isSemester && (
        <>
          <label className="lbl" htmlFor="nd-semno">Semester number</label>
          <input id="nd-semno" className="field" type="number" min="1" max="12" value={semesterNo} onChange={(e) => setSemesterNo(e.target.value)} />
        </>
      )}

      <label className="lbl" htmlFor="nd-desc">Description <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
      <textarea
        id="nd-desc"
        className="field"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A short line that helps you recognise this later."
      />

      {type === 'module' && (
        <p className="kbd-hint" style={{ marginTop: 8 }}>
          Add the official module title to the description, then create topic folders inside it.
        </p>
      )}
      {error && <div className="error-box" style={{ marginTop: 10 }}>{error}</div>}
    </Modal>
  );
}