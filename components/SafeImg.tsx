'use client';

import { useState } from 'react';

/**
 * <img> que muestra la imagen real o NADA (se oculta) si no hay src o falla al
 * cargar. Sin íconos de imagen rota y sin recurrir a fotos de stock genéricas.
 * Pensado para heros/portadas donde debajo hay un fondo de marca (degradado).
 */
export default function SafeImg({
  src,
  alt,
  className,
  draggable,
}: {
  src: string | null;
  alt: string;
  className?: string;
  draggable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} draggable={draggable} onError={() => setFailed(true)} />;
}
