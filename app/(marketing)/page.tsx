import Link from 'next/link';
import SiteNav from './_components/SiteNav';
import SiteFooter from './_components/SiteFooter';
import SiteAsset from '@/components/SiteAsset';
import { InitialsCover } from '@/components/Initials';
import { getActiveCases } from '@/lib/server/public-cases';
import { DIFFICULTY_LABEL } from '@/lib/domain';

function caseNumber(slug: string) {
  return slug.split('-')[0] ?? '00';
}

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
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Turno Nocturno — Reabre el caso',
    description: 'Juego de misterio conducido por IA. Reabre casos criminales con tu mesa.',
  },
};

const STEPS = [
  { n: '01', slot: 'landing.how_step_1', title: 'Crea tu cuenta', text: 'Nombre, correo y tu ciudad. Menos de un minuto y quedas listo.' },
  { n: '02', slot: 'landing.how_step_2', title: 'Recibe tu código', text: 'Te llega por correo un código de acceso para el caso que elegiste.' },
  { n: '03', slot: 'landing.how_step_3', title: 'Juega en grupo', text: 'De 2 a 6 detectives frente a una pantalla. El reloj arranca.' },
];

const TESTIMONIALS = [
  { quote: 'Terminamos gritándole al Comandante como si fuera real. Dos horas que se sintieron veinte minutos.', name: 'Mariana G.', role: 'Mesa de 4 · CDMX', initials: 'MG', slot: 'landing.testimonial_1_avatar' },
  { quote: 'La evidencia de época está increíble. Sentías que estabas en el 89 de verdad.', name: 'Diego R.', role: 'Mesa de 5 · Monterrey', initials: 'DR', slot: 'landing.testimonial_2_avatar' },
  { quote: 'Lo volvimos a jugar y el culpable era otro. No lo podíamos creer.', name: 'Sofía L.', role: 'Mesa de 3 · Guadalajara', initials: 'SL', slot: 'landing.testimonial_3_avatar' },
];

export default async function HomePage() {
  const cases = await getActiveCases();

  return (
    <>
      <SiteNav />

      {/* HERO con imagen atmosférica (editable desde /admin/assets) */}
      <section className="hero-img">
        <div className="hero-img-bg">
          <SiteAsset slot="landing.hero" priority sizes="100vw" />
        </div>
        <div className="hero-img-scrim" />
        <div className="hero-img-scan" />
        <div className="wrap hero-img-inner">
          <span className="kicker">Juego de misterio conducido por IA</span>
          <h1>
            Reabre casos. Interroga sospechosos.
            <br />
            Encuentra al culpable <span className="amberword">antes que el reloj llegue a cero.</span>
          </h1>
          <p className="lede">
            Reúne a tu mesa y reabran un caso criminal archivado. Un Comandante los conduce por chat
            y notas de voz. El culpable cambia en cada partida.
          </p>
          <div className="hero-cta">
            <Link className="btn primary lg" href="/casos">
              Ver casos
            </Link>
            <Link className="btn ghost lg" href="/como-funciona">
              Cómo funciona
            </Link>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA — 3 pasos ilustrados */}
      <section className="block">
        <div className="wrap">
          <div className="sec-center">
            <span className="kicker">Cómo funciona</span>
            <h2>Tres pasos y están dentro del caso.</h2>
            <p>Sin descargas ni manuales. Si usas mensajería, ya sabes jugar.</p>
          </div>
          <div className="steps-illus">
            {STEPS.map((s) => (
              <div className="step-illus" key={s.n}>
                <div className="si-img">
                  <SiteAsset slot={s.slot} sizes="(max-width: 940px) 100vw, 33vw" />
                  <span className="si-num">{s.n}</span>
                </div>
                <div className="si-body">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASOS DISPONIBLES — del catálogo real */}
      <section className="block" style={{ background: 'linear-gradient(180deg, transparent, var(--night-2))' }}>
        <div className="wrap">
          <div className="sec-center">
            <span className="kicker">Casos disponibles</span>
            <h2>Ciudades icónicas de LATAM, cada una con su crimen.</h2>
          </div>
          {cases.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-3)' }}>Muy pronto anunciaremos el primer caso.</p>
          ) : (
            <div className="catalog-grid">
              {cases.slice(0, 3).map((c) => (
                <Link className="ccard" href={`/casos/${c.slug}`} key={c.slug}>
                  <div className="ccard-cover">
                    {c.coverUrl ? (
                      <img src={c.coverUrl} alt={c.title} />
                    ) : (
                      <InitialsCover seed={c.slug} label={caseNumber(c.slug)} sub={`${c.city} · ${c.era_year}`} />
                    )}
                    <div className="cc-scrim" />
                    <span className="cc-place">{c.city} · {c.era_year}</span>
                    <span className="badge-state on cc-diff">{DIFFICULTY_LABEL[c.difficulty]}</span>
                  </div>
                  <div className="ccard-body">
                    <h3>{c.title}</h3>
                    <p className="cc-syn">{c.marketing_synopsis || c.synopsis}</p>
                    <div className="ccard-foot">
                      <span className="cc-price">
                        {c.price_ref_mxn ? `$${c.price_ref_mxn}` : 'Piloto'} <small>{c.price_ref_mxn ? 'MXN' : ''}</small>
                      </span>
                      <span className="btn ghost" style={{ padding: '7px 12px', fontSize: 13 }}>Ver detalles</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {cases.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Link className="btn ghost lg" href="/casos">Ver todo el catálogo</Link>
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="block">
        <div className="wrap">
          <div className="sec-center">
            <span className="kicker">Lo que dicen las mesas</span>
            <h2>Una noche que no se olvida.</h2>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t) => (
              <div className="testi" key={t.name}>
                <div className="t-stars">★★★★★</div>
                <p>“{t.quote}”</p>
                <div className="t-who">
                  <span className="t-av"><SiteAsset slot={t.slot} fallbackLabel={t.initials} sizes="40px" /></span>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
