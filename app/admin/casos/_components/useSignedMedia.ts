'use client';

import { useEffect, useState } from 'react';

// Cache de URLs firmadas por path (viven ~2h; el editor es efímero). Evita
// pedir la misma firma dos veces al pintar la galería o reabrir el Sheet.
const cache = new Map<string, Promise<string | null>>();

async function signPath(path: string): Promise<string | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetch('/api/admin/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.url as string) ?? null)
      .catch(() => null);
    cache.set(path, p);
  }
  return p;
}

/** Devuelve una URL firmada de lectura para un path de media del bucket privado. */
export function useSignedMedia(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) { setUrl(null); return; }
    signPath(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  return url;
}
