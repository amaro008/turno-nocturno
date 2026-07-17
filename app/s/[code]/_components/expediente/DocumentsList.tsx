'use client';

import { useState } from 'react';
import type { PublicEvidence } from '../types';
import { Markdown } from '../markdown';
import EmptyState from '@/components/EmptyState';

export default function DocumentsList({ docs, sessionCode }: { docs: PublicEvidence[]; sessionCode: string }) {
  const [open, setOpen] = useState<PublicEvidence | null>(null);

  if (docs.length === 0) {
    return (
      <EmptyState
        ill="folder"
        title="Sin documentos todavía"
        message="Cuando el Comandante entregue documentos aparecerán aquí. Pídeselos en el chat."
      />
    );
  }

  return (
    <>
      <div className="doc-list">
        {docs.map((d) => (
          <button className="doc-row" key={d.id} onClick={() => setOpen(d)}>
            <span className="doc-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
            </span>
            <span className="doc-row-txt">
              <b>{d.title}</b>
              <span className="doc-row-code mono">{d.code}</span>
            </span>
            <span className="doc-open-hint">Abrir ›</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="modal-back" onClick={() => setOpen(null)}>
          <div className="modal doc-viewer no-select" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
            <div className="doc-viewer-head">
              <div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--amber)', letterSpacing: '0.1em' }}>{open.code}</div>
                <h2 style={{ margin: '4px 0 0' }}>{open.title}</h2>
              </div>
              <button className="btn ghost" onClick={() => setOpen(null)}>Cerrar</button>
            </div>

            <div className="doc-paper">
              {open.mediaUrl && (
                <img className="doc-image" src={open.mediaUrl} alt={open.title} draggable={false} />
              )}
              {open.body_md && (
                <div className="doc-md">
                  <Markdown source={open.body_md} />
                </div>
              )}
              {open.transcript && (
                <div className="doc-md" style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>
                  <Markdown source={open.transcript} />
                </div>
              )}
              <div className="doc-watermark mono">
                Turno Nocturno · sesión {sessionCode} · {new Date().toLocaleDateString('es-MX')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
