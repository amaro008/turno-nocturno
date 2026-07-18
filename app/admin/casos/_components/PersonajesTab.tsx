'use client';

import { useState } from 'react';
import type { SuspectWithVariants, SuspectVariantData, Variant } from '@/lib/domain';
import { getSpec } from '@/lib/domain/image-specs';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';
import Sheet from './Sheet';
import { InitialsAvatar } from '@/components/Initials';

type Draft = Partial<SuspectWithVariants>;

export default function PersonajesTab({
  slug,
  suspects,
  setSuspects,
  variants,
}: {
  slug: string;
  suspects: SuspectWithVariants[];
  setSuspects: (s: SuspectWithVariants[]) => void;
  variants: Variant[];
}) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(op: 'create' | 'update' | 'delete' | 'reorder', data: unknown) {
    setError(null);
    const res = await entityOp<SuspectWithVariants>(slug, 'suspects', op, data);
    if (!res.ok) {
      setError('No se pudo guardar el personaje.');
      return false;
    }
    setSuspects(res.list ?? []);
    return true;
  }

  function openNew() {
    setIsNew(true);
    setEditing({ full_name: '', is_victim: false, variant_data: [] });
  }
  function openEdit(s: SuspectWithVariants) {
    setIsNew(false);
    setEditing({ ...s });
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...suspects];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSuspects(next);
    await entityOp<SuspectWithVariants>(slug, 'suspects', 'reorder', { ids: next.map((s) => s.id) });
  }

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}
      <p className="field-hint" style={{ marginTop: -4 }}>
        La ficha pública es idéntica en toda variante. Los datos de coartada, móvil y culpabilidad
        viven en la sección <b>confidencial</b> y jamás llegan al jugador. Marca a la víctima con su toggle.
      </p>

      <div className="char-grid">
        {suspects.map((s, i) => (
          <div className={'char-card' + (s.is_victim ? ' victim' : '')} key={s.id}>
            <button className="char-open" onClick={() => openEdit(s)}>
              <div className="char-photo">
                {/* La foto en admin usa el path directo del bucket vía el uploader; aquí iniciales */}
                <InitialsAvatar name={s.full_name} />
                {s.is_victim && <span className="char-badge">VÍCTIMA</span>}
              </div>
              <div className="char-body">
                <b>{s.full_name || 'Sin nombre'}</b>
                {s.occupation && <span className="char-occ">{s.occupation}</span>}
                <span className="char-vd mono">
                  {s.is_victim ? 'víctima' : `culpable en ${s.variant_data.filter((v) => v.is_culprit_in_variant).length} variante(s)`}
                </span>
              </div>
            </button>
            {!s.is_victim && (
              <span className="char-reorder" onClick={(e) => e.stopPropagation()}>
                <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">▲</button>
                <button disabled={i >= suspects.length - 1} onClick={() => move(i, 1)} aria-label="Bajar">▼</button>
              </span>
            )}
          </div>
        ))}
        <button className="char-add" onClick={openNew}>+ Agregar personaje</button>
      </div>

      {editing && (
        <CharSheet
          slug={slug}
          draft={editing}
          variants={variants}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            const ok = await persist(isNew ? 'create' : 'update', payload);
            if (ok) setEditing(null);
          }}
          onDelete={
            isNew || !editing.id
              ? undefined
              : async () => {
                  if (window.confirm('¿Eliminar este personaje?')) {
                    const ok = await persist('delete', { id: editing.id });
                    if (ok) setEditing(null);
                  }
                }
          }
        />
      )}
    </div>
  );
}

