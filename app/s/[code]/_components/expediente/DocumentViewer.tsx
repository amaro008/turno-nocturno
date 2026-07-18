'use client';

import { useState } from 'react';
import type { PublicEvidence } from '../types';
import { Markdown } from '../markdown';

/** Lista de documentos/registros → visor con markdown + imagen escaneada. */
export default function DocumentViewer({ docs, sessionCode }: { docs: PublicEvidence[]; sessionCode: string }) {
  const [open, setOpen] = useState<PublicEvidence | null>(null);

  return (
    <>
      <div className="doc-list">
        {docs.map((d) => (
          <button className="doc-row" key={d.id} onClick={() => setOpen(d)}>
            <span className="doc-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
              </svg>
            </span>
            <span className="doc-row-txt">
              <b>{d.title}</b>
              {d.record_type && <span className="doc-row-kind">{d.record_type}</span>}
              <span className="doc-row-desc">{d.public_description}</span>
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
                <h2 style={{ margin: 0 }}>{open.title}</h2>
              </div>
              <button className="btn ghost" onClick={() => setOpen(null)}>Cerrar</button>
            </div>
            <div className="doc-paper">
              {open.mediaUrl && <img className="doc-image" src={open.mediaUrl} alt={open.title} draggable={false} />}
              {open.body_md && <div className="doc-md"><Markdown source={open.body_md} /></div>}
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
