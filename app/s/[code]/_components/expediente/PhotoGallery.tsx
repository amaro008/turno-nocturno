'use client';

import { useState } from 'react';
import type { PublicEvidence } from '../types';

/** Galería de fotografías con lightbox. */
export default function PhotoGallery({ photos }: { photos: PublicEvidence[] }) {
  const [open, setOpen] = useState<PublicEvidence | null>(null);
  return (
    <>
      <div className="photo-grid">
        {photos.map((p) => (
          <button className="photo-tile" key={p.id} onClick={() => setOpen(p)} onContextMenu={(e) => e.preventDefault()}>
            {p.mediaUrl
              ? <img src={p.mediaUrl} alt={p.title} draggable={false} />
              : <span className="mono photo-none">SIN IMAGEN</span>}
            <span className="photo-cap">{p.title}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="lightbox-back" onClick={() => setOpen(null)} onContextMenu={(e) => e.preventDefault()}>
          <div className="lightbox" onClick={(e) => e.stopPropagation()}>
            {open.mediaUrl && <img src={open.mediaUrl} alt={open.title} draggable={false} />}
            <div className="lightbox-meta">
              <b>{open.title}</b>
              {open.caption && <p>{open.caption}</p>}
              {!open.caption && open.public_description && <p>{open.public_description}</p>}
            </div>
            <button className="lightbox-x" onClick={() => setOpen(null)} aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
