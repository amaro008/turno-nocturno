// Placeholders de imagen mientras no haya arte propio.
// Primario: Unsplash (búsqueda temática). Respaldo garantizado: picsum en gris.

export function unsplashUrl(query: string, w = 1600, h = 900): string {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}`;
}

export function picsumUrl(seed: string, w = 1600, h = 900, grayscale = true): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}${grayscale ? '?grayscale' : ''}`;
}
