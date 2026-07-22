'use client';

import { useState } from 'react';
import type { PublicEvidence } from '../types';

/**
 * Visor de "video" de evidencia: en realidad una secuencia de fotogramas
 * (fotos fijas con hora), recorrida paso a paso como si se repasara el
 * material de una cámara. Evita depender de generar video real con IA.
 */
export default function VideoPlayer({ item }: { item: PublicEvidence }) {
  const frames = item.frames ?? [];
  const [idx, setIdx] = useState(0);
  const frame = frames[idx] ?? null;

  return (
    <div className="video-card">
      <div className="audio-head">
        <span className="pill-kind video">VIDEO</span>
        <b>{item.title}</b>
      </div>

      {frames.length === 0 ? (
        <div className="video-placeholder">
          <div className="mono" style={{ color: 'var(--ink-3)' }}>Sin fotogramas disponibles aún.</div>
        </div>
      ) : (
        <div className="frame-viewer" onContextMenu={(e) => e.preventDefault()}>
          <div className="frame-stage">
            {frame?.mediaUrl ? (
              <img src={frame.mediaUrl} alt={`Fotograma ${frame.time}`} draggable={false} />
            ) : (
              <div className="frame-missing mono">Fotograma no disponible aún.</div>
            )}
            {frame?.time && <span className="frame-timestamp mono">{frame.time}</span>}
          </div>

          <div className="frame-controls">
            <button
              className="ac-btn"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              aria-label="Fotograma anterior"
            >
              ‹
            </button>
            <span className="mono frame-count">{idx + 1} / {frames.length}</span>
            <button
              className="ac-btn"
              onClick={() => setIdx((i) => Math.min(frames.length - 1, i + 1))}
              disabled={idx === frames.length - 1}
              aria-label="Fotograma siguiente"
            >
              ›
            </button>
          </div>

          {frame?.caption && <p className="frame-caption">{frame.caption}</p>}
        </div>
      )}

      {item.transcript && (
        <div className="audio-transcript">
          <span className="sf-label">Contexto</span>
          <p>{item.transcript}</p>
        </div>
      )}
    </div>
  );
}
