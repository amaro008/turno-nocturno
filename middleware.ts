// ============================================================================
// MIDDLEWARE — refresca la sesión de Supabase y protege rutas privadas.
// Protege /mi-biblioteca/*, /s/*, /admin/*. Para /admin/* exige role='admin'
// (defense in depth: cada API route de /api/admin/* revalida también).
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PROTECTED = ['/mi-biblioteca', '/s', '/admin'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(p + '/'));

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Guardia de admin
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/mi-biblioteca';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/mi-biblioteca/:path*', '/s/:path*', '/admin/:path*'],
};
