'use client';

import type { EvidenceListItem } from '../types';

/** Placeholder discreto de evidencia aún bloqueada (no spoilea qué es). */
export default function LockedCard({ item, elapsedMin }: { item: EvidenceListItem; elapsedMin: number }) {
  const eta =
    item.unlocked_at_minute != null && item.unlocked_at_minute > elapsedMin
      ? `Llega alrededor del minuto ${item.unlocked_at_minute}`
      : 'Disponible más tarde en la investigación';
  return (
    <div className="locked-card" aria-hidden="true">
      <div className="locked-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <div className="locked-txt">
        <span className="locked-title mono">— — —</span>
        <span className="locked-eta">{eta}</span>
      </div>
    </div>
  );
}
