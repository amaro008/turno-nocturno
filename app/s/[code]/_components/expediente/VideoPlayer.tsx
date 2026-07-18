'use client';

import type { PublicEvidence } from '../types';

export default function VideoPlayer({ item }: { item: PublicEvidence }) {
  return (
    <div className="video-card">
      <div className="audio-head">
        <span className="pill-kind video">VIDEO</span>
        <b>{item.title}</b>
      </div>

      {item.mediaUrl ? (
        <video
          className="video-el"
          src={item.mediaUrl}
          controls
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          playsInline
        />
      ) : (
        <div className="video-placeholder">
          <div className="mono" style={{ color: 'var(--ink-3)' }}>Video no disponible aún.</div>
        </div>
      )}

      {(item.transcript || item.body_md) && (
        <div className="audio-transcript">
          <span className="sf-label">Contexto</span>
          <p>{item.transcript || item.body_md}</p>
        </div>
      )}
    </div>
  );
}
