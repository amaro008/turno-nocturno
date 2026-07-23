'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import CaseCoverImg from '@/components/CaseCoverImg';
import { DIFFICULTY_LABEL, type CaseDifficulty } from '@/lib/domain';
import type { PublicCase } from '@/lib/server/public-cases';

export default function CatalogClient({ cases }: { cases: PublicCase[] }) {
  const [city, setCity] = useState('all');
  const [era, setEra] = useState('all');
  const [diff, setDiff] = useState('all');

  const cities = useMemo(() => Array.from(new Set(cases.map((c) => c.city))).sort(), [cases]);
  const eras = useMemo(() => Array.from(new Set(cases.map((c) => c.era_year))).sort((a, b) => a - b), [cases]);

  const filtered = cases.filter(
    (c) =>
      (city === 'all' || c.city === city) &&
      (era === 'all' || String(c.era_year) === era) &&
      (diff === 'all' || c.difficulty === diff),
  );

  return (
    <>
      <div className="pub-filters">
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input" value={era} onChange={(e) => setEra(e.target.value)}>
          <option value="all">Todas las épocas</option>
          {eras.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select className="input" value={diff} onChange={(e) => setDiff(e.target.value)}>
          <option value="all">Toda dificultad</option>
          {(['facil', 'medio', 'dificil'] as CaseDifficulty[]).map((d) => (
            <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
          ))}
        </select>
        <span className="fcount">{filtered.length} caso{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState ill="search" title="Sin resultados" message="No hay casos con esos filtros. Prueba con otra ciudad o época." />
      ) : (
        <div className="catalog-grid">
          {filtered.map((c) => (
            <Link className="ccard" href={`/casos/${c.slug}`} key={c.slug}>
              <div className="ccard-cover">
                <CaseCoverImg url={c.coverUrl} alt={c.title} slug={c.slug} city={c.city} era={c.era_year} />
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
    </>
  );
}
