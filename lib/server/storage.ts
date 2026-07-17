// ============================================================================
// STORAGE — Media de casos/evidencia (SOLO servidor). Bucket privado `media`.
// Estructura de rutas: casos/{caso_slug}/{tipo}/{filename}
// Subida directa desde el cliente vía URL firmada (no expone service key).
// ============================================================================

import { createServiceClient } from './supabase';

export const MEDIA_BUCKET = 'media';
const READ_TTL_SECONDS = 2 * 60 * 60; // 2 h

// Límites por tipo (deben coincidir con la validación de cliente)
export const UPLOAD_LIMITS = {
  image: { maxBytes: 5 * 1024 * 1024, mime: ['image/jpeg', 'image/png', 'image/webp'] },
  audio: { maxBytes: 20 * 1024 * 1024, mime: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'] },
  video: { maxBytes: 100 * 1024 * 1024, mime: ['video/mp4', 'video/webm', 'video/quicktime'] },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

/** URL firmada de lectura, o null si no hay path o falla. TTL configurable. */
export async function signedUrl(path: string | null, ttlSeconds = READ_TTL_SECONDS): Promise<string | null> {
  if (!path) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** TTL corto para media servida dentro de una sesión activa (anti-descarga). */
export const SESSION_MEDIA_TTL = 10 * 60;

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
