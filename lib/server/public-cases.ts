// ============================================================================
// Casos para las páginas públicas (catálogo, detalle, home). SOLO servidor.
// Firma las imágenes del bucket privado y NO expone datos sensibles
// (culpable, evidencia, variantes).
// ============================================================================

import { createServiceClient } from './supabase';
import { signedUrl } from './storage';
import type { Case, CaseDifficulty } from '@/lib/domain';

export interface PublicCase {
  slug: string;
  title: string;
  city: string;
  era_year: number;
  era_profile: string;
  time_limit_min: number;
  difficulty: CaseDifficulty;
  players_min: number;
  players_max: number;
  price_ref_mxn: number | null;
  marketing_synopsis: string | null;
  synopsis: string;
  coverUrl: string | null;
  atmosphereUrl: string | null;
}

async function toPublic(c: Case): Promise<PublicCase> {
  const [coverUrl, atmosphereUrl] = await Promise.all([
    signedUrl(c.cover_image_path),
    signedUrl(c.atmosphere_image_path),
  ]);
  return {
    slug: c.slug,
    title: c.title,
    city: c.city,
    era_year: c.era_year,
    era_profile: c.era_profile,
    time_limit_min: c.time_limit_min,
    difficulty: c.difficulty,
    players_min: c.players_min,
    players_max: c.players_max,
    price_ref_mxn: c.price_ref_mxn,
    marketing_synopsis: c.marketing_synopsis,
    synopsis: c.synopsis,
    coverUrl,
    atmosphereUrl,
  };
}

/** Todos los casos activos (catálogo público). */
export async function getActiveCases(): Promise<PublicCase[]> {
  const svc = createServiceClient();
  const { data } = await svc.from('cases').select('*').eq('active', true).order('slug', { ascending: true });
  return Promise.all(((data ?? []) as Case[]).map(toPublic));
}

/** Un caso activo por slug, o null. */
export async function getPublicCase(slug: string): Promise<PublicCase | null> {
  const svc = createServiceClient();
  const { data } = await svc.from('cases').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (!data) return null;
  return toPublic(data as Case);
}
