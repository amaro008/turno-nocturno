import Link from 'next/link';
import { createServerClient } from '@/lib/server/supabase';
import { logoutAction } from '@/app/(auth)/actions';

export default async function AppHeader() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let name = '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
    name = profile?.full_name || user.email || '';
  }

  return (
    <header className="app-header">
      <div className="wrap app-header-inner">
        <Link className="app-logo" href="/mi-biblioteca">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
              <path d="M9 12.5 11 14.5 15.5 9.5" />
            </svg>
          </span>
          <b>Turno Nocturno</b>
        </Link>
        <nav className="app-nav">
          <Link href="/mi-biblioteca">Mi biblioteca</Link>
          {isAdmin && (
            <Link href="/admin" className="app-admin-link">
              Admin
            </Link>
          )}
        </nav>
        <div className="app-user">
          <span className="app-user-name mono">{name}</span>
          <form action={logoutAction}>
            <button className="btn ghost" type="submit" style={{ padding: '7px 12px', fontSize: 13 }}>
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
