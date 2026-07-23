'use client';

import { useState } from 'react';
import { InitialsCover } from '@/components/Initials';

function caseNumber(slug: string) {
  return slug.split('-')[0] ?? '00';
}

/**
 * Portada de un caso con degradación elegante. Si no hay URL —o la imagen falla
 * al cargar (URL firmada caducada, hipo de red, caché roto)— cae a la portada de
 * iniciales en lugar de mostrar el ícono de imagen rota. Reutilizable en landing
 * y catálogo.
 */
export default function CaseCoverImg({
  url,
  alt,
  slug,
  city,
  era,
  draggable,
}: {
  url: string | null;
  alt: string;
  slug: string;
  city: string;
  era: number;
  draggable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <InitialsCover seed={slug} label={caseNumber(slug)} sub={`${city} · ${era}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} draggable={draggable} onError={() => setFailed(true)} />;
}
