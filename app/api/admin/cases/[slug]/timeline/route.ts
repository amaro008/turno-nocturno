// CRUD de eventos temporales del caso.  POST { op, data }
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { timelineSchema } from '@/lib/domain/schemas';

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
    await svc.from('case_timeline').delete().eq('id', id).eq('case_id', caseRow.id);
    await logAdminAction(admin.id, 'timeline_delete', 'timeline', id, {});
  } else {
    const parsed = timelineSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const t = parsed.data;
    const row = {
      case_id: caseRow.id,
      minute: t.minute,
      action: t.action,
      variant_scope: t.variant_scope ?? null,
      payload: t.payload ?? {},
    };
    if (op === 'create') {
      const { error } = await svc.from('case_timeline').insert(row);
      if (error)
        return NextResponse.json(
          { error: error.code === '23505' ? 'duplicate_minute_action' : 'db', detail: error.message },
          { status: error.code === '23505' ? 409 : 500 },
        );
      await logAdminAction(admin.id, 'timeline_create', 'case', caseRow.id, { minute: t.minute, action: t.action });
    } else if (op === 'update' && t.id) {
      const { error } = await svc.from('case_timeline').update(row).eq('id', t.id).eq('case_id', caseRow.id);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });
    }
  }

  const { data: list } = await svc
    .from('case_timeline')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('minute', { ascending: true });
  return NextResponse.json({ ok: true, timeline: list ?? [] });
}
