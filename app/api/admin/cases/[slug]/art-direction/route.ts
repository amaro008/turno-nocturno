// GET  — trae toda la data de arte del caso (case + suspects + visualPrompts).
// PATCH — actualiza la dirección de arte del caso.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { signedUrl, SESSION_MEDIA_TTL } from '@/lib/server/storage';
import { artDirectionSchema } from '@/lib/domain/schemas';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const caseRow = await getCaseBySlug(params.slug);
  if (!caseRow) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const svc = createServiceClient();
  const [{ data: suspects }, { data: variants }, { data: visual }] = await Promise.all([
    svc.from('suspects').select('*').eq('case_id', caseRow.id).order('sort_order', { ascending: true }),
    svc.from('variants').select('id, code, culprit').eq('case_id', caseRow.id).order('code'),
    svc.from('case_visual_prompts').select('*').eq('case_id', caseRow.id).order('slot_name'),
  ]);

  const suspectsOut = await Promise.all(
    (suspects ?? []).map(async (s) => ({ ...s, photoUrl: await signedUrl(s.photo_path, SESSION_MEDIA_TTL) })),
  );
  const visualOut = await Promise.all(
    (visual ?? []).map(async (v) => ({ ...v, assetUrl: await signedUrl(v.generated_asset_path, SESSION_MEDIA_TTL) })),
  );

  return NextResponse.json({
    ok: true,
    case: {
      slug: caseRow.slug,
      title: caseRow.title,
      city: caseRow.city,
      era_year: caseRow.era_year,
      active: caseRow.active,
      art_direction: caseRow.art_direction,
      cover_image_prompt: caseRow.cover_image_prompt,
      hero_image_prompt: caseRow.hero_image_prompt,
      art_autoinject: caseRow.art_autoinject,
      cover_image_path: caseRow.cover_image_path,
      atmosphere_image_path: caseRow.atmosphere_image_path,
    },
    suspects: suspectsOut,
    variants: variants ?? [],
    visualPrompts: visualOut,
  });
}

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const caseRow = await getCaseBySlug(params.slug);
  if (!caseRow) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const parsed = artDirectionSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc.from('cases').update(parsed.data).eq('id', caseRow.id);
  if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'art_direction_update', 'case', caseRow.id, { fields: Object.keys(parsed.data) });
  return NextResponse.json({ ok: true });
}
