'use client';
import { useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCw, Database, ShieldCheck } from 'lucide-react';
import { Modal, Spinner } from './ui';

export default function Account({
  open,
  onClose,
  configured,
  user,
  syncLabel,
  syncError,
  onSignIn,
  onSignUp,
  onSignOut,
  onSyncNow,
  cloudPrompt,
  onLoadCloud,
  onUploadLocal,
  localCount,
  cloudCount,
  busy,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  if (!open) return null;

  const submit = async (kind) => {
    setMsg('');
    if (!email.trim() || password.length < 6) {
      setMsg('Enter an email and a password of at least 6 characters.');
      return;
    }
    try {
      const text = await (kind === 'up' ? onSignUp(email.trim(), password) : onSignIn(email.trim(), password));
      if (text) setMsg(text);
    } catch (e) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <Modal title="Notebook storage" sub="Local-first, with optional Supabase sync." onClose={onClose}>
      <div className="note-box" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Database size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
        <div>
          <strong>{localCount}</strong> items are stored in this browser (IndexedDB). They survive refreshes and restarts.
          {!configured && ' Supabase is not configured, so nothing is uploaded anywhere.'}
        </div>
      </div>

      {!configured && (
        <>
          <hr className="divider" />
          <p className="sub" style={{ marginTop: 0 }}>
            To enable cloud sync, add these to <code>.env.local</code> and restart the dev server:
          </p>
          <pre style={{ background: 'var(--paper)', border: '1px dashed var(--line)', borderRadius: 6, padding: 10, fontFamily: 'var(--mono)', fontSize: '.62rem', overflow: 'auto' }}>
{`NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable / anon key>`}
          </pre>
          <p className="kbd-hint">
            Then run <code>supabase/schema.sql</code> in the Supabase SQL editor. The service-role key is never used in the browser.
          </p>
        </>
      )}

      {configured && !user && (
        <>
          <hr className="divider" />
          <p className="sub" style={{ marginTop: 0 }}>
            Sign in to sync this notebook to your Supabase account. Each account only sees its own rows (RLS).
          </p>
          <label className="lbl" htmlFor="acc-email">Email</label>
          <input id="acc-email" className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label className="lbl" htmlFor="acc-pass">Password</label>
          <input id="acc-pass" className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="at least 6 characters" />
          {msg && <div className="warn-box" style={{ marginTop: 10 }}>{msg}</div>}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" disabled={busy} onClick={() => submit('in')}>{busy ? <Spinner /> : <Cloud size={14} />} Sign in</button>
            <button className="btn" disabled={busy} onClick={() => submit('up')}>Create account</button>
          </div>
          <p className="kbd-hint" style={{ marginTop: 8 }}>
            If email confirmation is enabled in Supabase, confirm your address before signing in.
          </p>
        </>
      )}

      {configured && user && (
        <>
          <hr className="divider" />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="mono" style={{ fontSize: '.7rem' }}>{user.email}</div>
              <div className="kbd-hint">{syncLabel}{syncError ? ` — ${syncError}` : ''}</div>
            </div>
            <div className="row">
              <button className="btn sm" onClick={onSyncNow} disabled={busy}>{busy ? <Spinner /> : <RefreshCw size={13} />} Sync now</button>
              <button className="btn sm danger" onClick={onSignOut}><LogOut size={13} /> Sign out</button>
            </div>
          </div>

          {cloudPrompt && (
            <div className="warn-box" style={{ marginTop: 14 }}>
              <strong>This account already has a notebook ({cloudCount} items).</strong>
              <p style={{ margin: '6px 0' }}>Choose which copy to keep. This is the only time the app asks; after that, changes sync automatically.</p>
              <div className="row">
                <button className="btn sm primary" onClick={onLoadCloud}><Cloud size={13} /> Load cloud copy</button>
                <button className="btn sm" onClick={onUploadLocal}>Upload this browser’s copy</button>
              </div>
            </div>
          )}

          <div className="note-box" style={{ marginTop: 14 }}>
            <ShieldCheck size={13} style={{ verticalAlign: -2 }} /> Sync is last-writer-wins for the whole notebook. Images upload to the private
            <code> note-assets</code> bucket. Export a ZIP before editing on two devices at once.
          </div>
        </>
      )}

      {syncError && <div className="error-box" style={{ marginTop: 12 }}>{syncError}</div>}

      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}