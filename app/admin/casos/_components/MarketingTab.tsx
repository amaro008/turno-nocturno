'use client';

import { useState } from 'react';
import type { Case } from '@/lib/domain';
import MediaUploader from './MediaUploader';

export default function MarketingTab({ caseRow }: { caseRow: Case }) {
  const [f, setF] = useState({
    cover_image_path: caseRow.cover_image_path ?? null,
    atmosphere_image_path: caseRow.atmosphere_image_path ?? null,
    marketing_synopsis: caseRow.marketing_synopsis ?? '',
    difficulty: caseRow.difficulty ?? 'medio',
    players_min: caseRow.players_min ?? 2,
    players_max: caseRow.players_max ?? 6,
  });
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/admin/cases/${caseRow.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString('es-MX'));
  }

  return (
    <div className="cpanel">
      <p className="field-hint" style={{ marginTop: -4 }}>
        Estos campos son lo que ve el público. La sinopsis de marketing debe vender el caso{' '}
        <b>sin spoilers</b> (distinta del sinopsis técnico).
      </p>

      <div className="form-grid">
        <div className="full">
          <MediaUploader
            caseSlug={caseRow.slug}
            kind="image"
            category="cover"
            value={f.cover_image_path}
            onUploaded={(path) => set('cover_image_path', path)}
            label="Imagen de portada (catálogo y detalle)"
          />
        </div>
        <div className="full">
          <MediaUploader
            caseSlug={caseRow.slug}
            kind="image"
            category="atmosphere"
            value={f.atmosphere_image_path}
            onUploaded={(path) => set('atmosphere_image_path', path)}
            label="Imagen atmosférica (hero del home)"
          />
        </div>

        <div className="full">
          <label className="label">Sinopsis de marketing (sin spoilers)</label>
          <textarea
            className="input tall"
            value={f.marketing_synopsis}
            onChange={(e) => set('marketing_synopsis', e.target.value)}
            placeholder="Un locutor nocturno silenciado en vivo. Una ciudad que prefirió olvidar. Tienen una noche para reabrir el caso…"
          />
        </div>

        <div>
          <label className="label">Dificultad</label>
          <select className="input" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
            <option value="facil">Fácil</option>
            <option value="medio">Medio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Jugadores mín.</label>
            <input className="input mono" type="number" value={f.players_min} onChange={(e) => set('players_min', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Jugadores máx.</label>
            <input className="input mono" type="number" value={f.players_max} onChange={(e) => set('players_max', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="sticky-save">
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar marketing'}
        </button>
        {savedAt && <span className="note-ok" style={{ padding: '6px 10px' }}>Guardado {savedAt}</span>}
      </div>
    </div>
  );
}
