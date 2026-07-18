'use client';

import { useState } from 'react';
import type { SuspectFull } from '@/lib/domain';
import { getSpec } from '@/lib/domain/image-specs';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

type Draft = Partial<SuspectFull>;

export default function SuspectsTab({
  slug,
  suspects,
  setSuspects,
}: {
  slug: string;
  suspects: SuspectFull[];
  setSuspects: (s: SuspectFull[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<SuspectFull>(slug, 'suspects', op, data);
    if (!res.ok) {
      setError('No se pudo guardar el sospechoso.');
      return false;
    }
    setSuspects(res.list ?? []);
    return true;
  }

  async function reorder(idx: number, dir: -1 | 1) {
    const next = [...suspects];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSuspects(next);
    await entityOp<SuspectFull>(slug, 'suspects', 'reorder', { ids: next.map((s) => s.id) });
  }

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}
      <p className="field-hint" style={{ marginTop: -4 }}>
        Los sospechosos son compartidos entre variantes. En cada variante, uno de ellos será el culpable.
      </p>

      <div className="entity-list">
        {suspects.length === 0 && !adding && (
          <div className="empty-hint">Aún no hay sospechosos. Agrega al menos dos.</div>
        )}
        {suspects.map((s, i) => (
          <SuspectCard
            key={s.id}
            slug={slug}
            suspect={s}
            index={i}
            total={suspects.length}
            onSave={(data) => persist('update', { ...data, id: s.id })}
            onDelete={() => persist('delete', { id: s.id })}
            onMove={(dir) => reorder(i, dir)}
          />
        ))}
        {adding && (
          <SuspectCard
            slug={slug}
            suspect={{}}
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
          + Agregar sospechoso
        </button>
      )}
    </div>
  );
}

function SuspectCard({
  slug,
  suspect,
  index,
  total,
  isNew,
  onSave,
  onDelete,
  onMove,
  onCancel,
}: {
  slug: string;
  suspect: Draft;
  index?: number;
  total?: number;
  isNew?: boolean;
  onSave: (data: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onMove?: (dir: -1 | 1) => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(!!isNew);
  const [f, setF] = useState<Draft>({ ...suspect });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof SuspectFull, v: unknown) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        {!isNew && onMove && (
          <span className="reorder-btns" onClick={(e) => e.stopPropagation()}>
            <button disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">▲</button>
            <button disabled={(index ?? 0) >= (total ?? 1) - 1} onClick={() => onMove(1)} aria-label="Bajar">▼</button>
          </span>
        )}
        <span className="entity-title">{f.full_name || (isNew ? 'Nuevo sospechoso' : 'Sin nombre')}</span>
        {f.occupation && <span className="entity-meta">· {f.occupation}</span>}
        <span className="entity-spacer" />
        {!isNew && <span className="entity-meta">{open ? 'cerrar' : 'editar'}</span>}
      </div>

      {open && (
        <div className="entity-body">
          <div className="form-grid">
            <div>
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
            <div>
              <label className="label">Vínculo con la víctima (objetivo)</label>
              <input className="input" placeholder="empleado de la empresa, hermana de la víctima…" value={f.relationship_to_victim ?? ''} onChange={(e) => set('relationship_to_victim', e.target.value)} />
            </div>
            <div className="full">
              <label className="label">Descripción física (neutra)</label>
              <textarea className="input" value={f.physical_description ?? ''} onChange={(e) => set('physical_description', e.target.value)} />
            </div>
            <div className="full">
              <label className="label">Rasgos distintivos (observables)</label>
              <textarea className="input" placeholder="Tatuajes, cicatrices, lentes… marcas visibles, no secretos." value={f.distinctive_features ?? ''} onChange={(e) => set('distinctive_features', e.target.value)} />
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
              <label className="label">Notas internas (admin-only)</label>
              <textarea className="input" placeholder="Notas del autor. Jamás llegan al cliente ni al Comandante." value={f.internal_notes ?? ''} onChange={(e) => set('internal_notes', e.target.value)} />
              <div className="field-hint">La coartada y el móvil por variante se editan en la pestaña Variantes.</div>
            </div>
            <div className="full">
              <MediaUploader
                caseSlug={slug}
                kind="image"
                category="sospechosos"
                value={f.photo_path ?? null}
                onUploaded={(path) => set('photo_path', path)}
                label="Foto (opcional)"
                spec={getSpec('suspect.portrait')}
              />
            </div>
          </div>

          <div className="row-actions">
            <button
              className="btn primary"
              disabled={busy || !f.full_name}
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
