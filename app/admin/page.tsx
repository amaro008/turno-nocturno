import { createServiceClient } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

function weekAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function count(table: string, build: (q: any) => any) {
  const svc = createServiceClient();
  const { count } = await build(svc.from(table).select('*', { count: 'exact', head: true }));
  return count ?? 0;
}

export default async function AdminDashboard() {
  const svc = createServiceClient();
  const weekAgo = weekAgoIso();

  const [users, usersWeek, sent, activeCodes, sessions] = await Promise.all([
    count('profiles', (q) => q),
    count('profiles', (q) => q.gte('created_at', weekAgo)),
    count('access_codes', (q) => q.eq('status', 'sent')),
    count('access_codes', (q) => q.in('status', ['activated', 'in_progress'])),
    svc
      .from('sessions')
      .select('id, status, variant_id, created_at, case_id, user_id')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const rows = sessions.data ?? [];
  const { data: verdicts } = await svc
    .from('verdicts')
    .select('session_id, culprit_correct, total_score')
    .in(
      'session_id',
      rows.map((r) => r.id),
    );
  const vByS = new Map((verdicts ?? []).map((v) => [v.session_id, v]));

  // Enriquecer con nombres
  const caseIds = Array.from(new Set(rows.map((r) => r.case_id)));
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [{ data: cases }, { data: profiles }] = await Promise.all([
    svc.from('cases').select('id, title').in('id', caseIds.length ? caseIds : ['00000000-0000-0000-0000-000000000000']),
    svc.from('profiles').select('id, full_name, email').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
  ]);
  const caseName = new Map((cases ?? []).map((c) => [c.id, c.title]));
  const userName = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <b>Dashboard</b>
        </span>
      </div>
      <div className="admin-content">
        <div className="metrics">
          <div className="metric">
            <div className="m-l">Usuarios registrados</div>
            <div className="m-v mono">{users}</div>
            <div className="m-sub">+{usersWeek} esta semana</div>
          </div>
          <div className="metric">
            <div className="m-l">Códigos por canjear</div>
            <div className="m-v mono">{sent}</div>
            <div className="m-sub">status = sent</div>
          </div>
          <div className="metric">
            <div className="m-l">Sesiones vivas</div>
            <div className="m-v mono">{activeCodes}</div>
            <div className="m-sub">activadas / en curso</div>
          </div>
          <div className="metric">
            <div className="m-l">Sesiones recientes</div>
            <div className="m-v mono">{rows.length}</div>
            <div className="m-sub">últimas 10</div>
          </div>
        </div>

        <div className="admin-h">
          <h1>Últimas sesiones</h1>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Caso</th>
                <th>Estado</th>
                <th>Veredicto</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">Aún no hay sesiones.</td>
                </tr>
              )}
              {rows.map((r) => {
                const v = vByS.get(r.id);
                return (
                  <tr key={r.id}>
                    <td className="muted">{new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{userName.get(r.user_id) ?? '—'}</td>
                    <td>{caseName.get(r.case_id) ?? '—'}</td>
                    <td>{r.status}</td>
                    <td>{v ? (v.culprit_correct ? `✓ ${v.total_score}` : `✕ ${v.total_score}`) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
