// ============================================================================
// STORAGE — URLs firmadas para media de evidencia (SOLO servidor).
// El bucket es privado; solo se firman URLs para media de la sesión.
// ============================================================================

import { createServiceClient } from './supabase';

const BUCKET = 'evidence';
const TTL_SECONDS = 2 * 60 * 60; // 2 h

/** Devuelve una URL firmada, o null si no hay path o falla. */
export async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}
