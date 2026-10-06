import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Sendoff Admin — the founders' ticket board. GitHub Issues are the database;
// this is just a friendly window onto them. Served only behind Google auth.

const T = { paper: '#F4F1E8', ink: '#1B1D2A', cobalt: '#2547F0', sun: '#FFC838', poppy: '#FF5A3C' };
const FONT = "'Instrument Sans', system-ui, sans-serif";
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

const COLUMNS = [
  ['inbox', 'Inbox', 'new — nobody on it yet'],
  ['in_progress', 'In progress', 'claimed / assigned'],
  ['in_review', 'In review', 'has an open PR'],
  ['shipped', 'Shipped', 'closed — done'],
];
const TYPE_COLORS = { bug: T.poppy, idea: T.cobalt, qa: T.sun, other: '#8a8fa3' };

function Card({ c }) {
  return (
    <a href={c.url} target="_blank" rel="noreferrer" style={{
      display: 'block', background: '#fff', border: `2px solid ${T.ink}`, borderRadius: 12,
      padding: '10px 12px', marginBottom: 10, textDecoration: 'none', color: T.ink,
      boxShadow: '3px 3px 0 rgba(27,29,42,.15)',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        <span style={{
          background: TYPE_COLORS[c.type] ?? TYPE_COLORS.other, color: c.type === 'qa' ? T.ink : '#fff',
          borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '2px 8px', textTransform: 'uppercase',
        }}>{c.type}</span>
        <span style={{ fontSize: 12, opacity: 0.55 }}>#{c.number}</span>
      </div>
      <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{c.title}</div>
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
        {c.filedBy && <>by {c.filedBy} · </>}
        {c.comments > 0 && <>{c.comments} 💬 · </>}
        {c.linkedPrs.map((p) => `PR #${p.number}`).join(', ')}
      </div>
    </a>
  );
}

function NewTicket({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('bug');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, body }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error ?? 'failed');
      setTitle(''); setBody(''); setOpen(false);
      onCreated();
    } catch (e2) {
      setErr(`Couldn't file it (${e2.message}) — your text is kept, try again.`);
    } finally { setBusy(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      background: T.cobalt, color: '#fff', border: 'none', borderRadius: 10, fontFamily: FONT,
      fontWeight: 800, fontSize: 15, padding: '10px 18px', cursor: 'pointer',
    }}>+ New ticket</button>
  );

  return (
    <form onSubmit={submit} style={{ background: '#fff', border: `2px solid ${T.ink}`, borderRadius: 14, padding: 16, maxWidth: 480 }}>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's up? (title)" required
        style={{ width: '100%', fontFamily: FONT, fontSize: 15, padding: 10, borderRadius: 8, border: `1.5px solid ${T.ink}`, marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {['bug', 'idea', 'qa', 'other'].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', padding: '6px 12px',
            borderRadius: 999, cursor: 'pointer', border: `1.5px solid ${T.ink}`,
            background: type === t ? (TYPE_COLORS[t] ?? '#888') : 'transparent',
            color: type === t ? (t === 'qa' ? T.ink : '#fff') : T.ink,
          }}>{t}</button>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details — what happened, where, on what phone…" rows={4}
        style={{ width: '100%', fontFamily: FONT, fontSize: 14, padding: 10, borderRadius: 8, border: `1.5px solid ${T.ink}`, marginBottom: 8, boxSizing: 'border-box' }} />
      {err && <div style={{ color: T.poppy, fontSize: 13, marginBottom: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={busy} style={{ background: T.cobalt, color: '#fff', border: 'none', borderRadius: 8, fontFamily: FONT, fontWeight: 800, padding: '9px 16px', cursor: 'pointer' }}>
          {busy ? 'Filing…' : 'File it'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', fontFamily: FONT, cursor: 'pointer', color: T.ink, opacity: 0.6 }}>cancel</button>
      </div>
    </form>
  );
}

function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/board');
      if (res.status === 401) { window.location.href = '/auth/login'; return; }
      const d = await res.json();
      if (d.ok) { setBoard(d); setError(''); } else setError(d.error ?? 'failed');
    } catch { setError('network hiccup — retrying'); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (!board) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: FONT, color: T.ink }}>
      {error || 'Loading the board…'}
    </div>
  );

  return (
    <div style={{ fontFamily: FONT, color: T.ink, padding: '20px clamp(12px, 4vw, 40px)', maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(24px, 4vw, 34px)', margin: 0 }}>✈️ Sendoff Admin</h1>
        <span style={{ opacity: 0.6, fontSize: 14 }}>hey {board.me.name}</span>
        <span style={{ flex: 1 }} />
        <a href="/auth/logout" style={{ color: T.ink, opacity: 0.5, fontSize: 13 }}>sign out</a>
      </header>

      {board.stale && (
        <div style={{ background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 10, padding: '8px 14px', fontWeight: 700, marginBottom: 12 }}>
          GitHub isn't answering right now — this is the last good snapshot.
        </div>
      )}
      {board.alerts.length > 0 && board.alerts.map((a) => (
        <a key={a.number} href={a.url} target="_blank" rel="noreferrer" style={{
          display: 'block', background: T.poppy, color: '#fff', border: `2px solid ${T.ink}`,
          borderRadius: 10, padding: '10px 14px', fontWeight: 800, marginBottom: 12, textDecoration: 'none',
        }}>🚨 {a.title}</a>
      ))}

      <div style={{ margin: '14px 0 22px' }}>
        <NewTicket onCreated={load} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {COLUMNS.map(([key, label, hint]) => (
          <section key={key}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 17, margin: '0 0 2px' }}>
              {label} <span style={{ opacity: 0.45, fontWeight: 400, fontSize: 13 }}>{board.columns[key].length}</span>
            </h2>
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>{hint}</div>
            {board.columns[key].map((c) => <Card key={c.number} c={c} />)}
            {board.columns[key].length === 0 && (
              <div style={{ border: `2px dashed rgba(27,29,42,.25)`, borderRadius: 12, padding: 14, fontSize: 13, opacity: 0.5 }}>empty</div>
            )}
          </section>
        ))}
      </div>

      {board.pulls.length > 0 && (
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 17, marginBottom: 10 }}>Open PRs</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {board.pulls.map((p) => (
              <a key={p.number} href={p.url} target="_blank" rel="noreferrer" style={{
                background: '#fff', border: `2px solid ${T.ink}`, borderRadius: 999, padding: '7px 14px',
                fontSize: 13, fontWeight: 700, color: T.ink, textDecoration: 'none', opacity: p.draft ? 0.55 : 1,
              }}>#{p.number} {p.title.slice(0, 48)}{p.draft ? ' (draft)' : ''}</a>
            ))}
          </div>
        </section>
      )}
      <footer style={{ marginTop: 40, fontSize: 12, opacity: 0.4 }}>
        Tickets live as GitHub issues — this board and the bots read the same truth. Refreshes every minute.
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
