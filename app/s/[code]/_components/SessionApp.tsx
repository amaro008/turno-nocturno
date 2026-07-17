'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatClock } from '@/lib/ui/format-time';
import type { SessionState, Msg, PublicEvidence, ExpTab, VerdictRow } from './types';
import { useNewEvidenceNotification } from './useNewEvidenceNotification';
import SessionSkeleton from './SessionSkeleton';
import EmptyState from '@/components/EmptyState';
import SuspectsGrid from './expediente/SuspectsGrid';
import DocumentsList from './expediente/DocumentsList';
import AudioPlayer from './expediente/AudioPlayer';
import VideoPlayer from './expediente/VideoPlayer';
import NotesBoard from './expediente/NotesBoard';
import EvidenceCodeInput from './expediente/EvidenceCodeInput';

interface Resolution {
  verdict: VerdictRow;
  narrative: string;
  culprit: string;
  breakdown?: { culprit: number; how: number; why: number; hintPenalty: number };
  feedback?: string;
}

const TABS: { id: ExpTab; label: string }[] = [
  { id: 'sospechosos', label: 'Sospechosos' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'audios', label: 'Audios' },
  { id: 'videos', label: 'Videos' },
  { id: 'notas', label: 'Mis notas' },
  { id: 'codigos', label: 'Códigos' },
];

