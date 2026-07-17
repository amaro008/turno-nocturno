// PATCH /api/admin/suspects/[id]/prompt — actualiza descripción física, rasgos
// distintivos e image_prompt de un sospechoso.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { logAdminAction } from '@/lib/server/admin-audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  physical_description: z.string().max(2000).optional(),
  distinctive_features: z.string().max(2000).optional(),
  image_prompt: z.string().max(4000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const svc = createServiceClient();
  const { data: suspect } = await svc.from('suspects').select('id').eq('id', params.id).maybeSingle();
  if (!suspect) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error } = await svc.from('suspects').update(parsed.data).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'suspect_prompt_update', 'suspect', params.id, { fields: Object.keys(parsed.data) });
  return NextResponse.json({ ok: true });
}
