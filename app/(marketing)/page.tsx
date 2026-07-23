import Link from 'next/link';
import SiteNav from './_components/SiteNav';
import SiteFooter from './_components/SiteFooter';
import SiteAsset from '@/components/SiteAsset';
import CaseCoverImg from '@/components/CaseCoverImg';
import { getActiveCases } from '@/lib/server/public-cases';
import { DIFFICULTY_LABEL } from '@/lib/domain';
import ManillaFolder from '@/components/noir/ManillaFolder';
import ConfidentialStamp from '@/components/noir/ConfidentialStamp';
import PaperclipCorner from '@/components/noir/PaperclipCorner';
import RedString from '@/components/noir/RedString';
import Reveal from '@/components/noir/Reveal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Turno Nocturno — Juego de misterio criminal',
  description:
    'Juego de misterio criminal conducido por IA para jugar con amigos. Reúne a tu escuadra, sigan las pistas y nombren al culpable —cómo lo hizo y por qué— antes de que el reloj llegue a cero.',
  openGraph: {
    title: 'Turno Nocturno — Juego de misterio criminal',
    description: 'Una noche, una escuadra, el reloj en contra. Sigan las pistas y nombren al culpable.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'Turno Nocturno',
  },
};

function caseNumber(slug: string) {
  return slug.split('-')[0] ?? '00';
}
const PIN_ROT = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.2];

// El procedimiento de juego (secuencia real: por eso va numerado).
const STEPS = [
  { n: '01', ic: '// elige', title: 'Abre un expediente', text: 'Casos ambientados en distintas épocas, cada uno con su ciudad, su víctima y su verdad. Tú eliges cuál investigar.' },
  { n: '02', ic: '// reúne', title: 'Junta a tu escuadra', text: 'De 2 a 6 detectives en la misma partida. Repártanse la sala: cada quien sigue su pista.' },
  { n: '03', ic: '// investiga', title: 'Investiga contra el reloj', text: 'Consulta al Comandante por voz y texto, abre las pruebas del expediente y toma notas. Nada se entrega gratis.' },
  { n: '04', ic: '// acusa', title: 'Nombra al culpable', text: 'Quién, cómo y por qué. Cierran el caso y el Comandante evalúa qué tan cerca estuvieron de la verdad.' },
] as const;

const WHY = [
  { k: 'en equipo', t: 'Se juega con amigos', d: 'De 2 a 6 detectives en la misma sala. Sospechen, discutan y acusen juntos.' },
  { k: 'a reloj', t: 'Tienen una sola noche', d: 'El tiempo corre desde que abren el caso. Cada minuto que pierden pesa en el veredicto.' },
  { k: 'el mando', t: 'No están solos', d: 'Un Comandante los guía por voz, les exige y los presiona… pero jamás les da la respuesta.' },
] as const;

const REVIEWS = [
  { quote: 'Terminamos gritándonos quién era el culpable a la una de la mañana. Ningún juego nos había metido tanto.', who: 'Escuadra de 4 · CDMX', rot: -1.4 },
  { quote: 'La primera vez acusamos al equivocado. Nos quedamos con la espina toda la semana.', who: 'Grupo de 3 · Monterrey', rot: 1.1 },
  { quote: 'Se siente estar dentro de una película ochentera. La voz del Comandante te presiona de verdad.', who: 'Detective primeriza · Puebla', rot: -0.6 },
] as const;

