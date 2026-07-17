// CRUD de case_visual_prompts.  POST { op, data }
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { signedUrl, SESSION_MEDIA_TTL } from '@/lib/server/storage';
import { visualPromptSchema } from '@/lib/domain/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const caseRow = await getCaseBySlug(params.slug);
  if (!caseRow) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const svc = createServiceClient();
  const { op, data } = (await req.json()) as { op: string; data: unknown };

  if (op === 'delete') {
    const id = (data as { id: string }).id;
    await svc.from('case_visual_prompts').delete().eq('id', id).eq('case_id', caseRow.id);
    await logAdminAction(admin.id, 'visual_prompt_delete', 'visual_prompt', id, {});
  } else {
    const parsed = visualPromptSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const v = parsed.data;
    const row = {
      case_id: caseRow.id,
      variant_id: v.variant_id ?? null,
      slot_name: v.slot_name,
      media_kind: v.media_kind,
      prompt: v.prompt,
      negative_prompt: v.negative_prompt,
      technical_params: v.technical_params,
      reference_notes: v.reference_notes,
      generated_asset_path: v.generated_asset_path ?? null,
      status: v.status,
    };
    if (op === 'create') {
      const { error } = await svc.from('case_visual_prompts').insert(row);
      if (error) return NextResponse.json({ error: error.code === '23505' ? 'slot_taken' : 'db', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
      await logAdminAction(admin.id, 'visual_prompt_create', 'case', caseRow.id, { slot: v.slot_name });
    } else if (op === 'update' && v.id) {
      const { error } = await svc.from('case_visual_prompts').update(row).eq('id', v.id).eq('case_id', caseRow.id);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });
    }
  }

  const { data: list } = await svc.from('case_visual_prompts').select('*').eq('case_id', caseRow.id).order('slot_name');
  const out = await Promise.all((list ?? []).map(async (v) => ({ ...v, assetUrl: await signedUrl(v.generated_asset_path, SESSION_MEDIA_TTL) })));
  return NextResponse.json({ ok: true, visualPrompts: out });
}
