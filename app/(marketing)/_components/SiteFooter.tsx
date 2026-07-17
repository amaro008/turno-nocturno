import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot">
          <div>
            <div className="fbrand">Turno Nocturno</div>
            <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: '8px 0 0', maxWidth: 320 }}>
              Juego de misterio conducido por IA. Reabre casos criminales con tu mesa.
            </p>
          </div>
          <div className="flinks">
            <Link href="/casos">Casos</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
            <Link href="/login">Iniciar sesión</Link>
            <a href="https://wa.me/" target="_blank" rel="noreferrer">Contacto</a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
          </div>
        </div>
        <p className="foot-legal">
          Turno Nocturno © 1989 / 2026 · Piloto privado en español. Experiencia de ficción;
          personajes, casos y evidencias son inventados. Al registrarte aceptas los Términos y el
          Aviso de Privacidad (LFPDPPP).
        </p>
      </div>
    </footer>
  );
}
