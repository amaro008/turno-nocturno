import Link from 'next/link';
import { registerAction } from '../actions';

export default function RegistroPage({
  searchParams,
}: {
  searchParams: { error?: string; ok?: string };
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
      <h1>Crea tu cuenta.</h1>
      <p className="sub">Menos de un minuto. Luego recibirás tu código de acceso por correo.</p>

      {searchParams.error && <div className="note-error" style={{ marginBottom: 14 }}>{searchParams.error}</div>}
      {searchParams.ok && <div className="note-ok" style={{ marginBottom: 14 }}>{searchParams.ok}</div>}

      <form className="auth-form" action={registerAction}>
        <div>
          <label className="label" htmlFor="full_name">Nombre completo</label>
          <input className="input" id="full_name" name="full_name" required placeholder="Ana Ramírez" />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input className="input" id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo 8 caracteres" />
        </div>
        <div className="auth-row">
          <div>
            <label className="label" htmlFor="birth_year">Año de nacimiento</label>
            <input className="input" id="birth_year" name="birth_year" type="number" min={1920} max={2012} required placeholder="1995" />
          </div>
          <div>
            <label className="label" htmlFor="country">País</label>
            <input className="input" id="country" name="country" required defaultValue="México" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="city">Ciudad <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(opcional)</span></label>
          <input className="input" id="city" name="city" placeholder="Monterrey" />
        </div>
        <label className="auth-check">
          <input type="checkbox" name="accepted" />
          <span>
            Acepto los <Link href="/terminos">Términos</Link> y el{' '}
            <Link href="/privacidad">Aviso de Privacidad</Link>.
          </span>
        </label>
        <button className="btn primary block" type="submit">Crear cuenta</button>
      </form>

      <p className="auth-foot">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
      <Link className="auth-back" href="/">← Volver al inicio</Link>
    </div>
  );
}
