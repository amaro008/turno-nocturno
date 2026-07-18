// ============================================================================
// EVIDENCE UNLOCK — Desbloqueo de evidencia por código (input del Expediente).
// Compatibilidad con la dinámica futura de códigos impresos.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getSessionByCode, getCatalog, getDeliveredCodes } from '@/lib/server/game';
import { deliverEvidence } from '@/lib/server/game';
import { minutesElapsed } from '@/lib/engine/timeline';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const { code, evidence_code } = (await req.json()) as { code?: string; evidence_code?: string };
  if (!code || !evidence_code) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const ctx = await getSessionByCode(code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const target = evidence_code.trim().toUpperCase();
  const variantSuffix = `-${ctx.variant.code.toUpperCase()}`;
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;

  // Catálogo visible (shared + variante sorteada). El jugador puede escribir el
  // código SIN sufijo de variante: se resuelve a `{code}-{variante}` de su sesión.
  const catalog = await getCatalog(ctx.caseRow.id, ctx.variant.id);
  const svc = createServiceClient();

  const item =
    catalog.find((e) => e.code.toUpperCase() === target) ??
    catalog.find((e) => e.code.toUpperCase() === target + variantSuffix);

  if (!item) {
    await svc.from('session_events').insert({
      session_id: ctx.session.id,
      type: 'evidence_requested',
      payload: { code: target, result: 'invalid' },
    });
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 200 });
  }

  const delivered = await getDeliveredCodes(ctx.session.id);
  if (delivered.includes(item.code)) {
    // NUNCA devolver el `code` (revelaría la variante). Solo id + título.
    return NextResponse.json({ ok: true, already: true, item: { id: item.id, title: item.title } });
  }

  const res = await deliverEvidence(ctx, item.code, { elapsedMin });
  if (!res.ok) return NextResponse.json({ ok: false, reason: res.reason }, { status: 200 });

  return NextResponse.json({ ok: true, item: res.item }); // res.item ya no incluye code
}
