// ============================================================================
// STORAGE — Media de casos/evidencia (SOLO servidor). Bucket privado `media`.
// Estructura de rutas: casos/{caso_slug}/{tipo}/{filename}
// Subida directa desde el cliente vía URL firmada (no expone service key).
// ============================================================================

import { createServiceClient } from './supabase';

export const MEDIA_BUCKET = 'media';
const READ_TTL_SECONDS = 2 * 60 * 60; // 2 h

// Caché de URLs firmadas por (ruta, ttl). Devuelve la MISMA URL en llamadas
// repetidas dentro de su ventana de validez para que /state no regenere un
// token nuevo en cada refetch (cada pregunta al Comandante dispara un refetch).
// Con la URL idéntica, React no cambia el `src` y el navegador NO re-descarga
// la imagen — se acaba el parpadeo/recarga durante la partida. Se re-firma
// cuando quedan menos de REFRESH_BEFORE_MS de validez.
const REFRESH_BEFORE_MS = 60 * 1000;
const signedCache = new Map<string, { url: string; expiresAt: number }>();

function pruneExpired(now: number) {
  if (signedCache.size < 500) return;
  for (const [k, v] of signedCache) if (v.expiresAt <= now) signedCache.delete(k);
}

// Límites por tipo (deben coincidir con la validación de cliente)
export const UPLOAD_LIMITS = {
  image: { maxBytes: 5 * 1024 * 1024, mime: ['image/jpeg', 'image/png', 'image/webp'] },
  audio: { maxBytes: 20 * 1024 * 1024, mime: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'] },
  video: { maxBytes: 100 * 1024 * 1024, mime: ['video/mp4', 'video/webm', 'video/quicktime'] },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

/** URL firmada de lectura, o null si no hay path o falla. TTL configurable.
 *  Reutiliza la URL cacheada mientras siga válida (ver `signedCache`). */
export async function signedUrl(path: string | null, ttlSeconds = READ_TTL_SECONDS): Promise<string | null> {
  if (!path) return null;
  const now = Date.now();
  const key = `${path}::${ttlSeconds}`;
  const hit = signedCache.get(key);
  if (hit && hit.expiresAt - now > REFRESH_BEFORE_MS) return hit.url;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  pruneExpired(now);
  signedCache.set(key, { url: data.signedUrl, expiresAt: now + ttlSeconds * 1000 });
  return data.signedUrl;
}

/**
 * URL ESTABLE para imágenes públicas (portadas, hero, retratos de sospechosos,
 * assets del sitio). Apunta a nuestra ruta proxy `/api/img/...`, que lee del
 * bucket privado en el servidor y responde con caché de CDN. A diferencia de las
 * URLs firmadas, NO caduca — así se acaban los fallos intermitentes en marketing.
 * NO usar para evidencia del juego (esa se sirve firmada, anti-descarga).
 */
export function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  return '/api/img/' + path.split('/').map(encodeURIComponent).join('/');
}

/** TTL para media servida dentro de una sesión activa. Es un enlace temporal
 *  (anti-descarga) pero lo bastante largo para que la URL no rote a media
 *  partida y el navegador conserve la imagen en caché durante el juego. */
export const SESSION_MEDIA_TTL = 30 * 60;

/** Sanitiza un nombre de archivo para usarlo como parte de una ruta de storage. */
export function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  const ext = (dot >= 0 ? name.slice(dot + 1) : '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const stamp = Date.now().toString(36);
  return `${base || 'archivo'}-${stamp}${ext ? '.' + ext : ''}`;
}

/**
 * Crea una URL firmada de subida directa a Storage. El cliente sube el archivo
 * con esa URL (o con el token vía uploadToSignedUrl), sin tocar la service key.
 */
export async function createUploadUrl(
  path: string,
): Promise<{ path: string; token: string } | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return null;
  return { path: data.path, token: data.token };
}
