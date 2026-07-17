'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Kind = 'image' | 'audio' | 'video';

const ACCEPT: Record<Kind, string> = {
  image: 'image/jpeg,image/png,image/webp',
  audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg',
  video: 'video/mp4,video/webm,video/quicktime',
};
const MAX: Record<Kind, number> = {
  image: 5 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

export default function MediaUploader({
  caseSlug,
  kind,
  category,
  value,
  onUploaded,
  label,
}: {
  caseSlug: string;
  kind: Kind;
  category: string;
  value: string | null;
  onUploaded: (path: string | null) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > MAX[kind]) {
        setError(`Máximo ${(MAX[kind] / 1024 / 1024).toFixed(0)} MB`);
        return;
      }
      setBusy(true);
      setProgress(5);
      try {
        // 1) Pedir URL firmada al servidor
        const res = await fetch('/api/admin/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseSlug, kind, category, filename: file.name, size: file.size, mime: file.type }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error === 'too_large' ? 'Archivo muy grande' : 'No se pudo iniciar la subida');
          setBusy(false);
          return;
        }
        setProgress(35);

        // 2) Subir directo a Storage con el token firmado (sin service key)
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from(data.bucket)
          .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
        if (upErr) {
          setError('Error al subir el archivo');
          setBusy(false);
          return;
        }
        setProgress(100);
        onUploaded(data.path);
      } catch {
        setError('Error de red al subir');
      } finally {
        setBusy(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [caseSlug, kind, category, onUploaded],
  );

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div
        className={'uploader' + (drag ? ' drag' : '') + (value ? ' has' : '')}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {busy ? (
          <div className="up-progress">
            <div className="up-bar" style={{ width: `${progress}%` }} />
            <span className="mono">Subiendo… {progress}%</span>
          </div>
        ) : value ? (
          <div className="up-has">
            <span className="up-check">✓</span>
            <span className="up-path mono">{value.split('/').pop()}</span>
            <button
              type="button"
              className="up-remove"
              onClick={(e) => {
                e.stopPropagation();
                onUploaded(null);
              }}
            >
              Quitar
            </button>
          </div>
        ) : (
          <div className="up-empty">
            <span className="up-icon">⤒</span>
            <span>
              Arrastra tu {kind === 'image' ? 'imagen' : kind === 'audio' ? 'audio' : 'video'} o haz clic
            </span>
            <span className="mono up-hint">máx {(MAX[kind] / 1024 / 1024).toFixed(0)} MB</span>
          </div>
        )}
      </div>
      {error && <div className="note-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
