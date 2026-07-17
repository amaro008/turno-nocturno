// POST /api/admin/cases — crear caso
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { logAdminAction } from '@/lib/server/admin-audit';
import { caseGeneralSchema } from '@/lib/domain/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = caseGeneralSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
  }
  const c = parsed.data;
  const svc = createServiceClient();

  const { data: clash } = await svc.from('cases').select('id').eq('slug', c.slug).maybeSingle();
  if (clash) return NextResponse.json({ error: 'slug_taken' }, { status: 409 });

  const { data, error } = await svc
    .from('cases')
    .insert({
      slug: c.slug,
      title: c.title,
      synopsis: c.synopsis,
      city: c.city,
      era_year: c.era_year,
      era_profile: c.era_profile,
      time_limit_min: c.time_limit_min,
      price_ref_mxn: c.price_ref_mxn ?? null,
      active: c.active,
      briefing_voice_path: c.briefing_voice_path ?? null,
    })
    .select('id, slug')
    .single();

  if (error || !data) return NextResponse.json({ error: 'db' }, { status: 500 });

  await logAdminAction(admin.id, 'case_create', 'case', data.id, { slug: data.slug });
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}
