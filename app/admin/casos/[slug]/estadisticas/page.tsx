import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function CaseStatsPage({ params }: { params: { slug: string } }) {
  const svc = createServiceClient();
  const { data: caseRow } = await svc.from('cases').select('id, title, slug').eq('slug', params.slug).maybeSingle();
  if (!caseRow) notFound();

  const [{ data: sessions }, { data: variants }] = await Promise.all([
    svc.from('sessions').select('id, variant_id, status').eq('case_id', caseRow.id),
    svc.from('variants').select('id, code, culprit').eq('case_id', caseRow.id),
  ]);

  const sessRows = sessions ?? [];
  const { data: verdicts } = await svc
    .from('verdicts')
    .select('session_id, culprit_correct, total_score')
    .in('session_id', sessRows.length ? sessRows.map((s) => s.id) : ['00000000-0000-0000-0000-000000000000']);

  const total = sessRows.length;
  const resolved = sessRows.filter((s) => s.status === 'resolved').length;
  const correct = (verdicts ?? []).filter((v) => v.culprit_correct).length;
  const avgScore =
    verdicts && verdicts.length ? Math.round(verdicts.reduce((a, v) => a + v.total_score, 0) / verdicts.length) : 0;

  const byVariant = new Map<string, number>();
  sessRows.forEach((s) => s.variant_id && byVariant.set(s.variant_id, (byVariant.get(s.variant_id) ?? 0) + 1));

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <Link href="/admin/casos">Casos</Link> / <b>{caseRow.title}</b> / Estadísticas
        </span>
      </div>
      <div className="admin-content">
        <div className="admin-h">
          <h1>Estadísticas · {caseRow.title}</h1>
          <Link className="btn ghost" href={`/admin/casos/${caseRow.slug}/editar`}>Editar caso</Link>
        </div>

        <div className="metrics">
          <div className="metric"><div className="m-l">Sesiones jugadas</div><div className="m-v mono">{total}</div><div className="m-sub">{resolved} resueltas</div></div>
          <div className="metric"><div className="m-l">Aciertos de culpable</div><div className="m-v mono">{correct}</div><div className="m-sub">de {verdicts?.length ?? 0} veredictos</div></div>
          <div className="metric"><div className="m-l">Puntaje promedio</div><div className="m-v mono">{avgScore}</div><div className="m-sub">/ 100</div></div>
        </div>

        <div className="admin-h"><h1 style={{ fontSize: 18 }}>Por variante</h1></div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Variante</th><th>Culpable</th><th>Veces sorteada</th></tr></thead>
            <tbody>
              {(variants ?? []).map((v) => (
                <tr key={v.id}>
                  <td>{v.code}</td>
                  <td>{v.culprit}</td>
                  <td className="mono">{byVariant.get(v.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
