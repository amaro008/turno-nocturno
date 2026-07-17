import Link from 'next/link';
import { createServiceClient } from '@/lib/server/supabase';
import { toggleCaseActive } from './actions';

export const dynamic = 'force-dynamic';

interface CaseRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  era_year: number;
  era_profile: string;
  active: boolean;
}

export default async function CasosAdminPage() {
  const svc = createServiceClient();
  const { data: cases } = await svc
    .from('cases')
    .select('id, slug, title, city, era_year, era_profile, active')
    .order('slug', { ascending: true });

  const rows = (cases ?? []) as CaseRow[];

  // Contadores por caso (variantes activas + sesiones jugadas)
  const [{ data: variants }, { data: sessions }] = await Promise.all([
    svc.from('variants').select('case_id, active'),
    svc.from('sessions').select('case_id'),
  ]);
  const activeVariants = new Map<string, number>();
  (variants ?? []).forEach((v) => {
    if (v.active) activeVariants.set(v.case_id, (activeVariants.get(v.case_id) ?? 0) + 1);
  });
  const playCount = new Map<string, number>();
  (sessions ?? []).forEach((s) => playCount.set(s.case_id, (playCount.get(s.case_id) ?? 0) + 1));

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <b>Casos</b>
        </span>
      </div>
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        <div className="admin-h">
          <h1>Casos</h1>
          <Link className="btn primary" href="/admin/casos/nuevo">
            + Nuevo caso
          </Link>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Ciudad</th>
                <th>Época</th>
                <th>Estado</th>
                <th>Variantes</th>
                <th>Sesiones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">Aún no hay casos. Crea el primero.</td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.title}</b>
                    <div className="muted" style={{ fontSize: 11 }}>{c.slug}</div>
                  </td>
                  <td>{c.city}</td>
                  <td className="muted">{c.era_year} · {c.era_profile}</td>
                  <td>
                    <span className={'badge-state ' + (c.active ? 'on' : 'soon')}>
                      {c.active ? 'Activo' : 'Borrador'}
                    </span>
                  </td>
                  <td className="mono">{activeVariants.get(c.id) ?? 0}</td>
                  <td className="mono">{playCount.get(c.id) ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} href={`/admin/casos/${c.slug}/editar`}>
                        Editar
                      </Link>
                      <Link className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} href={`/admin/casos/${c.slug}/estadisticas`}>
                        Estadísticas
                      </Link>
                      <form action={toggleCaseActive}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="next" value={(!c.active).toString()} />
                        <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12, color: c.active ? 'var(--alert)' : 'var(--teal)' }}>
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
