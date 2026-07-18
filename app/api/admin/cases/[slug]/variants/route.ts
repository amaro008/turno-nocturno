// CRUD de variantes de un caso (máx 3).  POST { op, data }
// culprit_suspect_id debe pertenecer al caso; se denormaliza el nombre en `culprit`.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { variantSchema } from '@/lib/domain/schemas';

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
    await svc.from('variants').delete().eq('id', id).eq('case_id', caseRow.id);
    await logAdminAction(admin.id, 'variant_delete', 'variant', id, {});
  } else {
    const parsed = variantSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const v = parsed.data;

    // Validar que el culpable existe en este caso
    const { data: suspect } = await svc
      .from('suspects')
      .select('id, full_name')
      .eq('id', v.culprit_suspect_id)
      .eq('case_id', caseRow.id)
      .maybeSingle();
    if (!suspect) return NextResponse.json({ error: 'culprit_not_in_case' }, { status: 400 });

    const row = {
      case_id: caseRow.id,
      code: v.code,
      active: v.active,
      culprit: suspect.full_name,
      culprit_suspect_id: suspect.id,
      solution_narrative: v.solution_narrative,
      solution_voice_path: v.solution_voice_path ?? null,
      commander_context: v.commander_context,
      rubric: v.rubric,
    };
    if (op === 'create') {
      const { count } = await svc.from('variants').select('*', { count: 'exact', head: true }).eq('case_id', caseRow.id);
      if ((count ?? 0) >= 3) return NextResponse.json({ error: 'max_variants' }, { status: 409 });
      const { error } = await svc.from('variants').insert(row);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
      await logAdminAction(admin.id, 'variant_create', 'case', caseRow.id, { code: v.code });
    } else if (op === 'update' && v.id) {
      const { error } = await svc.from('variants').update(row).eq('id', v.id).eq('case_id', caseRow.id);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });
    }
  }

  const { data: list } = await svc
    .from('variants')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('code', { ascending: true });
  return NextResponse.json({ ok: true, variants: list ?? [] });
}
