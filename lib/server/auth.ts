// Helper de autenticación para API routes (SOLO servidor).
import { redirect } from 'next/navigation';
import { createServerClient } from './supabase';

export async function getAuthedUser() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Exige admin: devuelve el user o redirige. Defense in depth (además del middleware). */
export async function requireAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/mi-biblioteca');
  return user;
}
