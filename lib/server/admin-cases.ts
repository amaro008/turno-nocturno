// Helpers de servidor para el módulo de gestión de casos.
import { createServiceClient } from './supabase';

export async function getCaseBySlug(slug: string) {
  const svc = createServiceClient();
  const { data } = await svc.from('cases').select('*').eq('slug', slug).maybeSingle();
  return data;
}
