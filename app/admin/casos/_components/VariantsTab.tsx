'use client';

import { useState } from 'react';
import type { Variant, SuspectFull } from '@/lib/domain';
import { entityOp } from './entityApi';
import MediaUploader from './MediaUploader';

interface Draft {
  id?: string;
  code?: string;
  active?: boolean;
  culprit_suspect_id?: string | null;
  solution_narrative?: string;
  solution_voice_path?: string | null;
  commander_context?: string;
  rubric?: {
    how_summary?: string;
    how_keywords?: string[];
    why_summary?: string;
    why_keywords?: string[];
  };
}

const CODES = ['A', 'B', 'C'] as const;

export default function VariantsTab({
  slug,
  variants,
  setVariants,
  suspects,
}: {
  slug: string;
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  suspects: SuspectFull[];
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(op: 'create' | 'update' | 'delete', data: unknown) {
    setError(null);
    const res = await entityOp<Variant>(slug, 'variants', op, data);
    if (!res.ok) {
      setError(
        res.error === 'culprit_not_in_case'
          ? 'El culpable seleccionado no pertenece al caso.'
          : res.error === 'max_variants'
            ? 'Máximo 3 variantes.'
            : 'No se pudo guardar la variante.',
      );
      return false;
    }
    setVariants(res.list ?? []);
    return true;
  }

  const usedCodes = variants.map((v) => v.code);
  const freeCode = CODES.find((c) => !usedCodes.includes(c));

  return (
    <div className="cpanel">
      {error && <div className="note-error tab-error">{error}</div>}
      {suspects.length === 0 && (
        <div className="empty-hint">Primero agrega sospechosos: el culpable de cada variante sale de esa lista.</div>
      )}

      <div className="entity-list">
        {variants.map((v) => (
          <VariantCard
            key={v.id}
            slug={slug}
            variant={v}
            suspects={suspects}
            onSave={(data) => persist('update', { ...data, id: v.id })}
            onDelete={() => persist('delete', { id: v.id })}
          />
        ))}
        {adding && freeCode && (
          <VariantCard
            slug={slug}
            variant={{ code: freeCode, active: true, rubric: {} }}
            suspects={suspects}
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

      {!adding && variants.length < 3 && suspects.length > 0 && (
        <button className="btn ghost add-btn" onClick={() => setAdding(true)}>
          + Agregar variante {freeCode}
        </button>
      )}
    </div>
  );
}

function VariantCard({
  slug,
  variant,
  suspects,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  slug: string;
  variant: Draft;
  suspects: SuspectFull[];
  isNew?: boolean;
  onSave: (data: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(!!isNew);
  const [f, setF] = useState<Draft>({ ...variant, rubric: variant.rubric ?? {} });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const setRubric = (k: string, v: unknown) => setF((p) => ({ ...p, rubric: { ...p.rubric, [k]: v } }));

  const culpritName = suspects.find((s) => s.id === f.culprit_suspect_id)?.full_name;

  return (
    <div className="entity">
      <div className="entity-head" onClick={() => !isNew && setOpen((o) => !o)}>
        <span className="pill-kind" style={{ color: 'var(--amber)', borderColor: 'var(--amber-deep)' }}>Variante {f.code}</span>
        <span className="entity-title">{culpritName ?? 'Sin culpable'}</span>
        <span className="entity-spacer" />
        <span className="entity-meta">{f.active === false ? 'inactiva' : 'activa'}</span>
      </div>

      {open && (
        <div className="entity-body">
          <div className="form-grid">
            <div>
              <label className="label">Culpable</label>
              <select className="input" value={f.culprit_suspect_id ?? ''} onChange={(e) => set('culprit_suspect_id', e.target.value || null)}>
                <option value="">Selecciona sospechoso…</option>
                {suspects.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="toggle">
                <input type="checkbox" checked={f.active !== false} onChange={(e) => set('active', e.target.checked)} />
                <span className="track" />
                <span>Activa (entra al sorteo)</span>
              </label>
            </div>

            <div className="full">
              <label className="label">Contexto para el Comandante</label>
              <textarea
                className="input tall"
                placeholder="La verdad de esta variante que el Comandante puede usar — SIN nombrar al culpable."
                value={f.commander_context ?? ''}
                onChange={(e) => set('commander_context', e.target.value)}
              />
              <div className="field-hint">⚠ No menciones directamente al culpable: el Comandante nunca debe revelarlo.</div>
            </div>

            <div className="full">
              <label className="label">Narrativa de resolución</label>
              <textarea className="input tall" value={f.solution_narrative ?? ''} onChange={(e) => set('solution_narrative', e.target.value)} />
            </div>

            <div className="full">
              <MediaUploader
                caseSlug={slug}
                kind="audio"
                category="resolucion"
                value={f.solution_voice_path ?? null}
                onUploaded={(path) => set('solution_voice_path', path)}
                label="Audio de resolución (mp3)"
              />
            </div>

            <div>
              <label className="label">Rúbrica — resumen del “cómo”</label>
              <textarea className="input" value={f.rubric?.how_summary ?? ''} onChange={(e) => setRubric('how_summary', e.target.value)} />
              <input
                className="input mono"
                style={{ marginTop: 8 }}
                placeholder="palabras clave, separadas por coma"
                value={(f.rubric?.how_keywords ?? []).join(', ')}
                onChange={(e) => setRubric('how_keywords', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              />
            </div>
            <div>
              <label className="label">Rúbrica — resumen del “por qué”</label>
              <textarea className="input" value={f.rubric?.why_summary ?? ''} onChange={(e) => setRubric('why_summary', e.target.value)} />
              <input
                className="input mono"
                style={{ marginTop: 8 }}
                placeholder="palabras clave, separadas por coma"
                value={(f.rubric?.why_keywords ?? []).join(', ')}
                onChange={(e) => setRubric('why_keywords', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              />
            </div>
          </div>

          <div className="row-actions">
            <button
              className="btn primary"
              disabled={busy || !f.culprit_suspect_id}
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
