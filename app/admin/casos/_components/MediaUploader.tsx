'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ImageSpec } from '@/lib/domain/image-specs';
import { aspectRatioValue } from '@/lib/domain/image-specs';
import SpecPanel, { formatMaxSize } from '@/components/SpecPanel';
import { loadImageMeta, cropToAspect, compressImage } from '@/lib/ui/image-client';

type Kind = 'image' | 'audio' | 'video';

const ACCEPT: Record<Kind, string> = {
  image: 'image/jpeg,image/png,image/webp',
  audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg',
  video: 'video/mp4,video/webm,video/quicktime',
};
const FALLBACK_MAX: Record<Kind, number> = {
  image: 5 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

interface Pending {
  file: File;
  url: string;
  width: number;
  height: number;
  tooSmall: boolean;
  aspectOff: boolean;
  oversize: boolean;
}

export default function MediaUploader({
  caseSlug,
  kind,
  category,
  value,
  onUploaded,
  label,
  spec,
}: {
  caseSlug: string;
  kind: Kind;
  category: string;
  value: string | null;
  onUploaded: (path: string | null) => void;
  label?: string;
  spec?: ImageSpec;
}) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxBytes = spec ? spec.maxSizeMB * 1024 * 1024 : FALLBACK_MAX[kind];

  const doUpload = useCallback(
    async (file: File) => {
      setBusy(true);
      setStage('Subiendo…');
      try {
        const res = await fetch('/api/admin/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseSlug, kind, category, filename: file.name, size: file.size, mime: file.type }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error === 'too_large' ? 'Archivo muy grande' : 'No se pudo iniciar la subida');
          return;
        }
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from(data.bucket)
          .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
        if (upErr) {
          setError('Error al subir el archivo');
          return;
        }
        onUploaded(data.path);
        setPending(null);
      } catch {
        setError('Error de red al subir');
      } finally {
        setBusy(false);
        setStage('');
      }
    },
    [caseSlug, kind, category, onUploaded],
  );

  const pick = useCallback(
    async (file: File) => {
      setError(null);
      // Sin spec o no-imagen: comportamiento directo con validación básica de peso.
      if (kind !== 'image' || !spec) {
        if (file.size > maxBytes) {
          setError(`Máximo ${formatMaxSize(maxBytes / 1024 / 1024)}`);
          return;
        }
        doUpload(file);
        return;
      }
      // Imagen con spec: validar y poner en revisión.
      try {
        const meta = await loadImageMeta(file);
        const target = aspectRatioValue(spec.aspectRatio);
        const srcRatio = meta.width / meta.height;
        setPending({
          file,
          url: meta.url,
          width: meta.width,
          height: meta.height,
          tooSmall: meta.width < spec.minWidth,
          aspectOff: Math.abs(srcRatio - target) / target > 0.05,
          oversize: file.size > maxBytes,
        });
      } catch {
        setError('No se pudo leer la imagen');
      }
    },
    [kind, spec, maxBytes, doUpload],
  );

  async function confirmUpload(crop: boolean) {
    if (!pending || !spec) return;
    setBusy(true);
    let f = pending.file;
    try {
      if (crop) {
        setStage('Recortando…');
        f = await cropToAspect(f, spec);
      }
      if (f.size > maxBytes) {
        setStage('Comprimiendo…');
        f = await compressImage(f, spec);
      }
    } catch {
      /* si falla el procesamiento, sube el original */
    }
    await doUpload(f);
  }

  const targetStyle = spec
    ? { aspectRatio: spec.aspectRatio.replace(':', ' / '), objectFit: spec.cropBehavior === 'contain' ? ('contain' as const) : ('cover' as const) }
    : undefined;

  return (
    <div>
      {label && <label className="label">{label}</label>}
      {spec && <SpecPanel spec={spec} />}

      {/* Revisión de imagen con spec */}
      {pending ? (
        <div className="up-review">
          <div className="up-review-previews">
            <div className="up-prev-box">
              <span className="up-prev-title mono">Cómo se verá en el sitio</span>
              <div className="up-prev-frame" style={targetStyle ? { aspectRatio: (targetStyle as { aspectRatio: string }).aspectRatio } : undefined}>
                <img src={pending.url} alt="" style={{ objectFit: (targetStyle?.objectFit as 'cover' | 'contain') ?? 'cover' }} />
              </div>
            </div>
            <div className="up-prev-box">
              <span className="up-prev-title mono">Imagen subida ({pending.width}×{pending.height})</span>
              <div className="up-prev-frame real">
                <img src={pending.url} alt="" style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          {pending.tooSmall && (
            <div className="up-warn">⚠ Imagen más chica que lo recomendado ({spec!.width}×{spec!.height}); puede verse borrosa.</div>
          )}
          {pending.aspectOff && (
            <div className="up-warn">⚠ La proporción difiere de {spec!.aspectRatio}. Recórtala automáticamente o súbela tal cual.</div>
          )}
          {pending.oversize && (
            <div className="up-warn">⚠ Pesa más de {formatMaxSize(spec!.maxSizeMB)}; se comprimirá automáticamente al subir.</div>
          )}

          <div className="row-actions" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            {pending.aspectOff ? (
              <>
                <button className="btn primary" disabled={busy} onClick={() => confirmUpload(true)}>{busy ? stage || 'Procesando…' : 'Recortar y subir'}</button>
                <button className="btn ghost" disabled={busy} onClick={() => confirmUpload(false)}>Subir así</button>
              </>
            ) : (
              <button className="btn primary" disabled={busy} onClick={() => confirmUpload(false)}>{busy ? stage || 'Procesando…' : 'Subir'}</button>
            )}
            <button className="btn ghost" disabled={busy} onClick={() => { URL.revokeObjectURL(pending.url); setPending(null); }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div
          className={'uploader' + (drag ? ' drag' : '') + (value ? ' has' : '')}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input ref={inputRef} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
          {busy ? (
            <div className="up-progress"><div className="up-bar" style={{ width: '70%' }} /><span className="mono">{stage || 'Subiendo…'}</span></div>
          ) : value ? (
            <div className="up-has">
              <span className="up-check">✓</span>
              <span className="up-path mono">{value.split('/').pop()}</span>
              <button type="button" className="up-remove" onClick={(e) => { e.stopPropagation(); onUploaded(null); }}>Quitar</button>
            </div>
          ) : (
            <div className="up-empty">
              <span className="up-icon">⤒</span>
              <span>Arrastra tu {kind === 'image' ? 'imagen' : kind === 'audio' ? 'audio' : 'video'} o haz clic</span>
              <span className="mono up-hint">máx {formatMaxSize(maxBytes / 1024 / 1024)}{spec ? ` · ${spec.width}×${spec.height}` : ''}</span>
            </div>
          )}
        </div>
      )}
      {error && <div className="note-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
