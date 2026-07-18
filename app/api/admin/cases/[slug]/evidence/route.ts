// CRUD de evidencias de un caso.  POST { op, data }
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { evidenceSchema } from '@/lib/domain/schemas';
import { upsertEvidenceContent, pruneOtherContent, loadCaseEvidenceBase, assembleEvidence } from '@/lib/server/evidence';

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
    await svc.from('evidence_items').delete().eq('id', id).eq('case_id', caseRow.id); // cascade borra el contenido
    await logAdminAction(admin.id, 'evidence_delete', 'evidence', id, {});
  } else {
    const parsed = evidenceSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const e = parsed.data;
    const row = {
      case_id: caseRow.id,
      code: e.code,
      type: e.type,
      scope: e.scope,
      variant_id: e.scope === 'variant' ? e.variant_id ?? null : null,
      title: e.title,
      public_description: e.public_description,
      admin_notes: e.admin_notes,
      initial: e.initial,
      unlocked_at_minute: e.initial ? null : e.unlocked_at_minute ?? null,
      unlocked_by_event_id: e.unlocked_by_event_id ?? null,
      is_report: e.is_report ?? false,
    };
    let evidenceId = e.id ?? null;
    if (op === 'create') {
      const { data: ins, error } = await svc.from('evidence_items').insert(row).select('id').single();
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
      evidenceId = ins.id;
      await logAdminAction(admin.id, 'evidence_create', 'case', caseRow.id, { code: e.code });
    } else if (op === 'update' && e.id) {
      const { error } = await svc.from('evidence_items').update(row).eq('id', e.id).eq('case_id', caseRow.id);
      if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });
    }
    if (evidenceId) {
      await upsertEvidenceContent(evidenceId, e.type, e.content);
      await pruneOtherContent(evidenceId, e.type);
    }
  }

  // Devuelve el catálogo ensamblado (base + contenido) para el admin.
  const bases = await loadCaseEvidenceBase(caseRow.id);
  const evidence = await assembleEvidence(bases);
  return NextResponse.json({ ok: true, evidence });
}
