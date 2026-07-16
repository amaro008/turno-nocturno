import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { getSessionByCode, processDueEvents } from '@/lib/server/game';
import { secondsRemaining } from '@/lib/engine/timeline';

export const dynamic = 'force-dynamic';

// Polling del cliente (cada 30 s): dispara eventos temporales vencidos.
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const fired = await processDueEvents(ctx);
  const secs = ctx.session.activated_at
    ? secondsRemaining(ctx.session.activated_at, ctx.caseRow.time_limit_min)
    : ctx.caseRow.time_limit_min * 60;

  return NextResponse.json({ fired, secondsRemaining: secs });
}
