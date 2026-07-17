// POST /api/sessions/[code]/notes — guarda las notas colaborativas de la mesa.
import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getSessionByCode } from '@/lib/server/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const { notes } = (await req.json()) as { notes?: string };
  const text = String(notes ?? '').slice(0, 20000);

  const svc = createServiceClient();
  await svc.from('sessions').update({ player_notes: text }).eq('id', ctx.session.id);
  return NextResponse.json({ ok: true });
}