export default function SessionApp({ code }: { code: string }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [pendingEvidence, setPendingEvidence] = useState<PublicEvidence[]>([]);
  const [tab, setTab] = useState<ExpTab>('sospechosos');
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [mobileView, setMobileView] = useState<'chat' | 'exp'>('chat');
  const threadRef = useRef<HTMLDivElement>(null);

  const reduce = useReducedMotion();
  const { badges, toasts, acknowledge, dismissToast } = useNewEvidenceNotification(
    state?.evidence ?? [],
    tab,
  );

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/sessions/${code}/state`, { cache: 'no-store' });
    if (!res.ok) return;
    const data: SessionState = await res.json();
    setState(data);
    setSeconds(data.secondsRemaining);
    if (data.verdict && !resolution) {
      setResolution({ verdict: data.verdict, narrative: data.resolvedNarrative ?? '', culprit: data.resolvedCulprit ?? '' });
    }
  }, [code, resolution]);

  useEffect(() => { fetchState(); }, [fetchState]);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${code}/tick`, { method: 'POST' });
        const data = await res.json();
        if (data.fired > 0) fetchState();
        if (typeof data.secondsRemaining === 'number') setSeconds(data.secondsRemaining);
      } catch { /* silencio */ }
    }, 30000);
    return () => clearInterval(id);
  }, [code, fetchState]);
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state?.messages, liveText, pendingEvidence, streaming]);

  function switchTab(t: ExpTab) {
    setTab(t);
    acknowledge(t);
  }

  const send = useCallback(
    async (text: string, isHint = false) => {
      if (streaming) return;
      setStreaming(true);
      setPendingUser(isHint ? 'Necesitamos una pista, Comandante.' : text);
      setInput('');
      setLiveText('');
      setPendingEvidence([]);
      try {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, message: text, isHint }),
        });
        if (!res.ok || !res.body) { setStreaming(false); setPendingUser(null); return; }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            const obj = JSON.parse(line.slice(5).trim());
            if (obj.type === 'text') setLiveText((t) => t + obj.delta);
            else if (obj.type === 'evidence') setPendingEvidence((e) => [...e, obj.item]);
          }
        }
      } finally {
        await fetchState();
        setStreaming(false);
        setPendingUser(null);
        setLiveText('');
        setPendingEvidence([]);
      }
    },
    [code, streaming, fetchState],
  );

  const submitVerdict = useCallback(
    async (accused: string, how: string, why: string) => {
      const res = await fetch('/api/verdict/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, accused, how, why }),
      });
      const data = await res.json();
      setVerdictOpen(false);
      setResolution({ verdict: data.verdict, narrative: data.narrative ?? '', culprit: data.culprit ?? '', breakdown: data.breakdown, feedback: data.feedback });
      fetchState();
    },
    [code, fetchState],
  );

  if (!state) return <SessionSkeleton />;

  const cdClass = seconds > 60 * 60 ? 'green' : seconds >= 30 * 60 ? 'amber' : 'red';
  const docs = state.evidence.filter((e) => e.kind === 'document' || e.kind === 'hint');
  const audios = state.evidence.filter((e) => e.kind === 'audio');
  const videos = state.evidence.filter((e) => e.kind === 'video');
  const hintsLeft = state.maxHints - state.hintsUsed;
  const totalNew = (badges.documentos ?? 0) + (badges.audios ?? 0) + (badges.videos ?? 0);

  return (
    <div className="sess">
      {/* ===== Barra superior ===== */}
      <header className="sbar">
        <div className="brand">
          <div className="badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
              <path d="M9 12.5 11 14.5 15.5 9.5" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1>{state.case.title}</h1>
            <div className="sbar-place mono">{state.case.city} · {state.case.eraYear}</div>
          </div>
        </div>

        <div className="sbar-center">
          <div className={'cd-big ' + cdClass}>{formatClock(seconds)}</div>
          <div className="cd-caption mono">para el veredicto</div>
        </div>

        <div className="sbar-right">
          {!resolution && (
            <button className="btn primary" onClick={() => setVerdictOpen(true)}>Cerrar el caso</button>
          )}
        </div>
      </header>

      {/* Toggle chat/expediente (solo tablet vertical y menor) */}
      <div className="console-toggle">
        <button className={mobileView === 'chat' ? 'active' : ''} onClick={() => setMobileView('chat')}>Chat</button>
        <button className={mobileView === 'exp' ? 'active' : ''} onClick={() => { setMobileView('exp'); acknowledge(tab); }}>
          Expediente{totalNew > 0 && <span className="ct-badge">{totalNew}</span>}
        </button>
      </div>

      {/* ===== Zona central ===== */}
      <main className={'console mv-' + mobileView}>
        {/* Chat (40%) */}
        <section className="chat">
          <div className="thread scroll" ref={threadRef}>
            {state.messages.map((m) => <MessageRow key={m.id} m={m} />)}
            {pendingUser && (
              <div className="row me"><div className="avatar">TÚ</div><div className="stack"><div className="bubble">{pendingUser}</div></div></div>
            )}
            {pendingEvidence.map((ev) => (
              <div className="row them" key={'pe-' + ev.id}><div className="avatar">C</div><div className="stack"><EvidenceCard ev={ev} /></div></div>
            ))}
            {streaming && (
              <div className="row them"><div className="avatar">C</div><div className="stack">
                {liveText ? <div className="bubble">{liveText}</div> : <div className="bubble typing"><i /><i /><i /></div>}
              </div></div>
            )}
          </div>

          <div className="composer">
            <div className="composer-row">
              <div className="field">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) send(input.trim());
                    }
                  }}
                  rows={1}
                  placeholder="Escribe al Comandante — Enter envía, Shift+Enter salta línea"
                  disabled={streaming || !!resolution}
                  aria-label="Mensaje"
                />
              </div>
              <button className="send" onClick={() => input.trim() && send(input.trim())} disabled={streaming || !input.trim() || !!resolution} aria-label="Enviar">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-7-8-3z" opacity=".9" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Expediente (60%) */}
        <aside className="exp" onContextMenu={(e) => e.preventDefault()}>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => switchTab(t.id)} role="tab" aria-selected={tab === t.id}>
                {t.label}
                {t.id === 'sospechosos' && <span className="tcount">{state.suspects.length}</span>}
                {t.id === 'documentos' && docs.length > 0 && <span className="tcount">{docs.length}</span>}
                {t.id === 'audios' && audios.length > 0 && <span className="tcount">{audios.length}</span>}
                {t.id === 'videos' && videos.length > 0 && <span className="tcount">{videos.length}</span>}
                {(badges[t.id] ?? 0) > 0 && <span className="tbadge">{badges[t.id]}</span>}
              </button>
            ))}
          </div>

          <div className="panels scroll">
            <motion.div
              key={tab}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {tab === 'sospechosos' && <SuspectsGrid suspects={state.suspects} />}
              {tab === 'documentos' && <DocumentsList docs={docs} sessionCode={code} />}
              {tab === 'audios' &&
                (audios.length ? audios.map((a) => <AudioPlayer key={a.id} item={a} />) : (
                  <EmptyState ill="audio" title="Sin audios todavía" message="Los audios que reciban del Comandante aparecerán aquí con su transcripción." />
                ))}
              {tab === 'videos' &&
                (videos.length ? videos.map((v) => <VideoPlayer key={v.id} item={v} />) : (
                  <EmptyState ill="video" title="Sin videos todavía" message="Los videos del expediente aparecerán aquí cuando lleguen." />
                ))}
              {tab === 'notas' && <NotesBoard code={code} initial={state.playerNotes} />}
              {tab === 'codigos' && <EvidenceCodeInput code={code} onUnlocked={fetchState} />}
            </motion.div>

            {(tab === 'documentos' || tab === 'audios' || tab === 'videos') && (
              <div className="protect-note">
                Los documentos están protegidos y son parte de tu sesión activa. Compartirlos rompe el
                juego para otros.
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* ===== Barra inferior ===== */}
      <footer className="sfoot">
        <div className="hints">
          <span className="mono">Pistas</span>
          <span className="hint-pip">
            {Array.from({ length: state.maxHints }).map((_, i) => (
              <b key={i} className={i < state.hintsUsed ? 'used' : ''} />
            ))}
          </span>
          <span className="mono" style={{ color: 'var(--ink-3)' }}>{hintsLeft} disponibles</span>
        </div>
        <button
          className="btn ghost"
          disabled={streaming || hintsLeft <= 0 || !!resolution}
          onClick={() => {
            if (window.confirm('Pedir una pista descuenta puntaje. ¿Continuar?')) send('', true);
          }}
        >
          Pedir pista {hintsLeft <= 0 ? '(sin pistas)' : `(−puntaje)`}
        </button>
        {!resolution && (
          <button className="btn primary sfoot-close" onClick={() => setVerdictOpen(true)}>Cerrar el caso</button>
        )}
      </footer>

      {/* Toasts */}
      <div className="toasts">
        {toasts.map((t) => (
          <button className="toast" key={t.id} onClick={() => { switchTab(t.tab); dismissToast(t.id); }}>
            <span className="toast-dot" />
            Nueva evidencia: <b>{t.title}</b>
          </button>
        ))}
      </div>

      {verdictOpen && <VerdictModal suspects={state.suspects.map((s) => s.name)} onClose={() => setVerdictOpen(false)} onSubmit={submitVerdict} />}
      {resolution && <ResolutionScreen r={resolution} />}
    </div>
  );
}

