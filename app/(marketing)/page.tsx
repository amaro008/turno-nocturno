import Link from 'next/link';
import SiteNav from './_components/SiteNav';
import SiteFooter from './_components/SiteFooter';
import { InitialsCover } from '@/components/Initials';
import { getActiveCases } from '@/lib/server/public-cases';
import { DIFFICULTY_LABEL } from '@/lib/domain';
import ManillaFolder from '@/components/noir/ManillaFolder';
import ConfidentialStamp from '@/components/noir/ConfidentialStamp';
import PaperclipCorner from '@/components/noir/PaperclipCorner';
import CoffeeStain from '@/components/noir/CoffeeStain';
import RedString from '@/components/noir/RedString';
import TypewriterText from '@/components/noir/TypewriterText';
import Reveal from '@/components/noir/Reveal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Turno Nocturno — Reabre el caso',
  description:
    'Juego de misterio conducido por IA. Reúne a tu mesa, reabran un caso criminal archivado y encuentren al culpable antes de que el reloj llegue a cero.',
  openGraph: {
    title: 'Turno Nocturno — Reabre el caso',
    description: 'Una noche, una mesa, el reloj en contra. El culpable cambia en cada partida.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'Turno Nocturno',
  },
};

function caseNumber(slug: string) {
  return slug.split('-')[0] ?? '00';
}
const PIN_ROT = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.2];

const STEPS = [
  { n: '01', label: 'PASO 01', stamp: 'ARCHIVO', title: 'Crea tu cuenta', text: 'Nombre, correo y tu ciudad. Menos de un minuto y quedas dentro del sistema.' },
  { n: '02', label: 'PASO 02', stamp: 'PENDIENTE', title: 'Recibe tu código', text: 'Te llega por correo un código de acceso para el caso que elegiste.' },
  { n: '03', label: 'PASO 03', stamp: 'ACTIVO', title: 'Reúne a tu mesa', text: 'De 2 a 6 detectives frente a una pantalla. El reloj arranca.' },
] as const;

const TESTIMONIALS = [
  { quote: 'Terminamos gritándole al Comandante como si fuera real. Dos horas que se sintieron veinte minutos.', name: 'Mariana G.', role: 'Mesa de 4 · CDMX', rot: -2.5 },
  { quote: 'La evidencia de época está increíble. Sentías que estabas en el 89 de verdad.', name: 'Diego R.', role: 'Mesa de 5 · Monterrey', rot: 1.8 },
  { quote: 'Lo volvimos a jugar y el culpable era otro. No lo podíamos creer.', name: 'Sofía L.', role: 'Mesa de 3 · GDL', rot: -1.2 },
] as const;

