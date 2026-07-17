import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/server/supabase';
import { computeCodeTiming } from '@/lib/engine/code-lifecycle';
import { AccessCodeStatus } from '@/lib/domain';
import { redeemCode } from './actions';
import Countdown from './_components/Countdown';
import EmptyState from '@/components/EmptyState';

export const metadata = { title: 'Mi biblioteca · Turno Nocturno' };
export const dynamic = 'force-dynamic';

interface CodeRow {
  id: string;
  code: string;
  status: AccessCodeStatus;
  created_at: string;
  sent_at: string | null;
  activated_at: string | null;
  cases: { title: string; city: string; era_year: number; slug: string } | null;
}

const STATUS_LABEL: Record<AccessCodeStatus, string> = {
  draft: 'Borrador',
  sent: 'Por canjear',
  redeemed: 'Listo para jugar',
  activated: 'En curso',
  in_progress: 'En curso',
  completed: 'Sesión jugada',
  expired: 'Expirado',
};

function caseNumber(slug?: string) {
  return slug?.split('-')[0] ?? '001';
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { error?: string; ok?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('access_codes')
    .select('id, code, status, created_at, sent_at, activated_at, cases(title, city, era_year, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const codes = (data ?? []) as unknown as CodeRow[];

  return (
    <main className="wrap lib">
      <div className="lib-head">
        <div>
          <span className="kicker">Tu cuenta</span>
          <h1>Mi biblioteca</h1>
          <p>Tus códigos canjeados y sesiones. Activa cuando tu mesa esté lista.</p>
        </div>
      </div>

      {searchParams.error && <div className="note-error" style={{ marginBottom: 16 }}>{searchParams.error}</div>}
      {searchParams.ok && <div className="note-ok" style={{ marginBottom: 16 }}>{searchParams.ok}</div>}

      <div className="redeem-box">
        <form action={redeemCode}>
          <input className="input" name="code" placeholder="TN-XXXX-XXXX" aria-label="Código de acceso" />
          <button className="btn primary" type="submit">Canjear código</button>
        </form>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          ¿Recibiste un código por correo? Pégalo aquí.
        </span>
      </div>

      {codes.length === 0 ? (
        <div style={{ marginTop: 26 }}>
          <EmptyState
            ill="folder"
            title="Tu biblioteca está vacía"
            message="Cuando canjees un código de acceso, tu caso aparecerá aquí listo para activar."
          />
        </div>
      ) : (
        <div className="lib-grid">
          {codes.map((c) => {
            const timing = computeCodeTiming(c);
            const expired = c.status === 'expired' || (timing.isExpired && ['sent', 'redeemed'].includes(c.status));
            const status: AccessCodeStatus = expired ? 'expired' : c.status;
            return (
              <article className="lib-card" key={c.id}>
                <div className="lib-cover">
                  <span className="cno mono">{caseNumber(c.cases?.slug)}</span>
                  <span className="cplace">
                    {c.cases?.city} · {c.cases?.era_year}
                  </span>
                </div>
                <div className="lib-body">
                  <h3>{c.cases?.title ?? 'Caso'}</h3>
                  <span className="lib-code mono">{c.code}</span>
                  <div className="lib-status-row">
                    <span
                      className={
                        'badge-state ' +
                        (status === 'redeemed'
                          ? 'on'
                          : status === 'activated' || status === 'in_progress'
                            ? 'teal'
                            : status === 'expired'
                              ? 'alert'
                              : 'soon')
                      }
                    >
                      {STATUS_LABEL[status]}
                    </span>
                    {!expired && status !== 'completed' && <Countdown expiresAt={timing.effectiveExpiresAt.toISOString()} />}
                  </div>

                  <div className="lib-actions">
                    {status === 'sent' && (
                      <form action={redeemCode}>
                        <input type="hidden" name="code" value={c.code} />
                        <button className="btn primary block" type="submit">Canjear</button>
                      </form>
                    )}
                    {status === 'redeemed' && (
                      <Link className="btn primary block" href={`/s/${c.code}/briefing`}>
                        Activar sesión
                      </Link>
                    )}
                    {(status === 'activated' || status === 'in_progress') && (
                      <Link className="btn primary block" href={`/s/${c.code}`}>
                        Entrar a la sesión
                      </Link>
                    )}
                    {status === 'completed' && (
                      <Link className="btn ghost block" href={`/s/${c.code}`}>
                        Ver resultado
                      </Link>
                    )}
                    {status === 'expired' && (
                      <button className="btn ghost block" disabled>
                        Expirado
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
