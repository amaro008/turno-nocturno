import Link from 'next/link';

export const metadata = { title: 'Términos · Turno Nocturno' };

export default function TerminosPage() {
  return (
    <main className="wrap" style={{ padding: '60px 24px', maxWidth: 760 }}>
      <Link href="/" style={{ color: 'var(--amber)', fontSize: 13 }}>← Inicio</Link>
      <h1 style={{ fontSize: 32, marginTop: 16 }}>Términos y condiciones</h1>
      <p style={{ color: 'var(--ink-2)' }}>
        Borrador base del piloto. El texto legal definitivo se publicará antes de habilitar cobros.
        Turno Nocturno es una experiencia de ficción de uso recreativo; personajes, casos y
        evidencias son inventados. El acceso al piloto es por invitación mediante código de un solo
        uso, sujeto a las ventanas de tiempo indicadas al canjear.
      </p>
      <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 24 }}>
        Documento pendiente de revisión legal (LFPDPPP, México).
      </p>
    </main>
  );
}
