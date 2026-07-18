// ============================================================================
// GET /api/sessions/[code]/evidence/[ecode] — detalle de una pieza.
// Devuelve el contenido completo SOLO si la pieza está abierta en esta sesión.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { getSessionByCode, getEvidenceDetail, processDueEvents } from '@/lib/server/game';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string; ecode: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  await processDueEvents(ctx);
  const item = await getEvidenceDetail(ctx, params.ecode);
  if (!item) return NextResponse.json({ error: 'locked' }, { status: 404 });
  return NextResponse.json({ item });
}
