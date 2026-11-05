'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Mathematics from '@tiptap/extension-mathematics';
import { createLowlight, common } from 'lowlight';
import 'katex/dist/katex.min.css';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Minus, Link2, Code, SquareCode, Table2,
  ImagePlus, Sigma, Undo2, Redo2, Save, Maximize2, Minimize2, Trash2, Copy, CheckCircle2,
  Circle, ArrowLeft, AlignLeft, AlignCenter, AlignRight, X, Captions, Rows3, Columns3,
} from 'lucide-react';
import { putAsset, getAsset } from '../lib/db';
import { uid } from '../lib/tree';
import { useUI } from './ui';
import { relativeTime } from '../lib/tree';

const lowlight = createLowlight(common);

function NoteImage({ node, updateAttributes, deleteNode, selected }) {
  const { width = 100, align = 'left', caption = '', src, alt } = node.attrs;
  return (
    <NodeViewWrapper className="image-node" data-align={align} as="div">
      <div style={{ position: 'relative', width: `${width}%`, maxWidth: '100%' }}>
        <img src={src} alt={alt || caption || ''} draggable={false} style={{ width: '100%' }} />
        {selected && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3,
              background: 'rgba(251,246,233,.94)', border: '1.2px solid #3a3126',
              borderRadius: 6, padding: 3, flexWrap: 'wrap', maxWidth: 220,
            }}
          >
            {[25, 50, 75, 100].map((w) => (
              <button key={w} className="btn xs" style={{ padding: '1px 5px' }} onClick={() => updateAttributes({ width: w })}>
                {w}%
              </button>
            ))}
            <button className="icon-btn" style={{ width: 22, height: 22 }} title="Align left" onClick={() => updateAttributes({ align: 'left' })}><AlignLeft size={12} /></button>
            <button className="icon-btn" style={{ width: 22, height: 22 }} title="Align center" onClick={() => updateAttributes({ align: 'center' })}><AlignCenter size={12} /></button>
            <button className="icon-btn" style={{ width: 22, height: 22 }} title="Align right" onClick={() => updateAttributes({ align: 'right' })}><AlignRight size={12} /></button>
            <button className="icon-btn danger" style={{ width: 22, height: 22 }} title="Remove image" onClick={deleteNode}><X size={12} /></button>
          </div>
        )}
      </div>
      <input
        className="image-caption"
        value={caption}
        placeholder="Add a caption…"
        contentEditable={false}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        style={{ background: 'transparent', border: 0, borderBottom: '1px dotted #d8c9a8', outline: 0, fontFamily: 'var(--mono)', fontSize: '.66rem', color: 'var(--ink-soft)', textAlign: 'center', width: `${Math.max(width, 40)}%` }}
      />
    </NodeViewWrapper>
  );
}

const NoteImageExt = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 100,
        renderHTML: (attrs) => ({ 'data-width': attrs.width }),
      },
      align: {
        default: 'left',
        parseHTML: (el) => el.getAttribute('data-align') || 'left',
        renderHTML: (attrs) => ({ 'data-align': attrs.align }),
      },
      caption: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-caption') || '',
        renderHTML: (attrs) => ({ 'data-caption': attrs.caption }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(NoteImage);
  },
});

