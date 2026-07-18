'use client';

import { useMemo, useState } from 'react';
import type { EvidenceFull, EvidenceType, Variant } from '@/lib/domain';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

const TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'document', label: 'Documento' },
  { value: 'photo', label: 'Foto' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'testimony', label: 'Testimonio' },
  { value: 'record', label: 'Registro' },
];

// Estado plano del formulario (base + contenido de cualquier tipo).
interface Draft {
  id?: string;
  code?: string;
  title?: string;
  type?: EvidenceType;
  scope?: 'shared' | 'variant';
  variant_id?: string | null;
  public_description?: string;
  admin_notes?: string;
  initial?: boolean;
  unlocked_at_minute?: number | null;
  // contenido
  body_md?: string | null;
  transcript?: string | null;
  image_path?: string | null;
  audio_path?: string | null;
  video_path?: string | null;
  caption?: string | null;
  witness_name?: string | null;
  record_type?: string | null;
}

function toDraft(e: EvidenceFull): Draft {
  const base: Draft = {
    id: e.id, code: e.code, title: e.title, type: e.type, scope: e.scope,
    variant_id: e.variant_id, public_description: e.public_description, admin_notes: e.admin_notes,
    initial: e.initial, unlocked_at_minute: e.unlocked_at_minute,
  };
  switch (e.type) {
    case 'document': return { ...base, body_md: e.content.body_md, transcript: e.content.transcript, image_path: e.content.image_path };
    case 'photo': return { ...base, image_path: e.content.image_path, caption: e.content.caption };
    case 'audio': return { ...base, audio_path: e.content.audio_path, transcript: e.content.transcript };
    case 'video': return { ...base, video_path: e.content.video_path, transcript: e.content.transcript };
    case 'testimony': return { ...base, witness_name: e.content.witness_name, body_md: e.content.body_md, audio_path: e.content.audio_path };
    case 'record': return { ...base, record_type: e.content.record_type, body_md: e.content.body_md, image_path: e.content.image_path };
  }
}

function toPayload(f: Draft) {
  const content: Record<string, unknown> = {};
  const t = f.type ?? 'document';
  if (t === 'document') Object.assign(content, { body_md: f.body_md, transcript: f.transcript, image_path: f.image_path });
  if (t === 'photo') Object.assign(content, { image_path: f.image_path, caption: f.caption });
  if (t === 'audio') Object.assign(content, { audio_path: f.audio_path, transcript: f.transcript });
  if (t === 'video') Object.assign(content, { video_path: f.video_path, transcript: f.transcript });
  if (t === 'testimony') Object.assign(content, { witness_name: f.witness_name, body_md: f.body_md, audio_path: f.audio_path });
  if (t === 'record') Object.assign(content, { record_type: f.record_type, body_md: f.body_md, image_path: f.image_path });
  return {
    id: f.id,
    code: f.code,
    title: f.title,
    type: t,
    scope: f.scope ?? 'shared',
    variant_id: f.scope === 'variant' ? f.variant_id ?? null : null,
    public_description: f.public_description ?? '',
    admin_notes: f.admin_notes ?? '',
    initial: f.initial ?? false,
    unlocked_at_minute: f.initial ? null : f.unlocked_at_minute ?? null,
    content,
  };
}

