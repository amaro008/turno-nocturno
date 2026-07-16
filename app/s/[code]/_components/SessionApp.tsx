'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatClock } from '@/lib/ui/format-time';

// ---- Tipos del estado (espejo de /api/sessions/[code]/state) ----
interface PublicEvidence {
  id: string;
  code: string;
  kind: 'audio' | 'video' | 'document' | 'hint';
  title: string;
  body_md: string | null;
  transcript: string | null;
  media_path: string | null;
}
interface Msg {
  id: string;
  at: string;
  role: 'commander' | 'players';
  kind: 'text' | 'voice' | 'evidence_card' | 'system';
  content: string;
  voice_path: string | null;
  evidence_code: string | null;
  evidence: PublicEvidence | null;
}
interface VerdictRow {
  accused: string;
  how_score: string;
  why_score: string;
  culprit_correct: boolean;
  total_score: number;
}
interface SessionState {
  status: string;
  variantCode: string;
  secondsRemaining: number;
  hintsUsed: number;
  maxHints: number;
  case: { title: string; city: string; eraYear: number; timeLimitMin: number };
  messages: Msg[];
  evidence: PublicEvidence[];
  suspects: string[];
  verdict: VerdictRow | null;
  resolvedNarrative: string | null;
  resolvedCulprit: string | null;
}

interface Resolution {
  verdict: VerdictRow;
  narrative: string;
  culprit: string;
  breakdown?: { culprit: number; how: number; why: number; hintPenalty: number };
  feedback?: string;
}

type Tab = 'documentos' | 'audios' | 'videos' | 'sospechosos' | 'notas';

