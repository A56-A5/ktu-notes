'use client';
import { BookOpen, Search, Upload, Download, Plus, Cloud, CloudOff, RefreshCw, Menu as MenuIcon, Sparkles } from 'lucide-react';

export default function Header({
  semesters,
  semesterId,
  onSemester,
  onAddSemester,
  query,
  setQuery,
  onHome,
  onImport,
  onExport,
  onAddSubject,
  mode,
  syncLabel,
  onCloud,
  onToggleSidebar,
  showSidebarToggle,
}) {
  return (
    <header className="topbar">
      <div className="brand" onClick={onHome} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onHome()}>
        <span className="mark" aria-hidden>📒</span>
        <div>
          <h1>KTU Notes</h1>
          <small>Semester notebook · 2024 scheme</small>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select
          className="field"
          style={{ width: 'auto', padding: '5px 8px', fontSize: '.68rem' }}
          value={semesterId || ''}
          onChange={(e) => (e.target.value === '__add' ? onAddSemester() : onSemester(e.target.value))}
          aria-label="Semester"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
          <option value="__add">+ Add semester…</option>
        </select>
        {showSidebarToggle && (
          <button className="btn sm mobile-only" onClick={onToggleSidebar} aria-label="Toggle contents">
            <MenuIcon size={14} /> Contents
          </button>
        )}
      </div>

      <div className="spacer" />

      <div className="searchbox">
        <Search size={14} color="var(--ink-soft)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, codes, notes…"
          aria-label="Search"
        />
        {query ? (
          <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => setQuery('')} aria-label="Clear search">×</button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>

      <a className="btn sm" href="/ai-guide" title="Instructions for generating importable notes with an AI"><Sparkles size={13} /> AI guide</a>
      <button className="btn sm" onClick={onImport} title="Import JSON or ZIP"><Upload size={13} /> Import</button>
      <button className="btn sm" onClick={onExport} title="Export JSON or ZIP"><Download size={13} /> Export</button>
      <button className="btn sm primary" onClick={onAddSubject}><Plus size={13} /> Subject</button>

      <button
        className={`pill ${mode === 'cloud' ? 'ok' : mode === 'error' ? 'bad' : mode === 'syncing' ? 'warn' : 'local'}`}
        onClick={onCloud}
        title="Cloud sync settings"
        style={{ cursor: 'pointer' }}
      >
        {mode === 'cloud' ? <Cloud size={11} /> : mode === 'syncing' ? <RefreshCw size={11} className="spin" /> : <CloudOff size={11} />}
        {syncLabel}
      </button>
    </header>
  );
}