import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="noir-footer">
      <div className="wrap noir-footer-inner">
        <div className="badge-plate">
          <span className="plate-top font-typewriter">Departamento de Casos Archivados</span>
          <span className="plate-title font-editorial">Turno Nocturno</span>
          <span className="plate-sub font-typewriter">Placa 89 · turno de la madrugada</span>
        </div>

        <nav className="noir-footer-links font-typewriter">
          <Link href="/casos">Casos</Link>
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/login">Iniciar sesión</Link>
          <a href="https://wa.me/" target="_blank" rel="noreferrer">Contacto</a>
          <a href="https://instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          <Link href="/terminos">Términos</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
      </div>

      <div className="wrap noir-footer-legal font-typewriter">
        <span className="footer-stamp">© 1989 / 2026</span>
        Turno Nocturno · piloto privado en español. Experiencia de ficción; personajes, casos y
        evidencias son inventados. Al registrarte aceptas los Términos y el Aviso de Privacidad (LFPDPPP).
      </div>
    </footer>
  );
}
