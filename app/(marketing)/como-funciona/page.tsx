import Link from 'next/link';
import SiteNav from '../_components/SiteNav';
import SiteFooter from '../_components/SiteFooter';
import HeroTeaser from '../_components/HeroTeaser';
import AtmoImage from '@/components/AtmoImage';
import { unsplashUrl, picsumUrl } from '@/lib/ui/placeholders';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cómo funciona · Turno Nocturno' };

const FAQ = [
  { q: '¿Necesito saber jugar juegos de mesa?', a: 'No. Si sabes usar una app de mensajería, ya sabes jugar. El Comandante te guía en todo momento.' },
  { q: '¿Cuántas personas se necesitan?', a: 'De 2 a 6. Una sola persona opera la pantalla compartida y el resto investiga en voz alta.' },
  { q: '¿Cuánto dura una sesión?', a: 'Entre 2 y 3 horas. Puedes pausar y retomar: tienes hasta 24 horas desde que activas para completarlo.' },
  { q: '¿Puedo volver a jugar el mismo caso?', a: 'Sí. El culpable se sortea al activar, así que cada partida puede tener un desenlace distinto. Es imposible spoilear.' },
  { q: '¿Cómo obtengo mi código?', a: 'En el piloto entregamos los códigos a mano. Crea tu cuenta, elige tu caso y te lo enviamos por correo.' },
  { q: '¿Necesito instalar algo?', a: 'No. Todo corre en el navegador, en tu compu o tu tele. Solo necesitas buen internet.' },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <SiteNav />

      <main className="block">
        <div className="wrap prose-block">
          <span className="kicker">Cómo funciona</span>
          <h1 style={{ fontSize: 'clamp(30px,5vw,46px)', margin: '14px 0 6px', letterSpacing: '-0.02em' }}>
            Una noche. Un caso archivado. Tu mesa contra el reloj.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-2)' }}>
            Turno Nocturno convierte tu sala en una sala de investigación. Reabren un expediente que
            la Fiscalía prefirió olvidar y tienen hasta que el reloj llegue a cero para nombrar al
            culpable, explicar cómo lo hizo y por qué.
          </p>

          <AtmoImage
            primary={unsplashUrl('detective board evidence noir', 1200, 500)}
            fallback={picsumUrl('como-1', 1200, 500, true)}
            alt="Tablero de investigación"
            className="prose-img"
          />

          <h2>1. El Comandante te contacta</h2>
          <p>
            Apenas activas la sesión, un Comandante —una IA que conduce el caso en vivo— te escribe
            por chat, como si fuera mensajería. Te entrega el expediente, te manda notas de voz y
            suelta evidencia poco a poco. Puedes interrogarlo, pedirle pistas o exigirle una prueba.
            Nunca te dará la respuesta: su trabajo es abrirte el archivo, no resolver el caso por ti.
          </p>

          <h2>2. Investigan en equipo</h2>
          <p>
            La evidencia es 100% de época: cintas VHS, casetes, registros telefónicos en papel. Todo
            se organiza en el Expediente por pestañas. Mientras el reloj corre, llegan peritajes
            nuevos, presiones del ministerio público y un ultimátum final. El caso está vivo.
          </p>

          <h2>3. Entregan su veredicto</h2>
          <p>
            Cuando estén listos —o cuando el reloj los obligue— cierran el caso: quién, cómo y por
            qué. El Comandante evalúa su teoría y narra la resolución. Aciertan… o el expediente
            vuelve a archivarse.
          </p>
        </div>
      </main>

      {/* Demo del Comandante */}
      <section className="block" style={{ background: 'var(--night-2)', borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
        <div className="wrap demo-grid">
          <div>
            <span className="kicker">En vivo</span>
            <h2 style={{ fontSize: 'clamp(24px,3.4vw,34px)', margin: '12px 0 10px' }}>Así te escribe el Comandante.</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.6 }}>
              Texto, notas de voz y tarjetas de evidencia dentro del chat. Una interfaz que ya
              conoces, con la tensión de una sala de interrogatorios.
            </p>
          </div>
          <HeroTeaser />
        </div>
      </section>

      {/* FAQ */}
      <section className="block">
        <div className="wrap">
          <div className="sec-center">
            <span className="kicker">Preguntas frecuentes</span>
            <h2>Lo que todos preguntan.</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <div className="faq-a">{f.a}</div>
              </details>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 34 }}>
            <Link className="btn primary lg" href="/casos">Ver los casos</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
