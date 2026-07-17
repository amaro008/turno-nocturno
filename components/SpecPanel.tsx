'use client';

import { useState } from 'react';
import { copyDimsString, type ImageSpec } from '@/lib/domain/image-specs';

export function formatMaxSize(mb: number): string {
  return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb} MB`;
}

/** Panel de especificaciones mostrado arriba del dropzone / preview. */
export default function SpecPanel({ spec }: { spec: ImageSpec }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="spec-panel">
      <div className="spec-row">
        <span className="spec-chip mono">{spec.width} × {spec.height} px</span>
        <span className="spec-chip amber mono">Proporción {spec.aspectRatio}</span>
        <span className="spec-chip mono">Máx {formatMaxSize(spec.maxSizeMB)}</span>
        <span className="spec-chip mono">{spec.formats.map((f) => f.toUpperCase()).join(' · ')}</span>
        {spec.durationSeconds && (
          <span className="spec-chip mono">{spec.durationSeconds[0]}–{spec.durationSeconds[1]} s</span>
        )}
        <button
          type="button"
          className="spec-copy mono"
          onClick={() => {
            navigator.clipboard?.writeText(copyDimsString(spec)).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? '¡copiado!' : 'Copiar dimensiones para IA'}
        </button>
      </div>
      {spec.usage && <div className="spec-usage">{spec.usage}</div>}
      {spec.notes && <div className="spec-notes">Notas: {spec.notes}</div>}
    </div>
  );
}
