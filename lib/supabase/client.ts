// ============================================================================
// SUPABASE — Cliente de navegador (browser). Seguro para componentes cliente.
// Usa la anon/publishable key y respeta RLS.
// ============================================================================

'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
