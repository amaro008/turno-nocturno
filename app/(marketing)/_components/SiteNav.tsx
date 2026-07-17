import Link from 'next/link';
import { createServerClient } from '@/lib/server/supabase';

export default async function SiteNav() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link className="logo" href="/">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
              <path d="M9 12.5 11 14.5 15.5 9.5" />
            </svg>
          </span>
          <span>
            <b>Turno Nocturno</b>
            <small>Expediente reabierto</small>
          </span>
        </Link>
        <nav className="nav-links">
          <Link href="/casos">Casos</Link>
          <Link href="/como-funciona">Cómo funciona</Link>
        </nav>
        <div className="nav-cta">
          {user ? (
            <Link className="btn primary" href="/mi-biblioteca">
              Mi biblioteca
            </Link>
          ) : (
            <>
              <Link className="btn ghost" href="/login">
                Iniciar sesión
              </Link>
              <Link className="btn primary" href="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
