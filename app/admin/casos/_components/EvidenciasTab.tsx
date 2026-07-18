'use client';

import { useMemo, useState } from 'react';
import type { EvidenceFull, EvidenceType, Variant, TimelineEvent } from '@/lib/domain';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';
import Sheet from './Sheet';

const TYPE_TABS: { value: EvidenceType; label: string; prefix: string }[] = [
  { value: 'document', label: 'Documentos', prefix: 'DOC' },
  { value: 'photo', label: 'Fotos', prefix: 'FOTO' },
  { value: 'audio', label: 'Audios', prefix: 'AUD' },
  { value: 'video', label: 'Videos', prefix: 'VID' },
  { value: 'testimony', label: 'Testimonios', prefix: 'TEST' },
  { value: 'record', label: 'Registros', prefix: 'REG' },
];

interface Draft {
  id?: string; code?: string; title?: string; type?: EvidenceType;
  scope?: 'shared' | 'variant'; variant_id?: string | null;
  public_description?: string; admin_notes?: string;
  initial?: boolean; unlocked_at_minute?: number | null; unlocked_by_event_id?: string | null;
  body_md?: string | null; transcript?: string | null; image_path?: string | null;
  audio_path?: string | null; video_path?: string | null; caption?: string | null;
  witness_name?: string | null; record_type?: string | null;
}

const VERDICT_WORDS = ['asesino', 'asesina', 'culpable', 'mató', 'homicida', 'lo hizo', 'responsable'];

function toDraft(e: EvidenceFull): Draft {
  const b: Draft = {
    id: e.id, code: e.code, title: e.title, type: e.type, scope: e.scope, variant_id: e.variant_id,
    public_description: e.public_description, admin_notes: e.admin_notes, initial: e.initial,
    unlocked_at_minute: e.unlocked_at_minute, unlocked_by_event_id: e.unlocked_by_event_id,
  };
  switch (e.type) {
    case 'document': return { ...b, body_md: e.content.body_md, transcript: e.content.transcript, image_path: e.content.image_path };
    case 'photo': return { ...b, image_path: e.content.image_path, caption: e.content.caption };
    case 'audio': return { ...b, audio_path: e.content.audio_path, transcript: e.content.transcript };
    case 'video': return { ...b, video_path: e.content.video_path, transcript: e.content.transcript };
    case 'testimony': return { ...b, witness_name: e.content.witness_name, body_md: e.content.body_md, audio_path: e.content.audio_path };
    case 'record': return { ...b, record_type: e.content.record_type, body_md: e.content.body_md, image_path: e.content.image_path };
  }
}

function toPayload(f: Draft) {
  const t = f.type ?? 'document';
  const content: Record<string, unknown> = {};
  if (t === 'document') Object.assign(content, { body_md: f.body_md, transcript: f.transcript, image_path: f.image_path });
  if (t === 'photo') Object.assign(content, { image_path: f.image_path, caption: f.caption });
  if (t === 'audio') Object.assign(content, { audio_path: f.audio_path, transcript: f.transcript });
  if (t === 'video') Object.assign(content, { video_path: f.video_path, transcript: f.transcript });
  if (t === 'testimony') Object.assign(content, { witness_name: f.witness_name, body_md: f.body_md, audio_path: f.audio_path });
  if (t === 'record') Object.assign(content, { record_type: f.record_type, body_md: f.body_md, image_path: f.image_path });
  return {
    id: f.id, code: f.code, title: f.title, type: t, scope: f.scope ?? 'shared',
    variant_id: f.scope === 'variant' ? f.variant_id ?? null : null,
    public_description: f.public_description ?? '', admin_notes: f.admin_notes ?? '',
    initial: f.initial ?? false,
    unlocked_at_minute: f.initial ? null : f.unlocked_at_minute ?? null,
    unlocked_by_event_id: f.initial ? null : f.unlocked_by_event_id ?? null,
    content,
  };
}