export default async function HomePage() {
  const cases = await getActiveCases();

  return (
    <>
      <SiteNav />

      {/* ===================== HERO — escritorio de detective ===================== */}
      <section className="noir-hero" aria-label="Turno Nocturno">
        <div className="noir-hero-lamp" aria-hidden="true" />
        <div className="noir-hero-grain" aria-hidden="true" />

        {/* Props del escritorio */}
        <svg className="prop prop-magnifier" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="42" cy="42" r="26" fill="rgba(20,25,35,0.35)" stroke="#8a939c" strokeWidth="3" />
          <circle cx="42" cy="42" r="26" fill="none" stroke="#c9d2db" strokeWidth="1" />
          <rect x="62" y="62" width="30" height="9" rx="4" transform="rotate(45 62 62)" fill="#5a4632" />
        </svg>
        <svg className="prop prop-typewriter" viewBox="0 0 120 80" aria-hidden="true">
          <rect x="14" y="34" width="92" height="34" rx="5" fill="#1c1c1c" />
          <rect x="24" y="20" width="72" height="20" rx="3" fill="#262626" />
          <rect x="34" y="8" width="52" height="16" rx="2" fill="#2e2e2e" />
          <rect x="40" y="12" width="40" height="8" fill="#111" />
          {[0, 1, 2].flatMap((r) =>
            [0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
              <circle key={`${r}-${c}`} cx={26 + c * 10} cy={44 + r * 7} r="2.2" fill="#3d3d3d" />
            )),
          )}
        </svg>
        <div className="prop prop-coffee" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <ellipse cx="46" cy="30" rx="30" ry="9" fill="#2a1c10" />
            <path d="M16 30v22c0 14 12 24 30 24s30-10 30-24V30" fill="#e8d9b8" stroke="#b9a67e" strokeWidth="2" />
            <path d="M76 36c12-2 16 16 2 20" fill="none" stroke="#b9a67e" strokeWidth="4" />
            <ellipse cx="46" cy="30" rx="24" ry="6" fill="#3a2413" />
          </svg>
          <CoffeeStain className="prop-coffee-stain" size={70} rotate={18} opacity={0.4} />
        </div>
        <div className="prop prop-smoke" aria-hidden="true">
          <span className="smoke s1" />
          <span className="smoke s2" />
          <span className="smoke s3" />
          <span className="cigarette" />
        </div>

        {/* Folder central con el copy */}
        <div className="wrap noir-hero-inner">
          <div className="noir-hero-folderwrap">
            <ConfidentialStamp variant="ARCHIVO MUERTO" rotate={-12} className="noir-hero-stamp" />
            <PaperclipCorner />
            <ManillaFolder label="EXP. 89-1027-H" tabSide="left" className="noir-hero-folder">
              <div className="noir-eyebrow font-typewriter">Fiscalía · expediente reabierto</div>
              <h1 className="noir-hero-title font-editorial">Reabre el caso.</h1>
              <TypewriterText
                as="p"
                className="noir-hero-tag"
                text="Interroga a los sospechosos. Encuentra al culpable, cómo lo hizo y por qué… antes de que el reloj llegue a cero."
                speed={26}
              />
              <div className="noir-hero-cta">
                <Link className="noir-btn primary" href="/casos">Reabrir un caso</Link>
                <Link className="noir-btn" href="/como-funciona">Cómo funciona</Link>
              </div>
              <div className="noir-hero-meta font-typewriter">
                2–6 detectives · 2–3 horas · el culpable cambia en cada partida
              </div>
            </ManillaFolder>
          </div>
        </div>
      </section>

      {/* ===================== CÓMO FUNCIONA — expedientes en abanico ===================== */}
      <section className="noir-band como" id="como">
        <div className="wrap">
          <Reveal className="noir-head">
            <span className="noir-kicker font-typewriter">Procedimiento</span>
            <h2 className="font-editorial">Tres pasos y están dentro del caso.</h2>
          </Reveal>
          <div className="folders-fan">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08} className={`fan-item fan-${i}`}>
                <div className="step-folder">
                  <PaperclipCorner />
                  <ConfidentialStamp variant="EVIDENCIA" rotate={7} className="step-stamp" />
                  <ManillaFolder label={s.label}>
                    <div className="step-num font-editorial">{s.n}</div>
                    <h3 className="font-typewriter">{s.title}</h3>
                    <p>{s.text}</p>
                  </ManillaFolder>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CASOS — muro de investigación ===================== */}
      <section className="noir-board texture-cork" id="casos">
        <div className="wrap">
          <Reveal className="noir-head light">
            <span className="noir-kicker font-typewriter">Casos abiertos</span>
            <h2 className="font-editorial">El muro de investigación.</h2>
          </Reveal>

          <div className="board-wall">
            <RedString
              className="board-string"
              points={[{ x: 16, y: 26 }, { x: 50, y: 20 }, { x: 84, y: 32 }, { x: 52, y: 70 }]}
            />
            {cases.length === 0 && <p className="board-empty font-typewriter">Muy pronto se abre el primer expediente…</p>}
            {cases.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06} className="pin-wrap">
                <Link href={`/casos/${c.slug}`} className="pin-card" style={{ transform: `rotate(${PIN_ROT[i % PIN_ROT.length]}deg)` }}>
                  <span className="pushpin" aria-hidden="true" />
                  <div className="pin-photo">
                    {c.coverUrl ? (
                      <img src={c.coverUrl} alt={c.title} draggable={false} />
                    ) : (
                      <InitialsCover seed={c.slug} label={caseNumber(c.slug)} sub={`${c.city} · ${c.era_year}`} />
                    )}
                    <span className="pin-diff font-typewriter">{DIFFICULTY_LABEL[c.difficulty]}</span>
                  </div>
                  <div className="pin-body">
                    <div className="pin-file font-typewriter">EXP. {caseNumber(c.slug)} · {c.city} {c.era_year}</div>
                    <h3 className="font-typewriter">{c.title}</h3>
                    <p>{c.marketing_synopsis || c.synopsis}</p>
                    <span className="pin-cta font-typewriter">Ver expediente →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIOS — notas al aire ===================== */}
      <section className="noir-band testi-noir">
        <div className="wrap">
          <Reveal className="noir-head">
            <span className="noir-kicker font-typewriter">Del expediente de la prensa</span>
            <h2 className="font-editorial">Lo que dijeron las mesas.</h2>
          </Reveal>
          <div className="notes-wall">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <div className="postit" style={{ transform: `rotate(${t.rot}deg)` }}>
                  {i === 1 && <CoffeeStain className="postit-coffee" size={80} rotate={-10} opacity={0.35} />}
                  <p>“{t.quote}”</p>
                  <div className="postit-sign font-hand">{t.name}</div>
                  <div className="postit-role font-typewriter">{t.role}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="noir-final">
            <ConfidentialStamp variant="TOP SECRET" rotate={-6} />
            <h2 className="font-editorial">El expediente 89-1027-H lleva 36 años cerrado.</h2>
            <p className="font-typewriter">Ustedes lo reabren hoy.</p>
            <Link className="noir-btn primary lg" href="/registro">Crear cuenta y empezar</Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
