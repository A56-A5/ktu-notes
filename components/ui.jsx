'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, Check, Loader2 } from 'lucide-react';

const UI = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'info', ms = 3600) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setDialog({
          kind: 'confirm',
          title: opts.title || 'Are you sure?',
          body: opts.body || '',
          confirmText: opts.confirmText || 'Delete',
          cancelText: opts.cancelText || 'Cancel',
          danger: opts.danger !== false,
          resolve,
        });
      }),
    []
  );

  const prompt = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setDialog({
          kind: 'prompt',
          title: opts.title || 'Enter a value',
          label: opts.label || '',
          initial: opts.initial || '',
          placeholder: opts.placeholder || '',
          multiline: Boolean(opts.multiline),
          confirmText: opts.confirmText || 'Save',
          cancelText: opts.cancelText || 'Cancel',
          hint: opts.hint || '',
          resolve,
        });
      }),
    []
  );

  const close = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <UI.Provider value={{ toast, confirm, prompt }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : t.type === 'ok' ? 'ok' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
      {dialog && <DialogHost dialog={dialog} onClose={close} />}
    </UI.Provider>
  );
}

export const useUI = () => {
  const v = useContext(UI);
  if (!v) throw new Error('useUI must be used inside UIProvider');
  return v;
};

function DialogHost({ dialog, onClose }) {
  const [value, setValue] = useState(dialog.initial || '');
  const inputRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(dialog.kind === 'prompt' ? null : false);
      if (e.key === 'Enter' && dialog.kind === 'prompt' && !dialog.multiline) {
        e.preventDefault();
        onClose(value.trim() || null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [dialog, onClose, value]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose(dialog.kind === 'prompt' ? null : false)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={dialog.title}>
        <button className="icon-btn close" onClick={() => onClose(dialog.kind === 'prompt' ? null : false)} aria-label="Close">
          <X size={16} />
        </button>
        <h3>{dialog.title}</h3>
        {dialog.body && <p className="sub" style={{ whiteSpace: 'pre-wrap' }}>{dialog.body}</p>}
        {dialog.kind === 'prompt' && (
          <>
            {dialog.label && <label className="lbl" htmlFor="dlg-input">{dialog.label}</label>}
            {dialog.multiline ? (
              <textarea
                id="dlg-input"
                ref={inputRef}
                className="field"
                rows={5}
                value={value}
                placeholder={dialog.placeholder}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <input
                id="dlg-input"
                ref={inputRef}
                className="field"
                value={value}
                placeholder={dialog.placeholder}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
            {dialog.hint && <p className="kbd-hint" style={{ marginTop: 8 }}>{dialog.hint}</p>}
          </>
        )}
        <div className="row end">
          <button className="btn ghost" onClick={() => onClose(dialog.kind === 'prompt' ? null : false)}>
            {dialog.cancelText}
          </button>
          <button
            className={`btn ${dialog.danger ? 'danger' : 'primary'}`}
            onClick={() => onClose(dialog.kind === 'prompt' ? value.trim() || null : true)}
          >
            {dialog.danger && dialog.kind === 'confirm' ? <AlertTriangle size={14} /> : <Check size={14} />}
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 14 }) {
  return <Loader2 size={size} className="spin" />;
}

export function Menu({ x, y, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === 'Escape' && onClose();
    setTimeout(() => window.addEventListener('mousedown', onDown), 0);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const left = Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 220 : x);
  const top = Math.min(y, typeof window !== 'undefined' ? window.innerHeight - 40 - items.length * 32 : y);
  return (
    <div className="menu" ref={ref} style={{ left, top }} role="menu">
      {items.map((it, i) =>
        it.sep ? (
          <div className="sep" key={`s${i}`} />
        ) : (
          <button
            key={it.label}
            className={it.danger ? 'danger' : ''}
            disabled={it.disabled}
            onClick={() => {
              onClose();
              it.onClick?.();
            }}
          >
            {it.icon}
            {it.label}
          </button>
        )
      )}
    </div>
  );
}

export function Modal({ title, sub, onClose, children, wide = false, footer = null }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h3>{title}</h3>
        {sub && <p className="sub">{sub}</p>}
        {children}
        {footer && <div className="row end">{footer}</div>}
      </div>
    </div>
  );
}