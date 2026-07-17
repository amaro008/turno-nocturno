// CRUD de sospechosos de un caso.  POST { op, data }
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { suspectSchema } from '@/lib/domain/schemas';

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
    await svc.from('suspects').delete().eq('id', id).eq('case_id', caseRow.id);
    await logAdminAction(admin.id, 'suspect_delete', 'suspect', id, {});
  } else if (op === 'reorder') {
    const ids = (data as { ids: string[] }).ids;
    await Promise.all(
      ids.map((id, i) => svc.from('suspects').update({ sort_order: i }).eq('id', id).eq('case_id', caseRow.id)),
    );
  } else {
    const parsed = suspectSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const s = parsed.data;
    if (op === 'create') {
      const { count } = await svc.from('suspects').select('*', { count: 'exact', head: true }).eq('case_id', caseRow.id);
      await svc.from('suspects').insert({
        case_id: caseRow.id,
        name: s.name,
        age: s.age ?? null,
        occupation: s.occupation ?? null,
        relation: s.relation ?? null,
        description: s.description ?? null,
        alibi: s.alibi ?? null,
        photo_path: s.photo_path ?? null,
        sort_order: count ?? 0,
      });
      await logAdminAction(admin.id, 'suspect_create', 'case', caseRow.id, { name: s.name });
    } else if (op === 'update' && s.id) {
      await svc
        .from('suspects')
        .update({
          name: s.name,
          age: s.age ?? null,
          occupation: s.occupation ?? null,
          relation: s.relation ?? null,
          description: s.description ?? null,
          alibi: s.alibi ?? null,
          photo_path: s.photo_path ?? null,
        })
        .eq('id', s.id)
        .eq('case_id', caseRow.id);
    }
  }

  const { data: list } = await svc
    .from('suspects')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('sort_order', { ascending: true });
  return NextResponse.json({ ok: true, suspects: list ?? [] });
}
