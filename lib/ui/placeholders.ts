// Placeholders de imagen mientras no haya arte propio (picsum, en gris).

export function picsumUrl(seed: string, w = 1600, h = 900, grayscale = true): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}${grayscale ? '?grayscale' : ''}`;
}

/**
 * Placeholder temático. Unsplash cerró su Source API (source.unsplash.com) en
 * 2024, así que ese host ya no sirve imágenes. Mantenemos la firma para no
 * tocar los llamadores, pero devolvemos un picsum estable sembrado con la
 * consulta. Sólo se usa cuando un caso aún no tiene arte propio.
 */
export function unsplashUrl(query: string, w = 1600, h = 900): string {
  return picsumUrl(`u-${query}`, w, h, true);
}
