import Link from 'next/link';
import { createServiceClient } from '@/lib/server/supabase';
import { AccessCodeStatus } from '@/lib/domain';
import { computeCodeTiming, formatRemaining } from '@/lib/engine/code-lifecycle';
import { resendCode, revokeCode } from '../actions';

export const dynamic = 'force-dynamic';

const STATUSES: (AccessCodeStatus | 'all')[] = ['all', 'draft', 'sent', 'redeemed', 'activated', 'completed', 'expired'];

interface Row {
  id: string;
  code: string;
  status: AccessCodeStatus;
  note: string | null;
  created_at: string;
  sent_at: string | null;
  activated_at: string | null;
  cases: { title: string } | null;
  profiles: { full_name: string; email: string } | null;
}

export default async function CodigosPage({
  searchParams,
}: {
  searchParams: { status?: string; ok?: string; error?: string; code?: string };
}) {
  const svc = createServiceClient();
  const filter = (searchParams.status as AccessCodeStatus) || 'all';

  let q = svc
    .from('access_codes')
    .select('id, code, status, note, created_at, sent_at, activated_at, cases(title), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (filter !== ('all' as AccessCodeStatus) && STATUSES.includes(filter)) {
    q = q.eq('status', filter);
  }
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <b>Códigos</b>
        </span>
      </div>
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        <div className="admin-h">
          <h1>Códigos de acceso</h1>
          <Link className="btn primary" href="/admin/codigos/nuevo">
            + Crear nuevo código
          </Link>
        </div>

        {searchParams.ok && (
          <div className="note-ok" style={{ marginBottom: 14 }}>
            {searchParams.ok}
            {searchParams.code && <> · <b className="mono">{searchParams.code}</b></>}
          </div>
        )}
        {searchParams.error && <div className="note-error" style={{ marginBottom: 14 }}>{searchParams.error}</div>}

        <div className="filters">
          {STATUSES.map((s) => (
            <Link key={s} href={s === 'all' ? '/admin/codigos' : `/admin/codigos?status=${s}`} className={filter === s || (s === 'all' && !searchParams.status) ? 'active' : ''}>
              {s}
            </Link>
          ))}
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario</th>
                <th>Caso</th>
                <th>Estado</th>
                <th>Expira</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">Sin códigos.</td>
                </tr>
              )}
              {rows.map((r) => {
                const timing = computeCodeTiming(r);
                return (
                  <tr key={r.id}>
                    <td className="code-cell">{r.code}</td>
                    <td>
                      {r.profiles?.full_name || '—'}
                      <div className="muted" style={{ fontSize: 11 }}>{r.profiles?.email}</div>
                    </td>
                    <td>{r.cases?.title ?? '—'}</td>
                    <td>{r.status}</td>
                    <td className="muted">
                      {['completed', 'expired'].includes(r.status) ? '—' : formatRemaining(timing.msRemaining)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['draft', 'sent', 'redeemed'].includes(r.status) && (
                          <form action={resendCode}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }}>
                              {r.status === 'draft' ? 'Enviar' : 'Reenviar'}
                            </button>
                          </form>
                        )}
                        {['draft', 'sent', 'redeemed'].includes(r.status) && (
                          <form action={revokeCode}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--alert)' }}>
                              Revocar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
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
