'use client';

import { useState } from 'react';
import type { Suspect } from '@/lib/domain';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

type Draft = Partial<Suspect>;

export default function SuspectsTab({
  slug,
  suspects,
  setSuspects,
}: {
  slug: string;
  suspects: Suspect[];
  setSuspects: (s: Suspect[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<Suspect>(slug, 'suspects', op, data);
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
    await entityOp<Suspect>(slug, 'suspects', 'reorder', { ids: next.map((s) => s.id) });
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

  const set = (k: keyof Suspect, v: unknown) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        {!isNew && onMove && (
          <span className="reorder-btns" onClick={(e) => e.stopPropagation()}>
            <button disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">▲</button>
            <button disabled={(index ?? 0) >= (total ?? 1) - 1} onClick={() => onMove(1)} aria-label="Bajar">▼</button>
          </span>
        )}
        <span className="entity-title">{f.name || (isNew ? 'Nuevo sospechoso' : 'Sin nombre')}</span>
        {f.occupation && <span className="entity-meta">· {f.occupation}</span>}
        <span className="entity-spacer" />
        {!isNew && <span className="entity-meta">{open ? 'cerrar' : 'editar'}</span>}
      </div>

      {open && (
        <div className="entity-body">
          <div className="form-grid">
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} />
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
              <label className="label">Relación con la víctima</label>
              <input className="input" value={f.relation ?? ''} onChange={(e) => set('relation', e.target.value)} />
            </div>
            <div className="full">
              <label className="label">Descripción</label>
              <textarea className="input" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="full">
              <label className="label">Coartada declarada</label>
              <textarea className="input" value={f.alibi ?? ''} onChange={(e) => set('alibi', e.target.value)} />
            </div>
            <div className="full">
              <MediaUploader
                caseSlug={slug}
                kind="image"
                category="sospechosos"
                value={f.photo_path ?? null}
                onUploaded={(path) => set('photo_path', path)}
                label="Foto (opcional)"
              />
            </div>
          </div>

          <div className="row-actions">
            <button
              className="btn primary"
              disabled={busy || !f.name}
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
