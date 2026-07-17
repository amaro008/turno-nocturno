// CRUD de evidencias de un caso.  POST { op, data }
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { evidenceSchema } from '@/lib/domain/schemas';

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
    await svc.from('evidence_items').delete().eq('id', id).eq('case_id', caseRow.id);
    await logAdminAction(admin.id, 'evidence_delete', 'evidence', id, {});
  } else {
    const parsed = evidenceSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const e = parsed.data;
    const row = {
      case_id: caseRow.id,
      code: e.code,
      kind: e.kind,
      scope: e.scope,
      variant_id: e.scope === 'variant' ? e.variant_id ?? null : null,
      title: e.title,
      body_md: e.body_md ?? null,
      media_path: e.media_path ?? null,
      transcript: e.transcript ?? null,
      unlocked_by: e.unlocked_by ?? [],
      deliverable_from_minute: e.deliverable_from_minute,
      delivery: e.delivery,
    };
    if (op === 'create') {
      const { error } = await svc.from('evidence_items').insert(row);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
      await logAdminAction(admin.id, 'evidence_create', 'case', caseRow.id, { code: e.code });
    } else if (op === 'update' && e.id) {
      const { error } = await svc.from('evidence_items').update(row).eq('id', e.id).eq('case_id', caseRow.id);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });
    }
  }

  const { data: list } = await svc
    .from('evidence_items')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('code', { ascending: true });
  return NextResponse.json({ ok: true, evidence: list ?? [] });
}
