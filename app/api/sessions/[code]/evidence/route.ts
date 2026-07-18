// ============================================================================
// GET /api/sessions/[code]/evidence — listado del expediente.
// Devuelve TODAS las piezas visibles a la variante con su `public_description`,
// marcando cuáles están abiertas (`open: true`). NUNCA incluye contenido.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { getSessionByCode, getEvidenceListing, processDueEvents } from '@/lib/server/game';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  await processDueEvents(ctx);
  const evidence = await getEvidenceListing(ctx);
  return NextResponse.json({ evidence });
}
