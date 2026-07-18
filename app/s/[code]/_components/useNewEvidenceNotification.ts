'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicEvidence, ExpTab, EvType } from './types';

export interface EvidenceToast {
  id: string;
  title: string;
  tab: ExpTab;
}

/** Tab del expediente que corresponde a un tipo de evidencia. */
export function tabForType(type: EvType): ExpTab {
  switch (type) {
    case 'document': return 'documentos';
    case 'photo': return 'fotos';
    case 'audio': return 'audios';
    case 'video': return 'videos';
    case 'testimony': return 'testimonios';
    case 'record': return 'registros';
  }
}

/** Chime discreto vía WebAudio (sin assets). Respeta el mute. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close(), 500);
  } catch { /* sin audio */ }
}

/**
 * Detecta evidencia nueva (abierta) y expone badges por tab, toasts, chime y mute.
 */
export function useNewEvidenceNotification(evidence: PublicEvidence[], activeTab: ExpTab) {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<EvidenceToast[]>([]);
  const [muted, setMuted] = useState(false);
  const prevCodes = useRef<Set<string> | null>(null);
  const activeRef = useRef(activeTab);
  const mutedRef = useRef(muted);
  activeRef.current = activeTab;
  mutedRef.current = muted;

  useEffect(() => {
    const codes = new Set(evidence.map((e) => e.code));
    if (prevCodes.current === null) { prevCodes.current = codes; return; }
    const added = evidence.filter((e) => !prevCodes.current!.has(e.code));
    prevCodes.current = codes;
    if (added.length === 0) return;

    setBadges((b) => {
      const next = { ...b };
      for (const e of added) {
        const tab = tabForType(e.type);
        if (tab !== activeRef.current) next[tab] = (next[tab] ?? 0) + 1;
      }
      return next;
    });
    setToasts((t) => [...t, ...added.map((e) => ({ id: `${e.code}-${Date.now()}`, title: e.title, tab: tabForType(e.type) }))]);
    if (!mutedRef.current) playChime();
  }, [evidence]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => setToasts((t) => t.slice(1)), 4500);
    return () => clearTimeout(id);
  }, [toasts]);

  const acknowledge = useCallback((tab: ExpTab) => {
    setBadges((b) => (b[tab] ? { ...b, [tab]: 0 } : b));
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return { badges, toasts, acknowledge, dismissToast, muted, setMuted };
}
