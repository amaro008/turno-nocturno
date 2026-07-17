'use client';

import { useState } from 'react';
import type { Case, EvidenceItem, Variant, ValidationMatrix } from '@/lib/domain';

export default function MatrixTab({
  caseRow,
  evidence,
  variants,
  unvalidated,
}: {
  caseRow: Case;
  evidence: EvidenceItem[];
  variants: Variant[];
  unvalidated: number;
}) {
  const [matrix, setMatrix] = useState<ValidationMatrix>(caseRow.validation_matrix ?? {});
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const cols = variants.map((v) => v.code);

  function cell(code: string, variant: string) {
    return matrix[code]?.[variant] ?? { consistent: false, note: '' };
  }
  function setCell(code: string, variant: string, patch: Partial<{ consistent: boolean; note: string }>) {
    setMatrix((prev) => ({
      ...prev,
      [code]: { ...(prev[code] ?? {}), [variant]: { ...cell(code, variant), ...patch } },
    }));
  }

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/admin/cases/${caseRow.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validation_matrix: matrix }),
    });
    setBusy(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString('es-MX'));
  }

  if (evidence.length === 0 || variants.length === 0) {
    return <div className="empty-hint">Agrega evidencias y variantes para generar la matriz.</div>;
  }

  return (
    <div className="cpanel wide">
      {unvalidated > 0 && (
        <div className="note-error matrix-warn">
          ⚠ {unvalidated} evidencia(s) sin validar en todas las variantes activas. Es documental (no bloquea
          guardar), pero conviene revisarlo antes de activar el caso.
        </div>
      )}

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th>Evidencia</th>
              {variants.map((v) => (
                <th key={v.id}>
                  {v.code} — {v.culprit}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evidence.map((e) => (
              <tr key={e.id}>
                <td className="ev">{e.code}</td>
                {cols.map((c) => {
                  const cv = cell(e.code, c);
                  return (
                    <td key={c}>
                      <div className="cell">
                        <label>
                          <input
                            type="checkbox"
                            checked={cv.consistent}
                            onChange={(ev) => setCell(e.code, c, { consistent: ev.target.checked })}
                          />
                          Consistente
                        </label>
                        <textarea
                          className="input"
                          placeholder="Nota…"
                          value={cv.note}
                          onChange={(ev) => setCell(e.code, c, { note: ev.target.value })}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky-save">
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar matriz'}
        </button>
        {savedAt && <span className="note-ok" style={{ padding: '6px 10px' }}>Guardado {savedAt}</span>}
      </div>
    </div>
  );
}
