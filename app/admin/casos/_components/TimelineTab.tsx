'use client';

import { useState } from 'react';
import type { TimelineEvent, EvidenceFull } from '@/lib/domain';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

interface Draft {
  id?: string;
  minute?: number;
  action?: string;
  variant_scope?: string | null;
  payload?: Record<string, unknown>;
}

const ACTIONS = [
  { value: 'message', label: 'Mensaje' },
  { value: 'voice', label: 'Nota de voz' },
  { value: 'evidence', label: 'Entregar evidencia' },
  { value: 'pressure', label: 'Presión' },
  { value: 'deadline', label: 'Deadline' },
];

export default function TimelineTab({
  slug,
  timeline,
  setTimeline,
  evidence,
}: {
  slug: string;
  timeline: TimelineEvent[];
  setTimeline: (t: TimelineEvent[]) => void;
  evidence: EvidenceFull[];
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<TimelineEvent>(slug, 'timeline', op, data);
    if (!res.ok) {
      setError(
        res.error === 'duplicate_minute_action'
          ? 'Ya existe un evento con ese minuto y acción.'
          : 'No se pudo guardar el evento.',
      );
      return false;
    }
    setTimeline(res.list ?? []);
    return true;
  }

  return (
    <div className="cpanel wide">
      {error && <div className="note-error tab-error">{error}</div>}

      {/* Preview visual */}
      {timeline.length > 0 && (
        <div className="tl-preview">
          <div className="tl-line" />
          <div className="tl-marks">
            {timeline.map((t) => (
              <div className="tl-mark" key={t.id}>
                <span className="tl-min">{t.minute}′</span>
                <span className={'tl-dot' + (t.action === 'deadline' ? ' deadline' : '')} />
                <span className="tl-act">{t.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="entity-list" style={{ maxWidth: 760 }}>
        {timeline.length === 0 && !adding && (
          <div className="empty-hint">Sin eventos temporales. Agrega el briefing (minuto 0) para empezar.</div>
        )}
        {timeline.map((t) => (
          <TimelineCard
            key={t.id}
            slug={slug}
            event={t}
            evidence={evidence}
            onSave={(data) => persist('update', { ...data, id: t.id })}
            onDelete={() => persist('delete', { id: t.id })}
          />
        ))}
        {adding && (
          <TimelineCard
            slug={slug}
            event={{ minute: 0, action: 'message', variant_scope: null, payload: {} }}
            evidence={evidence}
            isNew
            onSave={async (data) => {
              const ok = await persist('create', data);
              if (ok) setAdding(false);
              return ok;
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {!adding && (
        <button className="btn ghost add-btn" onClick={() => setAdding(true)}>
          + Agregar evento
        </button>
      )}
    </div>
  );
}

function TimelineCard({
  slug,
  event,
  evidence,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  slug: string;
  event: Draft;
  evidence: EvidenceFull[];
  isNew?: boolean;
  onSave: (data: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(!!isNew);
  const [f, setF] = useState<Draft>({ ...event, payload: event.payload ?? {} });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const setPayload = (k: string, v: unknown) => setF((p) => ({ ...p, payload: { ...p.payload, [k]: v } }));

  const action = f.action ?? 'message';
  const p = (f.payload ?? {}) as Record<string, unknown>;

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        <span className="pill-kind" style={{ color: 'var(--amber)' }}>{f.minute}′</span>
        <span className="entity-title">{ACTIONS.find((a) => a.value === action)?.label}</span>
        <span className="entity-spacer" />
        <span className="entity-meta">{f.variant_scope ? `variante ${f.variant_scope}` : 'todas'}</span>
      </div>

      {open && (
        <div className="entity-body">
          <div className="form-grid">
            <div>
              <label className="label">Minuto</label>
              <input className="input mono" type="number" value={f.minute ?? 0} onChange={(e) => set('minute', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Acción</label>
              <select className="input" value={action} onChange={(e) => set('action', e.target.value)}>
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Aplica a variante</label>
              <select className="input" value={f.variant_scope ?? ''} onChange={(e) => set('variant_scope', e.target.value || null)}>
                <option value="">Todas</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {/* Payload según acción */}
            {(action === 'message' || action === 'pressure' || action === 'deadline') && (
              <div className="full">
                <label className="label">Texto del Comandante</label>
                <textarea className="input" value={(p.text as string) ?? ''} onChange={(e) => setPayload('text', e.target.value)} />
              </div>
            )}
            {action === 'voice' && (
              <>
                <div className="full">
                  <label className="label">Texto / transcripción</label>
                  <textarea className="input" value={(p.text as string) ?? ''} onChange={(e) => setPayload('text', e.target.value)} />
                </div>
                <div className="full">
                  <MediaUploader
                    caseSlug={slug}
                    kind="audio"
                    category="timeline"
                    value={(p.voice_path as string) ?? null}
                    onUploaded={(path) => setPayload('voice_path', path)}
                    label="Nota de voz (mp3, opcional)"
                  />
                </div>
              </>
            )}
            {action === 'evidence' && (
              <div className="full">
                <label className="label">Evidencia a entregar</label>
                <select
                  className="input"
                  value={(p.evidence_code as string) ?? ''}
                  onChange={(e) => setPayload('evidence_code', e.target.value)}
                >
                  <option value="">Selecciona…</option>
                  {evidence.map((ev) => (
                    <option key={ev.id} value={ev.code}>{ev.code} — {ev.title}</option>
                  ))}
                </select>
                <div className="field-hint">
                  Para entregas distintas por variante, crea un evento por variante con su scope y evidencia.
                </div>
                <label className="label" style={{ marginTop: 10 }}>Texto que acompaña (opcional)</label>
                <textarea className="input" value={(p.text as string) ?? ''} onChange={(e) => setPayload('text', e.target.value)} />
              </div>
            )}
          </div>

          <div className="row-actions">
            <button
              className="btn primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const ok = await onSave(f);
                setBusy(false);
                if (ok && !isNew) setOpen(false);
              }}
            >
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
            {isNew ? (
              <button className="btn ghost" onClick={onCancel}>Cancelar</button>
            ) : (
              <button className="btn ghost" style={{ color: 'var(--alert)' }} onClick={onDelete}>Eliminar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