export default function SessionApp({ code }: { code: string }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [pendingEvidence, setPendingEvidence] = useState<PublicEvidence[]>([]);
  const [tab, setTab] = useState<Tab>('documentos');
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/sessions/${code}/state`, { cache: 'no-store' });
    if (!res.ok) return;
    const data: SessionState = await res.json();
    setState(data);
    setSeconds(data.secondsRemaining);
    if (data.verdict && !resolution) {
      setResolution({
        verdict: data.verdict,
        narrative: data.resolvedNarrative ?? '',
        culprit: data.resolvedCulprit ?? '',
      });
    }
  }, [code, resolution]);

  // Hidratación inicial
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Reloj local
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Motor de eventos temporales (polling)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${code}/tick`, { method: 'POST' });
        const data = await res.json();
        if (data.fired > 0) fetchState();
        if (typeof data.secondsRemaining === 'number') setSeconds(data.secondsRemaining);
      } catch {
        /* silencio */
      }
    }, 30000);
    return () => clearInterval(id);
  }, [code, fetchState]);

  // Auto-scroll
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state?.messages, liveText, pendingEvidence, streaming]);

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
        if (!res.ok || !res.body) {
          setStreaming(false);
          setPendingUser(null);
          return;
        }
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

  const unlockByCode = useCallback(
    async (evCode: string) => {
      const res = await fetch('/api/evidence/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, evidence_code: evCode }),
      });
      const data = await res.json();
      if (data.ok) fetchState();
      return data.ok as boolean;
    },
    [code, fetchState],
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
      setResolution({
        verdict: data.verdict,
        narrative: data.narrative ?? '',
        culprit: data.culprit ?? '',
        breakdown: data.breakdown,
        feedback: data.feedback,
      });
      fetchState();
    },
    [code, fetchState],
  );

  if (!state) {
    return <div className="loading-crt">▮ Encendiendo el turno nocturno…</div>;
  }

  const warn = seconds < 15 * 60;
  const docs = state.evidence.filter((e) => e.kind === 'document' || e.kind === 'hint');
  const audios = state.evidence.filter((e) => e.kind === 'audio');
  const videos = state.evidence.filter((e) => e.kind === 'video');

  return (
    <div className="sess">
      {/* ---- Barra superior ---- */}
      <header className="sbar">
        <div className="brand">
          <div className="badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
              <path d="M9 12.5 11 14.5 15.5 9.5" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">Expediente reabierto</div>
            <h1>{state.case.title}</h1>
          </div>
          <span className="chip">
            {state.case.city} · {state.case.eraYear}
          </span>
        </div>
        <div className="spacer" />
        <div className="meta">
          <span className="live">
            <span className="dot" />
            Comandante · en línea
          </span>
          <div className="countdown">
            <div className="cd-label">
              <span className="cd-rec" />
              Para el veredicto
            </div>
            <div className={'cd-time' + (warn ? ' warn' : '')}>{formatClock(seconds)}</div>
          </div>
          {!resolution && (
            <button className="btn primary" onClick={() => setVerdictOpen(true)}>
              Cerrar el caso
            </button>
          )}
        </div>
      </header>

      <main className="smain">
        {/* ---- Chat ---- */}
        <section className="chat">
          <div className="thread scroll" ref={threadRef}>
            {state.messages.map((m) => (
              <MessageRow key={m.id} m={m} />
            ))}

            {pendingUser && (
              <div className="row me">
                <div className="avatar">TÚ</div>
                <div className="stack">
                  <div className="bubble">{pendingUser}</div>
                </div>
              </div>
            )}
            {pendingEvidence.map((ev) => (
              <div className="row them" key={'pe-' + ev.id}>
                <div className="avatar">C</div>
                <div className="stack">
                  <EvidenceCard ev={ev} />
                </div>
              </div>
            ))}
            {streaming && (
              <div className="row them">
                <div className="avatar">C</div>
                <div className="stack">
                  {liveText ? (
                    <div className="bubble">{liveText}</div>
                  ) : (
                    <div className="bubble typing">
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            <form
              className="composer-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) send(input.trim());
              }}
            >
              <div className="field">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe al Comandante — interroga o pide evidencia…"
                  disabled={streaming || !!resolution}
                  aria-label="Mensaje"
                />
              </div>
              <button className="send" type="submit" disabled={streaming || !input.trim() || !!resolution} aria-label="Enviar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11l18-8-8 18-2-7-8-3z" opacity=".9" />
                </svg>
              </button>
            </form>
            <div className="hints">
              <span>Pistas</span>
              <span className="hint-pip" aria-label={`${state.hintsUsed} de ${state.maxHints} pistas usadas`}>
                {Array.from({ length: state.maxHints }).map((_, i) => (
                  <b key={i} className={i < state.hintsUsed ? 'used' : ''} />
                ))}
              </span>
              <button
                className="hint-btn"
                style={{ marginLeft: 'auto' }}
                disabled={streaming || state.hintsUsed >= state.maxHints || !!resolution}
                onClick={() => send('', true)}
              >
                Pedir pista (−puntaje)
              </button>
            </div>
          </div>
        </section>

        {/* ---- Expediente ---- */}
        <aside className="exp">
          <div className="exp-head">
            <h2>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H3z" />
                <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2" />
              </svg>
              Expediente
            </h2>
          </div>
          <div className="tabs" role="tablist">
            <TabBtn id="documentos" active={tab} set={setTab} n={docs.length}>Documentos</TabBtn>
            <TabBtn id="audios" active={tab} set={setTab} n={audios.length}>Audios</TabBtn>
            <TabBtn id="videos" active={tab} set={setTab} n={videos.length}>Videos</TabBtn>
            <TabBtn id="sospechosos" active={tab} set={setTab} n={state.suspects.length}>Sospechosos</TabBtn>
            <TabBtn id="notas" active={tab} set={setTab}>Notas</TabBtn>
          </div>
          <div className="panels scroll">
            {tab === 'documentos' &&
              (docs.length ? docs.map((e) => <DocItem key={e.id} ev={e} />) : <Empty />)}
            {tab === 'audios' &&
              (audios.length ? audios.map((e) => <DocItem key={e.id} ev={e} />) : <Empty />)}
            {tab === 'videos' &&
              (videos.length ? videos.map((e) => <DocItem key={e.id} ev={e} />) : <Empty />)}
            {tab === 'sospechosos' &&
              state.suspects.map((s, i) => <Suspect key={s} name={s} n={i + 1} />)}
            {tab === 'notas' && <NotesTab code={code} />}

            {(tab === 'documentos' || tab === 'audios' || tab === 'videos') && (
              <UnlockBox onUnlock={unlockByCode} />
            )}
          </div>
        </aside>
      </main>

      {verdictOpen && (
        <VerdictModal suspects={state.suspects} onClose={() => setVerdictOpen(false)} onSubmit={submitVerdict} />
      )}
      {resolution && <ResolutionScreen r={resolution} />}
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */

function MessageRow({ m }: { m: Msg }) {
  if (m.kind === 'system') {
    return <div className="sys">{m.content}</div>;
  }
  const mine = m.role === 'players';
  return (
    <div className={'row ' + (mine ? 'me' : 'them')}>
      <div className="avatar">{mine ? 'TÚ' : 'C'}</div>
      <div className="stack">
        {m.kind === 'evidence_card' && m.evidence ? (
          <EvidenceCard ev={m.evidence} />
        ) : m.kind === 'voice' ? (
          <div className="bubble voice-b">
            <span className="voice-ic">🎙</span>
            <span className="voice-tx">{m.content}</span>
          </div>
        ) : (
          <div className="bubble">{m.content}</div>
        )}
      </div>
    </div>
  );
}

function EvidenceIcon({ kind }: { kind: PublicEvidence['kind'] }) {
  if (kind === 'audio')
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="4" width="10" height="16" rx="2" />
        <circle cx="10" cy="9" r="1.4" />
        <circle cx="14" cy="9" r="1.4" />
        <path d="M8 14h8" />
      </svg>
    );
  if (kind === 'video')
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="m10 9 5 3-5 3z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function EvidenceCard({ ev }: { ev: PublicEvidence }) {
  const kindLabel = ev.kind === 'audio' ? 'AUD' : ev.kind === 'video' ? 'VID' : 'DOC';
  return (
    <article className="ev">
      <div className="ev-tag">89 · {kindLabel}</div>
      <div className="ev-main">
        <div className="ev-ic">
          <EvidenceIcon kind={ev.kind} />
        </div>
        <div>
          <div className="ev-title">{ev.title}</div>
          <div className="ev-sub">
            {ev.kind} · {ev.code}
          </div>
        </div>
      </div>
    </article>
  );
}

function DocItem({ ev }: { ev: PublicEvidence }) {
  return (
    <div className="doc">
      <div className="di">
        <EvidenceIcon kind={ev.kind} />
      </div>
      <div className="dt">
        <b>{ev.title}</b>
        <div className="dsub mono">{ev.code}</div>
        {ev.body_md && <div className="dbody">{ev.body_md}</div>}
        {ev.transcript && (
          <div className="dbody" style={{ marginTop: 6, fontStyle: 'italic' }}>
            “{ev.transcript}”
          </div>
        )}
      </div>
    </div>
  );
}

function Suspect({ name, n }: { name: string; n: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <div className="susp">
      <div className="mug">{initials}</div>
      <div className="si">
        <h3>{name}</h3>
        <p>Sospechoso S-0{n}. Revisa la evidencia para ubicarlo en la ventana del crimen.</p>
      </div>
    </div>
  );
}

function TabBtn({
  id,
  active,
  set,
  n,
  children,
}: {
  id: Tab;
  active: Tab;
  set: (t: Tab) => void;
  n?: number;
  children: React.ReactNode;
}) {
  return (
    <button className={'tab' + (active === id ? ' active' : '')} onClick={() => set(id)} role="tab" aria-selected={active === id}>
      {children}
      {typeof n === 'number' && <span className="n">{n}</span>}
    </button>
  );
}

function Empty() {
  return <div className="exp-empty">Aún no reciben evidencia de este tipo. Pídansela al Comandante en el chat.</div>;
}

function UnlockBox({ onUnlock }: { onUnlock: (c: string) => Promise<boolean> }) {
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="unlock-row"
      style={{ marginTop: 6 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!val.trim()) return;
        const ok = await onUnlock(val.trim());
        setMsg(ok ? null : 'Código no válido o aún no disponible.');
        if (ok) setVal('');
      }}
    >
      <input className="input" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Desbloquear por código…" style={{ fontFamily: 'var(--font-mono)' }} />
      <button className="btn ghost" type="submit">Abrir</button>
      {msg && <span className="note-error" style={{ marginTop: 6 }}>{msg}</span>}
    </form>
  );
}