export default async function HomePage() {
  const cases = await getActiveCases();
  const upcoming = Math.max(0, Math.min(2, 3 - cases.length));

  return (
    <>
      <SiteNav />

      {/* ===================== HERO — escritorio de investigación ===================== */}
      <section className="noir-hero" aria-label="Turno Nocturno">
        <div className="noir-hero-photo" aria-hidden="true">
          <SiteAsset slot="landing.hero" sizes="100vw" priority />
        </div>
        <div className="noir-hero-lamp" aria-hidden="true" />
        <div className="noir-hero-grain" aria-hidden="true" />

        <div className="wrap noir-hero-inner">
          <div className="noir-hero-folderwrap">
            <ConfidentialStamp variant="CONFIDENCIAL" rotate={-11} className="noir-hero-stamp" />
            <PaperclipCorner />
            <ManillaFolder label="TURNO NOCTURNO" tabSide="left" className="noir-hero-folder">
              <div className="noir-eyebrow font-typewriter">Juego de misterio criminal · conducido por IA</div>
              <h1 className="noir-hero-title font-editorial">Cada expediente esconde un culpable. <em>Encuéntrenlo.</em></h1>
              <p className="noir-hero-tag">
                Reúne a tu escuadra, sigan las pistas, crucen la evidencia y nombren al culpable —cómo lo hizo y por qué— antes de que el reloj llegue a cero.
              </p>
              <div className="noir-hero-cta">
                <Link className="noir-btn primary" href="/registro">Crear cuenta y empezar</Link>
                <Link className="noir-btn" href="#casos">Ver los expedientes</Link>
              </div>
              <div className="noir-hero-meta font-typewriter">
                2–6 detectives · 2–3 horas · en español · se juega en equipo
              </div>
            </ManillaFolder>
          </div>
        </div>
      </section>

      {/* ===================== BANDA — turno nocturno ===================== */}
      <section className="noir-shift">
        <div className="wrap">
          <Reveal className="shift-inner">
            <span className="noir-kicker font-typewriter">02:14 a.m. · la ciudad duerme</span>
            <p className="shift-line font-editorial">
              Los peores crímenes ocurren cuando las luces se apagan. Alguien tiene que estar de guardia para resolverlos —{' '}
              <em>ese es el turno nocturno.</em>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===================== CÓMO FUNCIONA ===================== */}
      <section className="noir-band como" id="como">
        <div className="wrap">
          <Reveal className="noir-head">
            <span className="noir-kicker font-typewriter">El procedimiento</span>
            <h2 className="font-editorial">Del expediente al veredicto, en una sola noche.</h2>
          </Reveal>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07} className="step-card">
                <div className="step-card-top font-typewriter">
                  <span className="step-card-num">{s.n}</span>
                  <span className="step-card-ic">{s.ic}</span>
                </div>
                <h3 className="font-editorial">{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== EXPEDIENTES ===================== */}
      <section className="noir-cases" id="casos">
        <div className="wrap">
          <Reveal className="noir-head light left">
            <span className="noir-kicker font-typewriter">Los expedientes</span>
            <h2 className="font-editorial">Casos de otra época, cada uno con su propia verdad.</h2>
            <p className="noir-head-sub">Cada caso es su propio mundo: su década, su ciudad, sus secretos. Empezamos con uno y el catálogo sigue creciendo.</p>
          </Reveal>

          <div className="case-grid">
            {cases.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06} className="case-card">
                <Link href={`/casos/${c.slug}`} className="case-folder-card" style={{ '--rot': `${PIN_ROT[i % PIN_ROT.length] * 0.2}deg` } as React.CSSProperties}>
                  <div className="case-photo">
                    <PaperclipCorner />
                    <CaseCoverImg url={c.coverUrl} alt={c.title} slug={c.slug} city={c.city} era={c.era_year} draggable={false} />
                  </div>
                  <div className="case-cbody">
                    <div className="case-meta font-typewriter"><span>Exp. {caseNumber(c.slug)}</span><span>{c.city} · {c.era_year}</span></div>
                    <h3 className="font-typewriter">{c.title}</h3>
                    <p>{c.marketing_synopsis || c.synopsis}</p>
                    <div className="case-foot">
                      <span className="case-tags font-typewriter">{DIFFICULTY_LABEL[c.difficulty]} · 2–6 detectives</span>
                      <span className="case-badge on font-typewriter">Disponible</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}

            {Array.from({ length: upcoming }).map((_, i) => (
              <Reveal key={`soon-${i}`} delay={(cases.length + i) * 0.06} className="case-card locked">
                <div className="case-folder-card is-soon">
                  <ConfidentialStamp variant="CLASIFICADO" rotate={-8} className="case-soon-stamp" />
                  <div className="case-photo">
                    <span className="case-photo-empty font-typewriter">Expediente sellado</span>
                  </div>
                  <div className="case-cbody">
                    <div className="case-meta font-typewriter"><span>Exp. ??-????</span><span>otra época</span></div>
                    <h3 className="font-typewriter">Nuevo expediente</h3>
                    <p>Otra ciudad, otra década, otro crimen sin resolver. En preparación.</p>
                    <div className="case-foot">
                      <span className="case-tags font-typewriter">En preparación</span>
                      <span className="case-badge soon font-typewriter">Pronto</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== POR QUÉ ENGANCHA ===================== */}
      <section className="noir-band why">
        <div className="wrap why-grid">
          <Reveal className="why-copy">
            <span className="noir-kicker font-typewriter">Por qué engancha</span>
            <h2 className="font-editorial">No es una historia. <em>Es una investigación.</em></h2>
            <p className="why-lede">Aquí no lees un misterio: lo resuelves. Se sospecha, se discute y se acusa —en equipo y con el reloj corriendo en contra.</p>
            <div className="why-list">
              {WHY.map((w) => (
                <div key={w.k} className="why-item">
                  <span className="why-k font-typewriter">↳ {w.k}</span>
                  <span className="why-t"><b className="font-editorial">{w.t}</b><span>{w.d}</span></span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="why-visual">
            <div className="why-board">
              <RedString className="why-board-string" points={[{ x: 22, y: 30 }, { x: 62, y: 22 }, { x: 46, y: 72 }]} />
              <span className="why-pin p1" aria-hidden="true" />
              <span className="why-pin p2" aria-hidden="true" />
              <span className="why-pin p3" aria-hidden="true" />
              <span className="why-board-tag font-typewriter">Muro de investigación</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== RESEÑAS ===================== */}
      <section className="noir-band testi-noir">
        <div className="wrap">
          <Reveal className="noir-head">
            <span className="noir-kicker font-typewriter">Declaraciones de los testigos</span>
            <h2 className="font-editorial">Lo que dicen quienes ya cerraron un caso.</h2>
          </Reveal>
          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="review-card" style={{ transform: `rotate(${r.rot}deg)` }}>
                  <div className="review-stars" aria-hidden="true">★★★★★</div>
                  <p>“{r.quote}”</p>
                  <div className="review-who font-typewriter">{r.who}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="noir-final">
            <ConfidentialStamp variant="TOP SECRET" rotate={-6} />
            <h2 className="font-editorial">Monterrey, 1989. <em>Un culpable.</em> Una sola noche.</h2>
            <p className="font-typewriter">El expediente está sobre la mesa · ustedes deciden cómo termina.</p>
            <Link className="noir-btn primary lg" href="/registro">Crear cuenta y empezar</Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
