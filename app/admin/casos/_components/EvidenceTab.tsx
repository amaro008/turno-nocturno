'use client';

import { useMemo, useState } from 'react';
import type { EvidenceItem, Variant } from '@/lib/domain';
import { getSpec } from '@/lib/domain/image-specs';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

type Draft = Partial<EvidenceItem>;

export default function EvidenceTab({
  slug,
  evidence,
  setEvidence,
  variants,
}: {
  slug: string;
  evidence: EvidenceItem[];
  setEvidence: (e: EvidenceItem[]) => void;
  variants: Variant[];
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fScope, setFScope] = useState<string>('all');
  const [fKind, setFKind] = useState<string>('all');

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<EvidenceItem>(slug, 'evidence', op, data);
    if (!res.ok) {
      setError(
        res.error === 'db' ? 'Código duplicado u otro error de base de datos.' : 'No se pudo guardar la evidencia.',
      );
      return false;
    }
    setEvidence(res.list ?? []);
    return true;
  }

  const filtered = useMemo(
    () =>
      evidence.filter(
        (e) => (fScope === 'all' || e.scope === fScope) && (fKind === 'all' || e.kind === fKind),
      ),
    [evidence, fScope, fKind],
  );

  const allCodes = evidence.map((e) => e.code);

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}

      <div className="entity-filters">
        <select className="input" value={fScope} onChange={(e) => setFScope(e.target.value)}>
          <option value="all">Todos los scopes</option>
          <option value="shared">Compartida</option>
          <option value="variant">De variante</option>
        </select>
        <select className="input" value={fKind} onChange={(e) => setFKind(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="document">Documento</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="hint">Pista</option>
        </select>
      </div>

      <div className="entity-list">
        {filtered.length === 0 && !adding && <div className="empty-hint">Sin evidencias con estos filtros.</div>}
        {filtered.map((e) => (
          <EvidenceCard
            key={e.id}
            slug={slug}
            item={e}
            variants={variants}
            allCodes={allCodes.filter((c) => c !== e.code)}
            onSave={(data) => persist('update', { ...data, id: e.id })}
            onDelete={() => persist('delete', { id: e.id })}
          />
        ))}
        {adding && (
          <EvidenceCard
            slug={slug}
            item={{ kind: 'document', scope: 'shared', delivery: 'on_request', deliverable_from_minute: 0, unlocked_by: [] }}
            variants={variants}
            allCodes={allCodes}
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
          + Agregar evidencia
        </button>
      )}
    </div>
  );
}

function EvidenceCard({
  slug,
  item,
  variants,
  allCodes,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  slug: string;
  item: Draft;
  variants: Variant[];
  allCodes: string[];
  isNew?: boolean;
  onSave: (data: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(!!isNew);
  const [f, setF] = useState<Draft>({ ...item });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof EvidenceItem, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const kind = f.kind ?? 'document';
  const uploadKind = kind === 'audio' ? 'audio' : kind === 'video' ? 'video' : 'image';
  const uploadSpec =
    kind === 'video' ? getSpec('video.vhs_clip') : uploadKind === 'image' ? getSpec('evidence.document') : undefined;

  function togglePrereq(code: string) {
    const cur = new Set(f.unlocked_by ?? []);
    if (cur.has(code)) cur.delete(code);
    else cur.add(code);
    set('unlocked_by', Array.from(cur));
  }

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        <span className={'pill-kind ' + kind}>{kind}</span>
        <span className="entity-title">{f.code || (isNew ? 'Nueva evidencia' : '—')}</span>
        <span className="entity-meta">· {f.title}</span>
        <span className="entity-spacer" />
        <span className="entity-meta">{f.scope === 'variant' ? 'variante' : 'compartida'}</span>
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
              <select className="input" value={kind} onChange={(e) => set('kind', e.target.value)}>
                <option value="document">Documento</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="hint">Pista</option>
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
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      Variante {v.code} — {v.culprit}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Entregable desde el minuto</label>
              <input className="input mono" type="number" value={f.deliverable_from_minute ?? 0} onChange={(e) => set('deliverable_from_minute', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Cómo se entrega</label>
              <select className="input" value={f.delivery ?? 'on_request'} onChange={(e) => set('delivery', e.target.value)}>
                <option value="on_request">A petición (on_request)</option>
                <option value="chat_push">Empujada al chat (chat_push)</option>
                <option value="code_only">Solo por código (code_only)</option>
              </select>
            </div>

            {(kind === 'document' || kind === 'hint') && (
              <div className="full">
                <label className="label">Contenido (Markdown)</label>
                <textarea className="input tall" value={f.body_md ?? ''} onChange={(e) => set('body_md', e.target.value)} />
              </div>
            )}
            {(kind === 'audio' || kind === 'video') && (
              <div className="full">
                <label className="label">Transcripción</label>
                <textarea className="input" value={f.transcript ?? ''} onChange={(e) => set('transcript', e.target.value)} />
              </div>
            )}

            <div className="full">
              <MediaUploader
                caseSlug={slug}
                kind={uploadKind}
                category="evidencia"
                value={f.media_path ?? null}
                onUploaded={(path) => set('media_path', path)}
                label={kind === 'document' || kind === 'hint' ? 'Imagen (opcional)' : `Archivo de ${kind}`}
                spec={uploadSpec}
              />
            </div>

            {allCodes.length > 0 && (
              <div className="full">
                <label className="label">Prerequisitos (deben desbloquearse antes)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allCodes.map((code) => (
                    <label key={code} className="pill-kind" style={{ cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>
                      <input type="checkbox" checked={(f.unlocked_by ?? []).includes(code)} onChange={() => togglePrereq(code)} />
                      {code}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview inline */}
          {(f.body_md || f.transcript) && (
            <div className="doc-preview" style={{ borderLeft: '2px solid var(--line)', paddingLeft: 12, color: 'var(--ink-2)', fontSize: 13 }}>
              {f.body_md && <div>{f.body_md}</div>}
              {f.transcript && <div style={{ fontStyle: 'italic', marginTop: 4 }}>“{f.transcript}”</div>}
            </div>
          )}

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