/* ---------- Subcomponentes de chat / veredicto ---------- */

function MessageRow({ m }: { m: Msg }) {
  const reduce = useReducedMotion();
  const anim = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };
  if (m.kind === 'system') return <motion.div className="sys" {...anim}>{m.content}</motion.div>;
  const mine = m.role === 'players';
  return (
    <motion.div className={'row ' + (mine ? 'me' : 'them')} {...anim}>
      <div className="avatar">{mine ? 'TÚ' : 'C'}</div>
      <div className="stack">
        {m.kind === 'evidence_card' && m.evidence ? (
          <EvidenceCard ev={m.evidence} />
        ) : m.kind === 'voice' ? (
          <div className="bubble voice-b"><span className="voice-ic">🎙</span><span className="voice-tx">{m.content}</span></div>
        ) : (
          <div className="bubble">{m.content}</div>
        )}
      </div>
    </motion.div>
  );
}

function EvidenceCard({ ev }: { ev: PublicEvidence }) {
  const reduce = useReducedMotion();
  const kindLabel = ev.kind === 'audio' ? 'AUD' : ev.kind === 'video' ? 'VID' : 'DOC';
  const anim = reduce
    ? {}
    : { initial: { opacity: 0, x: 44 }, animate: { opacity: 1, x: 0 }, transition: { type: 'spring' as const, stiffness: 420, damping: 20 } };
  return (
    <motion.article className="ev" {...anim}>
      <div className="ev-tag">{kindLabel}</div>
      <div className="ev-main">
        <div className="ev-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
        </div>
        <div><div className="ev-title">{ev.title}</div><div className="ev-sub">{ev.kind} · {ev.code} · míralo en el Expediente</div></div>
      </div>
    </motion.article>
  );
}

function VerdictModal({ suspects, onClose, onSubmit }: { suspects: string[]; onClose: () => void; onSubmit: (a: string, h: string, w: string) => void }) {
  const [accused, setAccused] = useState(suspects[0] ?? '');
  const [how, setHow] = useState('');
  const [why, setWhy] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="kicker">Veredicto final</span>
        <h2>Cierren el caso</h2>
        <p className="msub">Una sola oportunidad. Nombren al culpable y expliquen cómo y por qué.</p>
        <div className="vform">
          <div className="vfield">
            <label className="label">¿Quién lo hizo?</label>
            <select className="input" value={accused} onChange={(e) => setAccused(e.target.value)}>
              {suspects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="vfield">
            <label className="label">¿Cómo? (cómo se rompe su coartada / mecánica)</label>
            <textarea className="input" value={how} onChange={(e) => setHow(e.target.value)} />
          </div>
          <div className="vfield">
            <label className="label">¿Por qué? (móvil)</label>
            <textarea className="input" value={why} onChange={(e) => setWhy(e.target.value)} />
          </div>
          <div className="vactions">
            <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
            <button className="btn primary" disabled={busy || !accused} onClick={() => { setBusy(true); onSubmit(accused, how, why); }}>
              {busy ? 'Evaluando…' : 'Entregar veredicto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolutionScreen({ r }: { r: Resolution }) {
  const ok = r.verdict?.culprit_correct;
  return (
    <div className="reso-back scroll">
      <div className="reso">
        <span className={'verdict-mark ' + (ok ? 'ok' : 'bad')}>{ok ? '● Caso resuelto' : '● Caso sin cerrar'}</span>
        <h1>{ok ? 'Cerraron el expediente.' : 'El expediente sigue abierto.'}</h1>
        {r.feedback && <p style={{ color: 'var(--ink-2)' }}>{r.feedback}</p>}
        <div className="score mono">{r.verdict?.total_score ?? 0}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>PUNTAJE / 100</div>
        <div className="brk">
          <div className="b"><div className="l">Culpable</div><div className="v">{r.verdict?.culprit_correct ? '✓' : '✕'}</div></div>
          <div className="b"><div className="l">Cómo</div><div className="v" style={{ fontSize: 13 }}>{r.verdict?.how_score}</div></div>
          <div className="b"><div className="l">Por qué</div><div className="v" style={{ fontSize: 13 }}>{r.verdict?.why_score}</div></div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--amber)', letterSpacing: '0.1em', marginTop: 20 }}>LA VERDAD DEL EXPEDIENTE — {r.culprit}</div>
        <p className="narr">{r.narrative}</p>
        <a className="btn primary lg" href="/mi-biblioteca">Volver a la biblioteca</a>
      </div>
    </div>
  );
}
