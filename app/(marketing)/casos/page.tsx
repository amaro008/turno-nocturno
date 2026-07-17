import SiteNav from '../_components/SiteNav';
import SiteFooter from '../_components/SiteFooter';
import CatalogClient from './_components/CatalogClient';
import { getActiveCases } from '@/lib/server/public-cases';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Casos · Turno Nocturno',
  description: 'Catálogo de casos criminales ambientados en ciudades icónicas de LATAM. Elige tu caso y reúne a tu mesa.',
  openGraph: {
    title: 'Casos · Turno Nocturno',
    description: 'Ciudades icónicas de LATAM, cada una con su crimen y su época.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'Turno Nocturno',
  },
};

export default async function CasosPage() {
  const cases = await getActiveCases();
  return (
    <>
      <SiteNav />
      <main className="block">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: 28 }}>
            <span className="kicker">Catálogo</span>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,36px)', margin: '12px 0 0' }}>
              Elige tu caso. Reúne a tu mesa.
            </h2>
            <p style={{ color: 'var(--ink-2)', marginTop: 12 }}>
              Cada caso está ambientado en una ciudad y una época distinta.
            </p>
          </div>
          <CatalogClient cases={cases} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
