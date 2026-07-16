import Link from 'next/link';
import { loginAction } from '../actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="auth-card">
      <div className="auth-logo">
        <span className="mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
            <path d="M9 12.5 11 14.5 15.5 9.5" />
          </svg>
        </span>
        Turno Nocturno
      </div>
      <h1>Bienvenido de vuelta, detective.</h1>
      <p className="sub">Inicia sesión para ver tu biblioteca y activar tu sesión.</p>

      {searchParams.error && <div className="note-error" style={{ marginBottom: 14 }}>{searchParams.error}</div>}

      <form className="auth-form" action={loginAction}>
        <input type="hidden" name="next" value={searchParams.next ?? '/mi-biblioteca'} />
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </div>
        <button className="btn primary block" type="submit">Entrar</button>
      </form>

      <p className="auth-foot">
        ¿No tienes cuenta? <Link href="/registro">Crea una</Link>
      </p>
      <Link className="auth-back" href="/">← Volver al inicio</Link>
    </div>
  );
}