export default function NoteEditor({ node, onSave, onTitle, onBack, onDelete, onDuplicate, onToggleProgress, onOpenMove }) {
  const ui = useUI();
  const [html, setHtml] = useState(null);
  const [status, setStatus] = useState('Saved');
  const [full, setFull] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [words, setWords] = useState(0);
  const map = useRef({});
  const urls = useRef([]);
  const saveTimer = useRef(null);
  const titleTimer = useRef(null);
  const fileRef = useRef(null);
  const editorRef = useRef(null);
  const latest = useRef({ body: node.body || '', title: node.title });

  // A sync from another editor can change this note while it is open; adopt the
  // new title unless the field is focused (so typing is never interrupted).
  const titleRef = useRef(null);
  useEffect(() => {
    if (document.activeElement !== titleRef.current) setTitle(node.title);
  }, [node.title]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let h = node.body || '';
      const refs = [...new Set(h.match(/asset:[a-z0-9-]+/gi) || [])];
      for (const ref of refs) {
        try {
          const a = await getAsset(ref.slice(6));
          if (!a) continue;
          const url = URL.createObjectURL(a.blob);
          urls.current.push(url);
          map.current[url] = ref.slice(6);
          h = h.replaceAll(ref, url);
        } catch {}
      }
      if (alive) setHtml(h);
    })();
    return () => {
      alive = false;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    };
  }, [node.id]);

  const serialize = useCallback(() => {
    let out = editorRef.current?.getHTML() || '';
    for (const [url, id] of Object.entries(map.current)) out = out.replaceAll(url, `asset:${id}`);
    return out;
  }, []);

  const flush = useCallback(() => {
    clearTimeout(saveTimer.current);
    const body = serialize();
    latest.current.body = body;
    onSave(body);
    setStatus('Saved');
  }, [onSave, serialize]);

  const addImage = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const id = uid('a');
      try {
        await putAsset(id, file, { noteId: node.id, name: file.name, type: file.type });
      } catch (e) {
        ui.toast('Could not store the image in this browser.', 'error');
        return;
      }
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      map.current[url] = id;
      editorRef.current?.chain().focus().setImage({ src: url, alt: file.name, width: 100, align: 'left', caption: '' }).run();
      setStatus('Unsaved…');
    },
    [node.id, ui]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      content: html || '',
      extensions: [
        StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4] } }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
        NoteImageExt.configure({ inline: false, allowBase64: false }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: 'Start writing… use the toolbar for headings, lists, tables, images and equations.' }),
        Highlight,
        CodeBlockLowlight.configure({ lowlight }),
        Mathematics.configure({ katexOptions: { throwOnError: false } }),
      ],
      editorProps: {
        attributes: { class: 'ProseMirror', spellcheck: 'true' },
        handlePaste: (_view, event) => {
          const files = [...(event.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
          if (!files.length) return false;
          files.forEach(addImage);
          return true;
        },
        handleDrop: (_view, event) => {
          const files = [...(event.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
          if (!files.length) return false;
          event.preventDefault();
          files.forEach(addImage);
          return true;
        },
      },
      onUpdate: ({ editor: ed }) => {
        setStatus('Unsaved…');
        setWords(ed.getText().trim().split(/\s+/).filter(Boolean).length);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          const body = serialize();
          latest.current.body = body;
          onSave(body);
          setStatus('Saved');
        }, 900);
      },
    },
    [html]
  );

  useEffect(() => {
    editorRef.current = editor;
    if (editor) setWords(editor.getText().trim().split(/\s+/).filter(Boolean).length);
  }, [editor]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flush();
        ui.toast('Note saved', 'ok', 1600);
      }
      if (e.key === 'Escape' && full) setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, full, ui]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const changeTitle = (v) => {
    setTitle(v);
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => onTitle(v.trim() || 'Untitled'), 500);
  };

  const c = () => editor?.chain().focus();
  const insertMath = async (block) => {
    const tex = await ui.prompt({
      title: block ? 'Block equation (LaTeX)' : 'Inline equation (LaTeX)',
      label: 'LaTeX',
      placeholder: block ? '\\int_0^1 x^2\\,dx = \\frac{1}{3}' : 'E = mc^2',
      confirmText: 'Insert',
    });
    if (!tex) return;
    c().insertContent(block ? `\n$$\n${tex}\n$$\n` : `$${tex}$`).run();
  };

  const setLink = async () => {
    const prev = editor?.getAttributes('link').href || '';
    const url = await ui.prompt({ title: 'Link', label: 'URL', initial: prev, placeholder: 'https://…', confirmText: 'Apply' });
    if (url === null) return;
    if (!url) c().unsetLink().run();
    else c().setLink({ href: url }).run();
  };

  if (html === null) {
    return <div className="paper white note-sheet" style={{ padding: 30 }}><span className="mono muted">Opening note…</span></div>;
  }

  const B = ({ active, on, title: t, children, disabled }) => (
    <button className={`tb ${active ? 'on' : ''}`} title={t} aria-label={t} disabled={disabled} onClick={on} type="button">
      {children}
    </button>
  );

  const inTable = editor?.isActive('table');

  return (
    <div className={full ? 'editor-fullscreen' : ''}>
      <div className="paper white note-sheet">
        <div className="note-head">
          <div className="meta">
            {onBack && (
              <button className="btn xs ghost" onClick={onBack} style={{ marginRight: 4 }}>
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <span className={`badge ${node.source || 'personal'}`}>{node.source || 'personal'}</span>
            {node.category === 'subtopic' && <span className="badge">subtopic</span>}
            <span>modified {relativeTime(node.modified)}</span>
            <span>· {words} words</span>
            {node.progress === 'done' && <span className="badge done">studied</span>}
          </div>
          <input
            ref={titleRef}
            className="note-title"
            value={title}
            onChange={(e) => changeTitle(e.target.value)}
            onBlur={() => onTitle(title.trim() || 'Untitled')}
            placeholder="Note title"
            aria-label="Note title"
          />
          <div className="note-actions">
            <button className="btn xs" onClick={flush}><Save size={12} /> Save</button>
            <button className="btn xs" onClick={() => onToggleProgress?.(node.id)}>
              {node.progress === 'done' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              {node.progress === 'done' ? 'Studied' : 'Mark studied'}
            </button>
            <button className="btn xs" onClick={() => setFull((f) => !f)}>
              {full ? <Minimize2 size={12} /> : <Maximize2 size={12} />} {full ? 'Exit full screen' : 'Full screen'}
            </button>
            <button className="btn xs" onClick={() => onDuplicate?.(node.id)}><Copy size={12} /> Duplicate</button>
            <button className="btn xs" onClick={() => onOpenMove?.(node)}>Move</button>
            <button className="btn xs danger" onClick={() => onDelete?.(node)}><Trash2 size={12} /> Delete</button>
          </div>
        </div>

        <div className="toolbar" role="toolbar" aria-label="Formatting">
          <div className="group">
            <B title="Undo" on={() => c().undo().run()} disabled={!editor?.can().undo()}><Undo2 size={14} /></B>
            <B title="Redo" on={() => c().redo().run()} disabled={!editor?.can().redo()}><Redo2 size={14} /></B>
          </div>
          <div className="group">
            <B title="Bold (Ctrl+B)" on={() => c().toggleBold().run()} active={editor?.isActive('bold')}><Bold size={14} /></B>
            <B title="Italic (Ctrl+I)" on={() => c().toggleItalic().run()} active={editor?.isActive('italic')}><Italic size={14} /></B>
            <B title="Underline (Ctrl+U)" on={() => c().toggleUnderline().run()} active={editor?.isActive('underline')}><UnderlineIcon size={14} /></B>
            <B title="Strikethrough" on={() => c().toggleStrike().run()} active={editor?.isActive('strike')}><Strikethrough size={14} /></B>
            <B title="Highlight" on={() => c().toggleHighlight().run()} active={editor?.isActive('highlight')}><span style={{ background: 'var(--yellow)', padding: '0 3px', borderRadius: 2 }}>H</span></B>
          </div>
          <div className="group">
            <B title="Heading 1" on={() => c().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })}><Heading1 size={14} /></B>
            <B title="Heading 2" on={() => c().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}><Heading2 size={14} /></B>
            <B title="Heading 3" on={() => c().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })}><Heading3 size={14} /></B>
          </div>
          <div className="group">
            <B title="Bullet list" on={() => c().toggleBulletList().run()} active={editor?.isActive('bulletList')}><List size={14} /></B>
            <B title="Numbered list" on={() => c().toggleOrderedList().run()} active={editor?.isActive('orderedList')}><ListOrdered size={14} /></B>
            <B title="Checklist" on={() => c().toggleTaskList().run()} active={editor?.isActive('taskList')}><ListChecks size={14} /></B>
            <B title="Blockquote" on={() => c().toggleBlockquote().run()} active={editor?.isActive('blockquote')}><Quote size={14} /></B>
          </div>
          <div className="group">
            <B title="Inline code" on={() => c().toggleCode().run()} active={editor?.isActive('code')}><Code size={14} /></B>
            <B title="Code block" on={() => c().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')}><SquareCode size={14} /></B>
            <B title="Link" on={setLink} active={editor?.isActive('link')}><Link2 size={14} /></B>
            <B title="Divider" on={() => c().setHorizontalRule().run()}><Minus size={14} /></B>
          </div>
          <div className="group">
            <B title="Insert table" on={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={14} /></B>
            {inTable && <B title="Add row" on={() => c().addRowAfter().run()}><Rows3 size={14} /></B>}
            {inTable && <B title="Add column" on={() => c().addColumnAfter().run()}><Columns3 size={14} /></B>}
            {inTable && <B title="Delete table" on={() => c().deleteTable().run()}><Trash2 size={14} /></B>}
          </div>
          <div className="group">
            <B title="Insert image" on={() => fileRef.current?.click()}><ImagePlus size={14} /></B>
            <B title="Inline equation" on={() => insertMath(false)}><Sigma size={14} /></B>
            <B title="Block equation" on={() => insertMath(true)}><span className="mono" style={{ fontSize: 11 }}>∑</span><span style={{ fontSize: 9 }}>block</span></B>
          </div>
          <span className="save-state">{status === 'Saved' ? '✓ saved' : status}</span>
        </div>

        <div className="editor-wrap">
          <EditorContent editor={editor} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            [...e.target.files].forEach(addImage);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}