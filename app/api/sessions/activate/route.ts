// ============================================================================
// POST /api/sessions/activate — Arranca el turno (crea la sesión).
// Requiere confirmación explícita (confirm: true) desde el briefing.
// Aquí ocurre el sorteo de variante y arranca `activated_at`: NO antes.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { canActivate } from '@/lib/engine/code-lifecycle';
import { sortitionVariant } from '@/lib/engine/variant-sortition';
import { SESSION_WINDOW_HOURS } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const { code, confirm } = (await req.json()) as { code?: string; confirm?: boolean };
  if (!code) return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  if (confirm !== true) return NextResponse.json({ error: 'confirm-required' }, { status: 400 });

  const svc = createServiceClient();
  const { data: ac } = await svc.from('access_codes').select('*').eq('code', code.toUpperCase()).maybeSingle();

  if (!ac || ac.user_id !== user.id) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // Idempotente: si ya está activado, solo entra al juego.
  if (ac.status === 'activated' || ac.status === 'in_progress') {
    return NextResponse.json({ ok: true, code: ac.code });
  }
  if (!canActivate(ac)) {
    return NextResponse.json({ error: 'expired' }, { status: 409 });
  }

  // Sorteo de variante activa
  const { data: variants } = await svc.from('variants').select('id, active').eq('case_id', ac.case_id);
  if (!variants || variants.filter((v) => v.active).length === 0) {
    return NextResponse.json({ error: 'no-variants' }, { status: 409 });
  }
  const variantId = sortitionVariant(variants);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_WINDOW_HOURS * 60 * 60 * 1000);

  const { data: session, error: sErr } = await svc
    .from('sessions')
    .insert({
      access_code_id: ac.id,
      user_id: user.id,
      case_id: ac.case_id,
      variant_id: variantId,
      status: 'activated',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  await svc
    .from('access_codes')
    .update({ status: 'activated', activated_at: now.toISOString(), session_id: session.id })
    .eq('id', ac.id);

  return NextResponse.json({ ok: true, code: ac.code });
}
