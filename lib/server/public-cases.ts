// ============================================================================
// Casos para las páginas públicas (catálogo, detalle, home). SOLO servidor.
// Firma las imágenes del bucket privado y NO expone datos sensibles
// (culpable, evidencia, variantes).
// ============================================================================

import { createServiceClient } from './supabase';
import { publicImageUrl } from './storage';
import { SUSPECT_PUBLIC_COLUMNS, type SuspectPublic, type Case, type CaseDifficulty } from '@/lib/domain';

export interface PublicCase {
  id: string;
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

/** Sospechoso para el escaparate público: sólo ficha neutra + foto firmada. */
export interface PublicSuspect {
  id: string;
  full_name: string;
  age: number | null;
  occupation: string | null;
  relationship_to_victim: string | null;
  photoUrl: string | null;
}

async function toPublic(c: Case): Promise<PublicCase> {
  // URLs públicas estables (sin firmar): marketing no debe caducar.
  const coverUrl = publicImageUrl(c.cover_image_path);
  const atmosphereUrl = publicImageUrl(c.atmosphere_image_path);
  return {
    id: c.id,
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

/** Sospechosos (no víctima) de un caso para el escaparate público. Neutros,
 *  sin datos de variante ni culpable — sólo ficha pública + foto firmada. */
export async function getPublicSuspects(caseId: string): Promise<PublicSuspect[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('suspects')
    .select(SUSPECT_PUBLIC_COLUMNS)
    .eq('case_id', caseId)
    .eq('is_victim', false)
    .order('sort_order', { ascending: true });
  return ((data ?? []) as SuspectPublic[]).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    age: s.age,
    occupation: s.occupation,
    relationship_to_victim: s.relationship_to_victim,
    photoUrl: publicImageUrl(s.photo_path),
  }));
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
