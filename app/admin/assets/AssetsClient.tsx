'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sectionForSlot, ASSET_SECTIONS } from '@/lib/domain/site-assets';
import { getSpec, aspectRatioValue } from '@/lib/domain/image-specs';
import SpecPanel, { formatMaxSize } from '@/components/SpecPanel';
import { loadImageMeta, cropToAspect, compressImage } from '@/lib/ui/image-client';

interface Asset {
  slot: string;
  title: string;
  description: string;
  alt_text: string;
  url: string | null;
}

const MAX = 5 * 1024 * 1024;

export default function AssetsClient({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [changing, setChanging] = useState<Asset | null>(null);
  const [editingAlt, setEditingAlt] = useState<Asset | null>(null);

  const sections = ['all', ...ASSET_SECTIONS.filter((s) => assets.some((a) => sectionForSlot(a.slot) === s))];
  const shown = assets.filter((a) => filter === 'all' || sectionForSlot(a.slot) === filter);

  return (
    <>
      <div className="filters" style={{ marginBottom: 18 }}>
        {sections.map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)} style={{ cursor: 'pointer', background: 'none' }}>
            {s === 'all' ? 'Todas' : s}
          </button>
        ))}
      </div>

      <div className="assets-grid">
        {shown.map((a) => (
          <div className="asset-card" key={a.slot}>
            <div className="asset-preview">
              {a.url ? <img src={a.url} alt={a.alt_text} /> : <div className="asset-empty mono">sin imagen</div>}
              <span className="asset-section mono">{sectionForSlot(a.slot)}</span>
            </div>
            <div className="asset-body">
              <b>{a.title}</b>
              <span className="asset-slot mono">{a.slot}</span>
              {getSpec(a.slot) && (
                <span className="asset-dims mono">
                  {getSpec(a.slot)!.width}×{getSpec(a.slot)!.height} · {getSpec(a.slot)!.aspectRatio}
                </span>
              )}
              <p className="asset-desc">{a.description}</p>
              <div className="asset-actions">
                <button className="btn ghost" style={{ padding: '6px 11px', fontSize: 12.5 }} onClick={() => setChanging(a)}>
                  Cambiar imagen
                </button>
                <button className="btn ghost" style={{ padding: '6px 11px', fontSize: 12.5 }} onClick={() => setEditingAlt(a)}>
                  Editar alt
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {changing && (
        <ChangeImageModal asset={changing} onClose={() => setChanging(null)} onSaved={() => { setChanging(null); router.refresh(); }} />
      )}
      {editingAlt && (
        <EditAltModal asset={editingAlt} onClose={() => setEditingAlt(null)} onSaved={() => { setEditingAlt(null); router.refresh(); }} />
      )}
    </>
  );
}

function ChangeImageModal({ asset, onClose, onSaved }: { asset: Asset; onClose: () => void; onSaved: () => void }) {
  const spec = getSpec(asset.slot);
  const maxBytes = spec ? spec.maxSizeMB * 1024 * 1024 : MAX;
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [warn, setWarn] = useState<{ tooSmall: boolean; aspectOff: boolean; oversize: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(f: File) {
    setError(null);
    setWarn(null);
    if (!f.type.startsWith('image/')) { setError('Debe ser una imagen'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (spec) {
      try {
        const meta = await loadImageMeta(f);
        const target = aspectRatioValue(spec.aspectRatio);
        const srcRatio = meta.width / meta.height;
        setWarn({
          tooSmall: meta.width < spec.minWidth,
          aspectOff: Math.abs(srcRatio - target) / target > 0.05,
          oversize: f.size > maxBytes,
        });
      } catch {
        /* si no se puede leer, se sube tal cual */
      }
    } else if (f.size > maxBytes) {
      setError(`Máximo ${formatMaxSize(maxBytes / 1024 / 1024)}`);
    }
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let f = file;
    // Procesamiento cliente según spec (recorte al aspecto + compresión).
    if (spec && warn) {
      try {
        if (warn.aspectOff) f = await cropToAspect(f, spec);
        if (f.size > maxBytes) f = await compressImage(f, spec);
      } catch {
        /* si el procesamiento falla, sube el original */
      }
    }
    try {
      const res = await fetch('/api/admin/assets/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: asset.slot, filename: f.name, size: f.size, mime: f.type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error === 'too_large' ? 'Archivo muy grande' : 'No se pudo iniciar la subida'); setBusy(false); return; }

      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from(data.bucket).uploadToSignedUrl(data.path, data.token, f, { contentType: f.type });
      if (upErr) { setError('Error al subir'); setBusy(false); return; }

      const patch = await fetch(`/api/admin/assets/${asset.slot}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_path: data.path }),
      });
      if (!patch.ok) { setError('No se pudo guardar'); setBusy(false); return; }
      onSaved();
    } catch {
      setError('Error de red');
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <span className="kicker">Cambiar imagen</span>
        <h2 style={{ margin: '6px 0 2px' }}>{asset.title}</h2>
        <p className="msub">{asset.description}</p>

        {spec && <SpecPanel spec={spec} />}

        <div className="ba-grid">
          <div>
            <div className="ba-label mono">Antes</div>
            <div className="ba-frame">{asset.url ? <img src={asset.url} alt="" /> : <div className="asset-empty mono">sin imagen</div>}</div>
          </div>
          <div>
            <div className="ba-label mono">Después</div>
            <div
              className={'ba-frame drop' + (drag ? ' drag' : '')}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
            >
              {preview ? <img src={preview} alt="" /> : <span className="mono" style={{ color: 'var(--ink-3)' }}>Arrastra o haz clic</span>}
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
            </div>
          </div>
        </div>

        {spec && warn?.tooSmall && (
          <div className="up-warn">⚠ Imagen más chica que lo recomendado ({spec.width}×{spec.height}); puede verse borrosa.</div>
        )}
        {spec && warn?.aspectOff && (
          <div className="up-warn">⚠ La proporción difiere de {spec.aspectRatio}; se recortará automáticamente al centro al guardar.</div>
        )}
        {spec && warn?.oversize && (
          <div className="up-warn">⚠ Pesa más de {formatMaxSize(spec.maxSizeMB)}; se comprimirá automáticamente al guardar.</div>
        )}
        {error && <div className="note-error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="vactions" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn primary" onClick={save} disabled={busy || !file}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

function EditAltModal({ asset, onClose, onSaved }: { asset: Asset; onClose: () => void; onSaved: () => void }) {
  const [alt, setAlt] = useState(asset.alt_text);
  const [busy, setBusy] = useState(false);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <span className="kicker">Texto alternativo</span>
        <h2 style={{ margin: '6px 0 2px' }}>{asset.title}</h2>
        <p className="msub">Describe la imagen para accesibilidad y SEO.</p>
        <textarea className="input" value={alt} onChange={(e) => setAlt(e.target.value)} rows={3} />
        <div className="vactions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch(`/api/admin/assets/${asset.slot}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alt_text: alt }),
              });
              onSaved();
            }}
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
