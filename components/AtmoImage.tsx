'use client';

import { useState } from 'react';

/**
 * <img> con cadena de respaldo: si la fuente primaria falla (p. ej. Unsplash
 * caído), cae al respaldo garantizado. Evita imágenes rotas en la landing.
 */
export default function AtmoImage({
  primary,
  fallback,
  alt,
  className,
  style,
}: {
  primary: string;
  fallback: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState(primary);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