export default function EvidenceTab({
  slug,
  evidence,
  setEvidence,
  variants,
}: {
  slug: string;
  evidence: EvidenceFull[];
  setEvidence: (e: EvidenceFull[]) => void;
  variants: Variant[];
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fScope, setFScope] = useState('all');
  const [fType, setFType] = useState('all');

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<EvidenceFull>(slug, 'evidence', op, data);
    if (!res.ok) {
      setError(res.error === 'db' ? 'Código duplicado u otro error de base de datos.' : 'No se pudo guardar la evidencia.');
      return false;
    }
    setEvidence(res.list ?? []);
    return true;
  }

  const filtered = useMemo(
    () => evidence.filter((e) => (fScope === 'all' || e.scope === fScope) && (fType === 'all' || e.type === fType)),
    [evidence, fScope, fType],
  );

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}
      <p className="field-hint" style={{ marginTop: -4 }}>
        Marca <b>inicial</b> lo que se abre desde el minuto 0. Lo demás se libera por minuto o por evento del Comandante.
        La <b>descripción pública</b> es lo único que ve el jugador en el listado; las <b>notas internas</b> nunca salen.
      </p>

      <div className="entity-filters">
        <select className="input" value={fScope} onChange={(e) => setFScope(e.target.value)}>
          <option value="all">Todos los scopes</option>
          <option value="shared">Compartida</option>
          <option value="variant">De variante</option>
        </select>
        <select className="input" value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="all">Todos los tipos</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="entity-list">
        {filtered.length === 0 && !adding && <div className="empty-hint">Sin evidencias con estos filtros.</div>}
        {filtered.map((e) => (
          <EvidenceCard
            key={e.id}
            slug={slug}
            item={toDraft(e)}
            variants={variants}
            onSave={(data) => persist('update', toPayload({ ...data, id: e.id }))}
            onDelete={() => persist('delete', { id: e.id })}
          />
        ))}
        {adding && (
          <EvidenceCard
            slug={slug}
            item={{ type: 'document', scope: 'shared', initial: true }}
            variants={variants}
            isNew
            onSave={async (data) => {
              const ok = await persist('create', toPayload(data));
              if (ok) setAdding(false);
              return ok;
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {!adding && (
        <button className="btn ghost add-btn" onClick={() => setAdding(true)}>+ Agregar evidencia</button>
      )}
    </div>
  );
}

function EvidenceCard({
  slug,
  item,
  variants,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  slug: string;
  item: Draft;
  variants: Variant[];
  isNew?: boolean;
  onSave: (data: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(!!isNew);
  const [f, setF] = useState<Draft>({ ...item });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const type = f.type ?? 'document';

  const mediaField: 'image_path' | 'audio_path' | 'video_path' | null =
    type === 'audio' ? 'audio_path' : type === 'video' ? 'video_path' : type === 'photo' || type === 'document' || type === 'record' || type === 'testimony' ? (type === 'testimony' ? 'audio_path' : 'image_path') : null;
  const mediaKind = type === 'audio' || type === 'testimony' ? 'audio' : type === 'video' ? 'video' : 'image';

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        <span className={'pill-kind ' + type}>{type}</span>
        <span className="entity-title">{f.code || (isNew ? 'Nueva evidencia' : '—')}</span>
        <span className="entity-meta">· {f.title}</span>
        <span className="entity-spacer" />
        <span className="entity-meta">{f.initial ? 'inicial' : f.scope === 'variant' ? 'variante' : 'compartida'}</span>
      </div>

      {open && (
        <div className="entity-body">
          <div className="form-grid">
            <div>
              <label className="label">Código único</label>
              <input className="input mono" placeholder="CINTA-0158" value={f.code ?? ''} onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="label">Título</label>
              <input className="input" value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={type} onChange={(e) => set('type', e.target.value)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Scope</label>
              <select className="input" value={f.scope ?? 'shared'} onChange={(e) => set('scope', e.target.value)}>
                <option value="shared">Compartida (todas las variantes)</option>
                <option value="variant">Específica de variante</option>
              </select>
            </div>

            {f.scope === 'variant' && (
              <div>
                <label className="label">Variante</label>
                <select className="input" value={f.variant_id ?? ''} onChange={(e) => set('variant_id', e.target.value || null)}>
                  <option value="">Selecciona…</option>
                  {variants.map((v) => <option key={v.id} value={v.id}>Variante {v.code} — {v.culprit}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="toggle">
                <input type="checkbox" checked={f.initial ?? false} onChange={(e) => set('initial', e.target.checked)} />
                <span className="track" />
                <span>Inicial (abierta desde el minuto 0)</span>
              </label>
            </div>
            {!f.initial && (
              <div>
                <label className="label">Se libera en el minuto</label>
                <input className="input mono" type="number" value={f.unlocked_at_minute ?? ''} onChange={(e) => set('unlocked_at_minute', e.target.value ? Number(e.target.value) : null)} />
              </div>
            )}

            <div className="full">
              <label className="label">Descripción pública (la ve el jugador en el listado)</label>
              <input className="input" placeholder="Fotografía tomada en la escena, 27/10/89 03:12. Sin conclusiones." value={f.public_description ?? ''} onChange={(e) => set('public_description', e.target.value)} />
            </div>

            {/* Contenido por tipo */}
            {type === 'testimony' && (
              <div className="full">
                <label className="label">Testigo</label>
                <input className="input" value={f.witness_name ?? ''} onChange={(e) => set('witness_name', e.target.value)} />
              </div>
            )}
            {type === 'record' && (
              <div className="full">
                <label className="label">Tipo de registro</label>
                <input className="input" placeholder="Bitácora de vigilancia, Registro telefónico…" value={f.record_type ?? ''} onChange={(e) => set('record_type', e.target.value)} />
              </div>
            )}
            {(type === 'document' || type === 'testimony' || type === 'record') && (
              <div className="full">
                <label className="label">Contenido (Markdown)</label>
                <textarea className="input tall" value={f.body_md ?? ''} onChange={(e) => set('body_md', e.target.value)} />
              </div>
            )}
            {type === 'photo' && (
              <div className="full">
                <label className="label">Pie de foto</label>
                <input className="input" value={f.caption ?? ''} onChange={(e) => set('caption', e.target.value)} />
              </div>
            )}
            {(type === 'audio' || type === 'video') && (
              <div className="full">
                <label className="label">Transcripción</label>
                <textarea className="input" value={f.transcript ?? ''} onChange={(e) => set('transcript', e.target.value)} />
              </div>
            )}

            {mediaField && (
              <div className="full">
                <MediaUploader
                  caseSlug={slug}
                  kind={mediaKind}
                  category="evidencia"
                  value={(f[mediaField] as string | null) ?? null}
                  onUploaded={(path) => set(mediaField, path)}
                  label={mediaKind === 'audio' ? 'Archivo de audio' : mediaKind === 'video' ? 'Archivo de video' : 'Imagen (opcional)'}
                />
              </div>
            )}

            <div className="full">
              <label className="label">Notas internas (admin-only)</label>
              <textarea className="input" placeholder="Notas del autor / red herrings. Jamás llegan al cliente ni al Comandante." value={f.admin_notes ?? ''} onChange={(e) => set('admin_notes', e.target.value)} />
            </div>
          </div>

          <div className="row-actions">
            <button
              className="btn primary"
              disabled={busy || !f.code || !f.title}
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
