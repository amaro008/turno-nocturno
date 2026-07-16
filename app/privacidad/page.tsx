import Link from 'next/link';

export const metadata = { title: 'Aviso de Privacidad · Turno Nocturno' };

export default function PrivacidadPage() {
  return (
    <main className="wrap" style={{ padding: '60px 24px', maxWidth: 760 }}>
      <Link href="/" style={{ color: 'var(--amber)', fontSize: 13 }}>← Inicio</Link>
      <h1 style={{ fontSize: 32, marginTop: 16 }}>Aviso de Privacidad</h1>
      <p style={{ color: 'var(--ink-2)' }}>
        Borrador base del piloto conforme a la LFPDPPP (México). Recabamos nombre, correo, año de
        nacimiento y país/ciudad para operar tu cuenta, personalizar la experiencia y segmentar por
        mercado. No compartimos tus datos con terceros con fines comerciales. Puedes solicitar el
        borrado de tu cuenta escribiendo al administrador; la solicitud queda registrada y se
        atiende de forma manual durante el piloto.
      </p>
      <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 24 }}>
        Documento pendiente de revisión legal.
      </p>
    </main>
  );
}