export default function EvidenciasTab({
  slug,
  evidence,
  setEvidence,
  variants,
  timeline,
}: {
  slug: string;
  evidence: EvidenceFull[];
  setEvidence: (e: EvidenceFull[]) => void;
  variants: Variant[];
  timeline: TimelineEvent[];
}) {
  const [type, setType] = useState<EvidenceType>('document');
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = TYPE_TABS.find((t) => t.value === type)!;
  const list = useMemo(() => evidence.filter((e) => e.type === type), [evidence, type]);
  const counts = useMemo(() => {
    const m = new Map<EvidenceType, number>();
    for (const e of evidence) m.set(e.type, (m.get(e.type) ?? 0) + 1);
    return m;
  }, [evidence]);

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<EvidenceFull>(slug, 'evidence', op, data);
    if (!res.ok) { setError(res.error === 'db' ? 'Código duplicado u otro error de BD.' : 'No se pudo guardar.'); return false; }
    setEvidence(res.list ?? []);
    return true;
  }

  function nextCode(prefix: string) {
    const nums = evidence
      .map((e) => e.code.match(new RegExp('^' + prefix + '-(\\d+)$')))
      .filter(Boolean)
      .map((m) => Number(m![1]));
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}-${String(n).padStart(4, '0')}`;
  }

  function openNew() {
    setIsNew(true);
    setEditing({ type, scope: 'shared', initial: true, code: nextCode(current.prefix) });
  }

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}

      <div className="ev-subtabs">
        {TYPE_TABS.map((t) => (
          <button key={t.value} className={'ev-subtab' + (type === t.value ? ' active' : '')} onClick={() => setType(t.value)}>
            {t.label}
            <span className="tcount">{counts.get(t.value) ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={'ev-manager ' + type}>
        {list.length === 0 && <div className="empty-hint">Sin {current.label.toLowerCase()} todavía.</div>}

        {type === 'photo' ? (
          <div className="ev-gallery">
            {list.map((e) => (
              <button key={e.id} className="ev-tile" onClick={() => { setIsNew(false); setEditing(toDraft(e)); }}>
                <div className="ev-tile-img"><span className="mono">{e.code}</span></div>
                <span className="ev-tile-cap">{e.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ev-rows">
            {list.map((e) => (
              <button key={e.id} className="ev-mrow" onClick={() => { setIsNew(false); setEditing(toDraft(e)); }}>
                <span className="ev-mrow-code mono">{e.code}</span>
                <span className="ev-mrow-main">
                  <b>{e.title}</b>
                  <span className="ev-mrow-desc">{e.public_description || '— sin descripción pública —'}</span>
                </span>
                <span className="ev-mrow-flags mono">
                  {e.initial ? 'inicial' : e.unlocked_at_minute != null ? `min ${e.unlocked_at_minute}` : e.unlocked_by_event_id ? 'evento' : '—'}
                  {e.scope === 'variant' ? ' · var' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        <button className="btn ghost add-btn" onClick={openNew}>+ Agregar {current.label.slice(0, -1).toLowerCase()}</button>
      </div>

      {editing && (
        <EvidenceSheet
          slug={slug}
          draft={editing}
          variants={variants}
          timeline={timeline}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={async (d) => { const ok = await persist(isNew ? 'create' : 'update', toPayload(d)); if (ok) setEditing(null); }}
          onDelete={isNew || !editing.id ? undefined : async () => { if (window.confirm('¿Eliminar evidencia?')) { const ok = await persist('delete', { id: editing.id }); if (ok) setEditing(null); } }}
        />
      )}
    </div>
  );
}

function EvidenceSheet({
  slug, draft, variants, timeline, isNew, onClose, onSave, onDelete,
}: {
  slug: string; draft: Draft; variants: Variant[]; timeline: TimelineEvent[]; isNew: boolean;
  onClose: () => void; onSave: (d: Draft) => Promise<void>; onDelete?: () => void;
}) {
  const [f, setF] = useState<Draft>({ ...draft });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const type = f.type ?? 'document';

  const mediaField: keyof Draft | null =
    type === 'audio' || type === 'testimony' ? 'audio_path' : type === 'video' ? 'video_path' : type === 'photo' || type === 'document' || type === 'record' ? 'image_path' : null;
  const mediaKind = type === 'audio' || type === 'testimony' ? 'audio' : type === 'video' ? 'video' : 'image';

  // Validador de descripción pública.
  const descLow = (f.public_description ?? '').toLowerCase();
  const judged = VERDICT_WORDS.find((w) => descLow.includes(w));

  return (
    <Sheet
      open
      onClose={onClose}
      title={f.code || 'Nueva evidencia'}
      subtitle={type}
      footer={
        <div className="row-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>{onDelete && <button className="btn ghost" style={{ color: 'var(--alert)' }} onClick={onDelete}>Eliminar</button>}</div>
          <div className="row-actions">
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button className="btn primary" disabled={busy || !f.code || !f.title} onClick={async () => { setBusy(true); await onSave(f); setBusy(false); }}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <div>
          <label className="label">Código</label>
          <input className="input mono" value={f.code ?? ''} onChange={(e) => set('code', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="label">Título</label>
          <input className="input" value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} />
        </div>

        <div>
          <label className="label">Scope</label>
          <select className="input" value={f.scope ?? 'shared'} onChange={(e) => set('scope', e.target.value)}>
            <option value="shared">Compartida</option>
            <option value="variant">De variante</option>
          </select>
        </div>
        {f.scope === 'variant' && (
          <div>
            <label className="label">Variante</label>
            <select className="input" value={f.variant_id ?? ''} onChange={(e) => set('variant_id', e.target.value || null)}>
              <option value="">Selecciona…</option>
              {variants.map((v) => <option key={v.id} value={v.id}>Variante {v.code}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="toggle">
            <input type="checkbox" checked={f.initial ?? false} onChange={(e) => set('initial', e.target.checked)} />
            <span className="track" />
            <span>Inicial (min 0)</span>
          </label>
        </div>
        {!f.initial && (
          <>
            <div>
              <label className="label">Se libera al minuto</label>
              <input className="input mono" type="number" value={f.unlocked_at_minute ?? ''} onChange={(e) => set('unlocked_at_minute', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="label">…o por evento</label>
              <select className="input" value={f.unlocked_by_event_id ?? ''} onChange={(e) => set('unlocked_by_event_id', e.target.value || null)}>
                <option value="">Ninguno</option>
                {timeline.map((t) => <option key={t.id} value={t.id}>min {t.minute} · {t.action}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="full">
          <label className="label">Descripción pública (la ve el jugador en el listado)</label>
          <input className="input" placeholder="Neutra. No revela conclusiones, ni al culpable, ni info de variante." value={f.public_description ?? ''} onChange={(e) => set('public_description', e.target.value)} />
          {judged
            ? <div className="up-warn">⚠ Contiene un término de juicio (&ldquo;{judged}&rdquo;). La descripción pública debe ser neutra.</div>
            : <div className="field-hint">Debe describir qué es, no qué prueba.</div>}
        </div>

        {/* Contenido por tipo */}
        {type === 'testimony' && (
          <div className="full"><label className="label">Testigo</label>
            <input className="input" value={f.witness_name ?? ''} onChange={(e) => set('witness_name', e.target.value)} /></div>
        )}
        {type === 'record' && (
          <div className="full"><label className="label">Tipo de registro</label>
            <input className="input" placeholder="Bitácora, Registro telefónico…" value={f.record_type ?? ''} onChange={(e) => set('record_type', e.target.value)} /></div>
        )}
        {(type === 'document' || type === 'testimony' || type === 'record') && (
          <div className="full"><label className="label">Contenido (Markdown)</label>
            <textarea className="input tall" value={f.body_md ?? ''} onChange={(e) => set('body_md', e.target.value)} /></div>
        )}
        {type === 'photo' && (
          <div className="full"><label className="label">Pie de foto</label>
            <input className="input" value={f.caption ?? ''} onChange={(e) => set('caption', e.target.value)} /></div>
        )}
        {(type === 'audio' || type === 'video') && (
          <div className="full"><label className="label">Transcripción</label>
            <textarea className="input" value={f.transcript ?? ''} onChange={(e) => set('transcript', e.target.value)} /></div>
        )}

        {mediaField && (
          <div className="full">
            <MediaUploader
              caseSlug={slug}
              kind={mediaKind}
              category="evidencia"
              value={(f[mediaField] as string | null) ?? null}
              onUploaded={(path) => set(mediaField, path)}
              label={mediaKind === 'audio' ? 'Archivo de audio' : mediaKind === 'video' ? 'Archivo de video' : 'Imagen'}
            />
          </div>
        )}

        <div className="full">
          <label className="label">Notas admin (privadas)</label>
          <textarea className="input" placeholder="Red herrings, notas del autor. Jamás salen al cliente ni al Comandante." value={f.admin_notes ?? ''} onChange={(e) => set('admin_notes', e.target.value)} />
        </div>
      </div>
    </Sheet>
  );
}
