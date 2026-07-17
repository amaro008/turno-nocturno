import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '../../_components/SiteNav';
import SiteFooter from '../../_components/SiteFooter';
import AtmoImage from '@/components/AtmoImage';
import { createServerClient } from '@/lib/server/supabase';
import { getPublicCase } from '@/lib/server/public-cases';
import { unsplashUrl, picsumUrl } from '@/lib/ui/placeholders';
import { DIFFICULTY_LABEL } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = await getPublicCase(params.slug);
  return { title: c ? `${c.title} · Turno Nocturno` : 'Caso · Turno Nocturno' };
}

const NEEDS = [
  { t: 'Una pantalla para compartir', d: 'Una laptop o TV que todos puedan ver. El anfitrión opera; el resto investiga en voz alta.' },
  { t: 'Buen internet', d: 'El Comandante responde en vivo por chat y notas de voz. Una conexión estable basta.' },
  { t: 'Ganas de investigar', d: 'De 2 a 6 personas dispuestas a discutir, dudar y acusar. No se necesita experiencia.' },
];

export default async function CaseDetailPage({ params }: { params: { slug: string } }) {
  const c = await getPublicCase(params.slug);
  if (!c) notFound();

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const coverPrimary = c.coverUrl ?? unsplashUrl(`${c.city} ${c.era_year} noir crime scene`, 1600, 700);
  const coverFallback = picsumUrl(`detail-${c.slug}`, 1600, 700, true);
  const hours = Math.round(c.time_limit_min / 30) / 2;

  return (
    <>
      <SiteNav />

      <section className="detail-hero">
        <AtmoImage primary={coverPrimary} fallback={coverFallback} alt={c.title} className="dh-bg" />
        <div className="dh-scrim" />
        <div className="wrap dh-inner">
          <span className="kicker">{c.city} · {c.era_year}</span>
          <h1>{c.title}</h1>
        </div>
      </section>

      <div className="wrap">
        <div className="detail-body">
          <div>
            <p className="detail-syn">{c.marketing_synopsis || c.synopsis}</p>

            <h2 style={{ fontSize: 22, margin: '36px 0 16px' }}>Qué necesitas</h2>
            <ul className="need-list">
              {NEEDS.map((n) => (
                <li key={n.t}>
                  <span className="nl-ic" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span>
                    <b style={{ color: 'var(--ink)' }}>{n.t}.</b> {n.d}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="detail-side">
            <div className="detail-price">
              {c.price_ref_mxn ? `$${c.price_ref_mxn} MXN` : 'Acceso al piloto'}
            </div>
            <div className="detail-meta">
              <div className="dm"><span className="k">Ciudad</span><span className="v">{c.city}</span></div>
              <div className="dm"><span className="k">Época</span><span className="v">{c.era_year}</span></div>
              <div className="dm"><span className="k">Duración</span><span className="v">~{hours} h</span></div>
              <div className="dm"><span className="k">Jugadores</span><span className="v">{c.players_min}–{c.players_max}</span></div>
              <div className="dm"><span className="k">Dificultad</span><span className="v">{DIFFICULTY_LABEL[c.difficulty]}</span></div>
            </div>

            {user ? (
              <>
                <a className="btn primary block lg" href="https://wa.me/?text=Quiero%20mi%20c%C3%B3digo%20para%20Turno%20Nocturno" target="_blank" rel="noreferrer">
                  Pedir mi código por WhatsApp
                </a>
                <p style={{ color: 'var(--ink-3)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
                  En el piloto entregamos códigos a mano. Te llegará por correo.
                </p>
              </>
            ) : (
              <>
                <Link className="btn primary block lg" href="/registro">
                  Comprar caso
                </Link>
                <p style={{ color: 'var(--ink-3)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
                  Crea tu cuenta para recibir tu código de acceso.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
