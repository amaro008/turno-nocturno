// ============================================================================
// Resolución de assets del sitio (SOLO servidor). Cacheado por request con
// React cache para no consultar la BD por cada <SiteAsset> de la misma página.
// ============================================================================

import { cache } from 'react';
import { createServiceClient } from './supabase';
import { signedUrl } from './storage';
import type { SiteAssetRow } from '@/lib/domain/site-assets';

const ASSET_TTL = 60 * 60; // 1 h

/** Carga todos los assets una sola vez por request (cache de RSC). */
const loadAllAssets = cache(async (): Promise<Map<string, SiteAssetRow>> => {
  const svc = createServiceClient();
  const { data } = await svc.from('site_assets').select('slot, title, description, image_path, alt_text, updated_at');
  const map = new Map<string, SiteAssetRow>();
  for (const row of (data ?? []) as SiteAssetRow[]) map.set(row.slot, row);
  return map;
});

export interface ResolvedAsset {
  url: string | null;
  alt: string;
}

/** Resuelve un slot a { url firmada | null, alt }. */
export async function resolveAsset(slot: string): Promise<ResolvedAsset> {
  const all = await loadAllAssets();
  const row = all.get(slot);
  if (!row) return { url: null, alt: '' };
  const url = await signedUrl(row.image_path, ASSET_TTL);
  return { url, alt: row.alt_text };
}

/** Listado completo para el admin (con URLs firmadas). */
export async function listAssetsForAdmin(): Promise<(SiteAssetRow & { url: string | null })[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('site_assets')
    .select('slot, title, description, image_path, alt_text, updated_at')
    .order('slot', { ascending: true });
  return Promise.all(
    ((data ?? []) as SiteAssetRow[]).map(async (row) => ({ ...row, url: await signedUrl(row.image_path, ASSET_TTL) })),
  );
}
