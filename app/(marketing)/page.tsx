import Link from 'next/link';
import SiteNav from './_components/SiteNav';
import SiteFooter from './_components/SiteFooter';
import AtmoImage from '@/components/AtmoImage';
import { getActiveCases } from '@/lib/server/public-cases';
import { unsplashUrl, picsumUrl } from '@/lib/ui/placeholders';
import { DIFFICULTY_LABEL } from '@/lib/domain';

export const dynamic = 'force-dynamic';

const STEPS = [
  { n: '01', title: 'Crea tu cuenta', text: 'Nombre, correo y tu ciudad. Menos de un minuto y quedas listo.', q: 'sign up,desk,vintage', seed: 'tn-step1' },
  { n: '02', title: 'Recibe tu código', text: 'Te llega por correo un código de acceso para el caso que elegiste.', q: 'letter,envelope,noir', seed: 'tn-step2' },
  { n: '03', title: 'Juega en grupo', text: 'De 2 a 6 detectives frente a una pantalla. El reloj arranca.', q: 'friends,night,detective', seed: 'tn-step3' },
];

const TESTIMONIALS = [
  { quote: 'Terminamos gritándole al Comandante como si fuera real. Dos horas que se sintieron veinte minutos.', name: 'Mariana G.', role: 'Mesa de 4 · CDMX', initials: 'MG' },
  { quote: 'La evidencia de época está increíble. Sentías que estabas en el 89 de verdad.', name: 'Diego R.', role: 'Mesa de 5 · Monterrey', initials: 'DR' },
  { quote: 'Lo volvimos a jugar y el culpable era otro. No lo podíamos creer.', name: 'Sofía L.', role: 'Mesa de 3 · Guadalajara', initials: 'SL' },
];

export default async function HomePage() {
  const cases = await getActiveCases();
  const featured = cases[0];

  const atmoPrimary = featured?.atmosphereUrl ?? unsplashUrl('detective noir dark city night', 1800, 1000);
  const atmoFallback = picsumUrl('turno-nocturno-hero', 1800, 1000, true);

  return (
    <>
      <SiteNav />

      {/* HERO con imagen atmosférica */}
      <section className="hero-img">
        <AtmoImage primary={atmoPrimary} fallback={atmoFallback} alt="Escena nocturna de investigación" className="hero-img-bg" />
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
                  <AtmoImage primary={unsplashUrl(s.q, 600, 360)} fallback={picsumUrl(s.seed, 600, 360, true)} alt={s.title} />
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
                    <AtmoImage
                      primary={c.coverUrl ?? unsplashUrl(`${c.city} ${c.era_year} noir`, 700, 470)}
                      fallback={picsumUrl(`case-${c.slug}`, 700, 470, true)}
                      alt={c.title}
                    />
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
                  <span className="t-av">{t.initials}</span>
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