function CharSheet({
  slug,
  draft,
  variants,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  slug: string;
  draft: Draft;
  variants: Variant[];
  isNew: boolean;
  onClose: () => void;
  onSave: (payload: unknown) => Promise<void>;
  onDelete?: () => void;
}) {
  const [f, setF] = useState<Draft>({ ...draft });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SuspectWithVariants, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  // Data por variante indexada.
  const vdByVariant = new Map<string, Partial<SuspectVariantData>>(
    (f.variant_data ?? []).map((v) => [v.variant_id, v]),
  );
  function setVD(variantId: string, patch: Partial<SuspectVariantData>) {
    const cur = vdByVariant.get(variantId) ?? { variant_id: variantId };
    const merged = { ...cur, ...patch, variant_id: variantId };
    const next = (f.variant_data ?? []).filter((v) => v.variant_id !== variantId);
    next.push(merged as SuspectVariantData);
    set('variant_data', next);
  }

  function payload() {
    return {
      id: f.id,
      full_name: f.full_name ?? '',
      age: f.age ?? null,
      occupation: f.occupation ?? null,
      relationship_to_victim: f.relationship_to_victim ?? null,
      physical_description: f.physical_description ?? '',
      distinctive_features: f.distinctive_features ?? '',
      accent_or_speech: f.accent_or_speech ?? null,
      typical_attire: f.typical_attire ?? null,
      photo_path: f.photo_path ?? null,
      is_victim: f.is_victim ?? false,
      internal_notes: f.internal_notes ?? null,
      image_prompt: f.image_prompt ?? '',
      variant_data: f.is_victim ? [] : (f.variant_data ?? []).map((v) => ({
        variant_id: v.variant_id,
        alibi_declared: v.alibi_declared ?? null,
        motive_apparent: v.motive_apparent ?? null,
        variant_specific_notes: v.variant_specific_notes ?? null,
        is_culprit_in_variant: v.is_culprit_in_variant ?? false,
      })),
    };
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={f.full_name || (isNew ? 'Nuevo personaje' : 'Personaje')}
      subtitle={f.is_victim ? 'víctima' : 'sospechoso'}
      footer={
        <div className="row-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>{onDelete && <button className="btn ghost" style={{ color: 'var(--alert)' }} onClick={onDelete}>Eliminar</button>}</div>
          <div className="row-actions">
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn primary"
              disabled={busy || !f.full_name}
              onClick={async () => { setBusy(true); await onSave(payload()); setBusy(false); }}
            >
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      }
    >
      {/* -------- Sección PÚBLICA -------- */}
      <section className="sheet-sec public">
        <div className="sheet-sec-head">
          <span className="sheet-sec-tag">Ficha pública</span>
          <label className="toggle">
            <input type="checkbox" checked={f.is_victim ?? false} onChange={(e) => set('is_victim', e.target.checked)} />
            <span className="track" />
            <span>Es la víctima</span>
          </label>
        </div>
        <div className="form-grid">
          <div className="full">
            <label className="label">Nombre</label>
            <input className="input" value={f.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Edad</label>
            <input className="input mono" type="number" value={f.age ?? ''} onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="label">Ocupación</label>
            <input className="input" value={f.occupation ?? ''} onChange={(e) => set('occupation', e.target.value)} />
          </div>
          <div className="full">
            <label className="label">Vínculo con la víctima (objetivo)</label>
            <input className="input" placeholder="empleado de la empresa, hermana de la víctima…" value={f.relationship_to_victim ?? ''} onChange={(e) => set('relationship_to_victim', e.target.value)} />
          </div>
          <div className="full">
            <label className="label">Descripción física (neutra)</label>
            <textarea className="input" value={f.physical_description ?? ''} onChange={(e) => set('physical_description', e.target.value)} />
          </div>
          <div className="full">
            <label className="label">Rasgos distintivos (observables)</label>
            <textarea className="input" value={f.distinctive_features ?? ''} onChange={(e) => set('distinctive_features', e.target.value)} />
          </div>
          <div>
            <label className="label">Acento / habla</label>
            <input className="input" value={f.accent_or_speech ?? ''} onChange={(e) => set('accent_or_speech', e.target.value)} />
          </div>
          <div>
            <label className="label">Vestimenta habitual</label>
            <input className="input" value={f.typical_attire ?? ''} onChange={(e) => set('typical_attire', e.target.value)} />
          </div>
          <div className="full">
            <MediaUploader
              caseSlug={slug}
              kind="image"
              category="sospechosos"
              value={f.photo_path ?? null}
              onUploaded={(path) => set('photo_path', path)}
              label="Foto"
              spec={getSpec('suspect.portrait')}
            />
          </div>
        </div>
      </section>

      {/* -------- Sección ADMIN (confidencial) -------- */}
      {!f.is_victim && (
        <section className="sheet-sec admin">
          <div className="sheet-sec-head">
            <span className="sheet-sec-tag danger">Confidencial · solo admin</span>
          </div>
          <p className="confidential-note">Nada de esta sección llega al jugador. El Comandante solo recibe coartada, móvil y notas (nunca la culpabilidad).</p>

          <div className="form-grid">
            <div className="full">
              <label className="label">Notas internas</label>
              <textarea className="input" value={f.internal_notes ?? ''} onChange={(e) => set('internal_notes', e.target.value)} />
            </div>
          </div>

          {variants.length === 0 && <div className="empty-hint">Agrega variantes en la pestaña Guion para definir coartada y culpabilidad.</div>}
          {variants.map((v) => {
            const vd = vdByVariant.get(v.id) ?? {};
            return (
              <div className="variant-block" key={v.id}>
                <div className="variant-block-head">
                  <span className="pill-kind" style={{ color: 'var(--amber)', borderColor: 'var(--amber-deep)' }}>Variante {v.code}</span>
                  <label className="toggle culprit">
                    <input type="checkbox" checked={vd.is_culprit_in_variant ?? false} onChange={(e) => setVD(v.id, { is_culprit_in_variant: e.target.checked })} />
                    <span className="track" />
                    <span>Es culpable en esta variante</span>
                  </label>
                </div>
                <div className="form-grid">
                  <div className="full">
                    <label className="label">Coartada declarada</label>
                    <textarea className="input" value={vd.alibi_declared ?? ''} onChange={(e) => setVD(v.id, { alibi_declared: e.target.value })} />
                  </div>
                  <div className="full">
                    <label className="label">Móvil aparente</label>
                    <textarea className="input" value={vd.motive_apparent ?? ''} onChange={(e) => setVD(v.id, { motive_apparent: e.target.value })} />
                  </div>
                  <div className="full">
                    <label className="label">Notas específicas de la variante</label>
                    <textarea className="input" value={vd.variant_specific_notes ?? ''} onChange={(e) => setVD(v.id, { variant_specific_notes: e.target.value })} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </Sheet>
  );
}