function NotesTab({ code }: { code: string }) {
  const key = `tn-notes-${code}`;
  const [notes, setNotes] = useState('');
  useEffect(() => {
    setNotes(localStorage.getItem(key) ?? '');
  }, [key]);
  return (
    <>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 8 }}>
        Bloc de la mesa · se guarda en este dispositivo
      </div>
      <textarea
        className="notepad"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          localStorage.setItem(key, e.target.value);
        }}
        placeholder="Teorías, horas clave, coartadas…"
      />
    </>
  );
}

function VerdictModal({
  suspects,
  onClose,
  onSubmit,
}: {
  suspects: string[];
  onClose: () => void;
  onSubmit: (accused: string, how: string, why: string) => void;
}) {
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
              {suspects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="vfield">
            <label className="label">¿Cómo? (cómo se rompe su coartada / mecánica)</label>
            <textarea className="input" value={how} onChange={(e) => setHow(e.target.value)} placeholder="La evidencia que lo ubica y contradice su versión…" />
          </div>
          <div className="vfield">
            <label className="label">¿Por qué? (móvil)</label>
            <textarea className="input" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="La razón detrás del crimen…" />
          </div>
          <div className="vactions">
            <button className="btn ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button
              className="btn primary"
              disabled={busy || !accused}
              onClick={async () => {
                setBusy(true);
                onSubmit(accused, how, why);
              }}
            >
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
        <span className={'verdict-mark ' + (ok ? 'ok' : 'bad')}>
          {ok ? '● Caso resuelto' : '● Caso sin cerrar'}
        </span>
        <h1>{ok ? 'Cerraron el expediente.' : 'El expediente sigue abierto.'}</h1>
        {r.feedback && <p style={{ color: 'var(--ink-2)' }}>{r.feedback}</p>}
        <div className="score mono">{r.verdict?.total_score ?? 0}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
          PUNTAJE / 100
        </div>

        <div className="brk">
          <div className="b">
            <div className="l">Culpable</div>
            <div className="v">{r.verdict?.culprit_correct ? '✓' : '✕'}</div>
          </div>
          <div className="b">
            <div className="l">Cómo</div>
            <div className="v" style={{ fontSize: 13 }}>{r.verdict?.how_score}</div>
          </div>
          <div className="b">
            <div className="l">Por qué</div>
            <div className="v" style={{ fontSize: 13 }}>{r.verdict?.why_score}</div>
          </div>
        </div>

        <div className="mono" style={{ fontSize: 11, color: 'var(--amber)', letterSpacing: '0.1em', marginTop: 20 }}>
          LA VERDAD DEL EXPEDIENTE — {r.culprit}
        </div>
        <p className="narr">{r.narrative}</p>

        <a className="btn primary lg" href="/mi-biblioteca">
          Volver a la biblioteca
        </a>
      </div>
    </div>
  );
}
