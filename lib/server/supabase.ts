// ============================================================================
// SUPABASE — Clientes de servidor.
// - `createServerClient()`   → ligado a cookies del usuario (respeta RLS)
// - `createServiceClient()`  → service role (bypassa RLS). SOLO para lógica
//                               privilegiada del juego y del admin en API routes.
// NUNCA importar este archivo desde componentes cliente.
// ============================================================================

import { cookies } from 'next/headers';
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Cliente ligado a la sesión del usuario (cookies). Respeta RLS. */
export function createServerClient() {
  const cookieStore = cookies();
  return createSSRClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Llamado desde un Server Component: el middleware refresca la cookie.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          /* noop */
        }
      },
    },
  });
}

/** Cliente con service role. Bypassa RLS. Úsalo solo en servidor. */
export function createServiceClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
