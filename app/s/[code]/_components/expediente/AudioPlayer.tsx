'use client';

import { useRef, useState } from 'react';
import type { PublicEvidence } from '../types';

function fmt(sec: number) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ item }: { item: PublicEvidence }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const bars = Array.from({ length: 40 }, (_, i) => 5 + Math.abs(Math.sin(i * 0.7)) * 16);
  const progress = dur > 0 ? cur / dur : 0;

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }
  function seek(delta: number) {
    const a = ref.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
  }

  return (
    <div className="audio-card">
      <div className="audio-head">
        <span className="pill-kind audio">AUDIO</span>
        <b>{item.title}</b>
      </div>

      {item.mediaUrl ? (
        <>
          <audio
            ref={ref}
            src={item.mediaUrl}
            preload="metadata"
            controlsList="nodownload noremoteplayback"
            onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onEnded={() => setPlaying(false)}
          />
          <div className="audio-controls">
            <button className="ac-btn" onClick={() => seek(-10)} aria-label="Atrás 10s">↺10</button>
            <button className="ac-play" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}>
              {playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button className="ac-btn" onClick={() => seek(10)} aria-label="Adelante 10s">10↻</button>
            <div className="audio-wave">
              {bars.map((h, i) => (
                <span key={i} className={i / bars.length <= progress ? 'on' : ''} style={{ height: `${h}px` }} />
              ))}
            </div>
            <span className="mono audio-time">{fmt(cur)} / {fmt(dur)}</span>
          </div>
        </>
      ) : (
        <div className="audio-noaudio mono">Audio no disponible aún — lee la transcripción.</div>
      )}

      {item.transcript && (
        <div className="audio-transcript">
          <span className="sf-label">Transcripción</span>
          <p>“{item.transcript}”</p>
        </div>
      )}
    </div>
  );
}
