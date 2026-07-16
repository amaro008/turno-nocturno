// ============================================================================
// Callback de verificación de email de Supabase. Intercambia el `code` por
// sesión y redirige a la biblioteca.
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/server/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/mi-biblioteca';

  if (code) {
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No pudimos verificar tu cuenta. Intenta iniciar sesión.')}`);
}
