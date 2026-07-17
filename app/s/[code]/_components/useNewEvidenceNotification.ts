'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicEvidence, ExpTab } from './types';

export interface EvidenceToast {
  id: string;
  title: string;
  tab: ExpTab;
}

function tabForKind(kind: PublicEvidence['kind']): ExpTab {
  if (kind === 'audio') return 'audios';
  if (kind === 'video') return 'videos';
  return 'documentos';
}

/**
 * Detecta evidencia nueva y expone:
 *  - `badges`: contador de novedades por tab (para el punto rojo)
 *  - `toasts`: avisos breves "Nueva evidencia: …"
 *  - `acknowledge(tab)`: limpia el badge de un tab al abrirlo
 */
export function useNewEvidenceNotification(evidence: PublicEvidence[], activeTab: ExpTab) {
  const [badges, setBadges] = useState<Record<string, number>>({ documentos: 0, audios: 0, videos: 0 });
  const [toasts, setToasts] = useState<EvidenceToast[]>([]);
  const prevCodes = useRef<Set<string> | null>(null);
  const activeRef = useRef(activeTab);
  activeRef.current = activeTab;

  useEffect(() => {
    const codes = new Set(evidence.map((e) => e.code));
    if (prevCodes.current === null) {
      prevCodes.current = codes; // primera carga: no notificar
      return;
    }
    const added = evidence.filter((e) => !prevCodes.current!.has(e.code));
    prevCodes.current = codes;
    if (added.length === 0) return;

    setBadges((b) => {
      const next = { ...b };
      for (const e of added) {
        const tab = tabForKind(e.kind);
        if (tab !== activeRef.current) next[tab] = (next[tab] ?? 0) + 1;
      }
      return next;
    });
    setToasts((t) => [
      ...t,
      ...added.map((e) => ({ id: `${e.code}-${Date.now()}`, title: e.title, tab: tabForKind(e.kind) })),
    ]);
  }, [evidence]);

  // Auto-descartar toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => setToasts((t) => t.slice(1)), 4500);
    return () => clearTimeout(id);
  }, [toasts]);

  function acknowledge(tab: ExpTab) {
    setBadges((b) => (b[tab] ? { ...b, [tab]: 0 } : b));
  }
  function dismissToast(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  return { badges, toasts, acknowledge, dismissToast };
}
