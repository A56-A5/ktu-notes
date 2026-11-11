'use client';
import {
  Globe, RefreshCw, ShieldAlert, DownloadCloud, UploadCloud, Zap, Lock, Users,
} from 'lucide-react';
import { Modal, Spinner } from './ui';

export default function CloudPanel({
  open,
  onClose,
  configured,
  mode,
  onModeChange,
  workspace,
  host,
  state,
  label,
  error,
  lastSync,
  localCount,
  cloudCount,
  busy,
  autoSync,
  onAutoSync,
  onSyncNow,
  onPullCloud,
  onUploadLocal,
}) {
  if (!open) return null;
  const live = state === 'live';
  const localOnly = mode === 'local';

  return (
    <Modal
      title="Notebook mode"
      sub={localOnly ? 'Private to this browser.' : 'Login-free shared notebook.'}
      onClose={onClose}
    >
      <div className="row" style={{ gap: 8, marginBottom: 4 }} role="group" aria-label="Notebook mode">
        <button
          className={`btn sm ${!localOnly ? 'primary' : ''}`}
          onClick={() => onModeChange('shared')}
          disabled={!configured || !localOnly}
          title={configured ? 'Sync with the shared notebook' : 'Add Supabase keys to enable'}
        >
          <Users size={13} /> Shared notebook
        </button>
        <button
          className={`btn sm ${localOnly ? 'primary' : ''}`}
          onClick={() => onModeChange('local')}
          disabled={localOnly}
        >
          <Lock size={13} /> Local only
        </button>
      </div>

      {localOnly ? (
        <>
          <div className="note-box" style={{ marginTop: 12 }}>
            <Lock size={13} style={{ verticalAlign: -2 }} /> Cloud sync is off. Nothing is uploaded, downloaded or
            polled, and this notebook exists only in this browser's storage. The ZIP export is the only backup.
          </div>
          <div className="warn-box" style={{ marginTop: 12 }}>
            <ShieldAlert size={13} style={{ verticalAlign: -2 }} /> Clearing site data, a different browser or a
            different device will not see this notebook. Export a ZIP backup regularly.
          </div>
          <div className="note-box" style={{ marginTop: 12 }}>
            <strong>{localCount}</strong> items in this browser. Switching back to Shared notebook merges these edits
            with the cloud copy (newest edit wins per item).
          </div>
        </>
      ) : configured ? (
        <>
          <div className="note-box" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Globe size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
            <div>
              <strong>{localCount}</strong> items in this browser ·{' '}
              <strong>{cloudCount || '-'}</strong> in the shared notebook
              <div className="mono" style={{ fontSize: '.64rem', marginTop: 4, color: 'var(--ink-soft)' }}>
                {workspace} @ {host || '…'}
              </div>
            </div>
          </div>

          <div className="warn-box" style={{ marginTop: 12 }}>
            <ShieldAlert size={13} style={{ verticalAlign: -2 }} /> No login and no accounts. Everyone who opens this app
            shares one notebook, changes flow both ways, and the newest edit of each item wins. Export a ZIP backup if
            several people edit at once.
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
            <div className="row">
              <button className="btn sm primary" onClick={onSyncNow} disabled={busy}>
                {busy ? <Spinner /> : <RefreshCw size={13} />} Sync now
              </button>
              <label className="row" style={{ gap: 5, cursor: 'pointer', fontSize: '.68rem' }}>
                <input type="checkbox" checked={autoSync} onChange={(e) => onAutoSync(e.target.checked)} />
                Auto-sync every 20 s
              </label>
            </div>
            <div className="mono" style={{ fontSize: '.62rem', color: live ? '#4a6b34' : 'var(--ink-soft)' }}>
              {label}
              {lastSync ? ` · last ${new Date(lastSync).toLocaleTimeString()}` : ''}
            </div>
          </div>

          <hr className="divider" />
          <p className="sub" style={{ marginTop: 0 }}>Manual copy control - use only when the automatic merge gets confusing.</p>
          <div className="row">
            <button className="btn" onClick={onPullCloud} disabled={busy}>
              <DownloadCloud size={13} /> Pull cloud copy (replace local)
            </button>
            <button className="btn danger" onClick={onUploadLocal} disabled={busy}>
              <UploadCloud size={13} /> Overwrite cloud with this browser
            </button>
          </div>

          <div className="note-box" style={{ marginTop: 14 }}>
            <Zap size={13} style={{ verticalAlign: -2 }} /> Edits push about 5 s after you stop typing, and the app
            checks for other people’s edits every minute while the tab is open. Images go to the public
            <code> note-assets</code> bucket.
          </div>

          {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
        </>
      ) : (
        <>
          <hr className="divider" />
          <p className="sub" style={{ marginTop: 0 }}>
            To turn on shared sync, add these to <code>.env.local</code> and restart the dev server. There is nothing to
            sign in to, and the anon/publishable key is safe to ship:
          </p>
          <pre style={{ background: 'var(--paper)', border: '1px dashed var(--line)', borderRadius: 6, padding: 10, fontFamily: 'var(--mono)', fontSize: '.62rem', overflow: 'auto' }}>
{`NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable / anon key>
# optional, if you want a second independent notebook
NEXT_PUBLIC_WORKSPACE=public`}
          </pre>
          <p className="kbd-hint">
            Then run <code>supabase/schema.sql</code> once in the Supabase SQL editor. After that, anyone who opens this
            site can read and edit the same notebook, or you can stay in Local only mode. The service-role key is never
            used in the browser.
          </p>
        </>
      )}

      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
