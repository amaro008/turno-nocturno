// CRUD de personajes (sospechosos + víctima) de un caso.  POST { op, data }
// Incluye la data por variante (suspect_variant_data) y sincroniza el culpable.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { logAdminAction } from '@/lib/server/admin-audit';
import { signedUrl } from '@/lib/server/storage';
import { suspectSchema } from '@/lib/domain/schemas';

export const dynamic = 'force-dynamic';

type VariantDataInput = {
  variant_id: string;
  alibi_declared?: string | null;
  motive_apparent?: string | null;
  variant_specific_notes?: string | null;
  is_culprit_in_variant?: boolean;
};

/** Lista de personajes con su data por variante embebida. */
async function listSuspects(svc: ReturnType<typeof createServiceClient>, caseId: string) {
  const { data: suspects } = await svc
    .from('suspects')
    .select('*')
    .eq('case_id', caseId)
    .order('sort_order', { ascending: true });
  const ids = (suspects ?? []).map((s) => s.id);
  const { data: vd } = ids.length
    ? await svc.from('suspect_variant_data').select('*').in('suspect_id', ids)
    : { data: [] as { suspect_id: string }[] };
  const byS = new Map<string, unknown[]>();
  for (const r of vd ?? []) {
    const arr = byS.get(r.suspect_id) ?? [];
    arr.push(r);
    byS.set(r.suspect_id, arr);
  }
  return Promise.all(
    (suspects ?? []).map(async (s) => ({
      ...s,
      variant_data: byS.get(s.id) ?? [],
      photoUrl: await signedUrl(s.photo_path),
    })),
  );
}

/** Upsert de la data por variante + sincroniza el culpable en `variants`. */
async function syncVariantData(
  svc: ReturnType<typeof createServiceClient>,
  caseId: string,
  suspectId: string,
  suspectName: string,
  rows: VariantDataInput[],
) {
  for (const r of rows) {
    await svc.from('suspect_variant_data').upsert(
      {
        suspect_id: suspectId,
        variant_id: r.variant_id,
        alibi_declared: r.alibi_declared ?? null,
        motive_apparent: r.motive_apparent ?? null,
        variant_specific_notes: r.variant_specific_notes ?? null,
        is_culprit_in_variant: r.is_culprit_in_variant ?? false,
      },
      { onConflict: 'suspect_id,variant_id' },
    );
    if (r.is_culprit_in_variant) {
      // Fuente de verdad del culpable: variants. Sincroniza y limpia a los demás.
      await svc.from('variants').update({ culprit_suspect_id: suspectId, culprit: suspectName }).eq('id', r.variant_id).eq('case_id', caseId);
      await svc
        .from('suspect_variant_data')
        .update({ is_culprit_in_variant: false })
        .eq('variant_id', r.variant_id)
        .neq('suspect_id', suspectId);
    }
  }
}

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
    await Promise.all(ids.map((id, i) => svc.from('suspects').update({ sort_order: i }).eq('id', id).eq('case_id', caseRow.id)));
  } else {
    const parsed = suspectSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
    const s = parsed.data;
    const fields = {
      full_name: s.full_name,
      age: s.age ?? null,
      occupation: s.occupation ?? null,
      relationship_to_victim: s.relationship_to_victim ?? null,
      photo_path: s.photo_path ?? null,
      physical_description: s.physical_description ?? '',
      distinctive_features: s.distinctive_features ?? '',
      accent_or_speech: s.accent_or_speech ?? null,
      typical_attire: s.typical_attire ?? null,
      is_victim: s.is_victim ?? false,
      internal_notes: s.internal_notes ?? null,
      image_prompt: s.image_prompt ?? '',
    };
    let suspectId = s.id ?? null;
    if (op === 'create') {
      const { count } = await svc.from('suspects').select('*', { count: 'exact', head: true }).eq('case_id', caseRow.id);
      const { data: ins } = await svc.from('suspects').insert({ ...fields, case_id: caseRow.id, sort_order: count ?? 0 }).select('id').single();
      suspectId = ins?.id ?? null;
      await logAdminAction(admin.id, 'suspect_create', 'case', caseRow.id, { name: s.full_name });
    } else if (op === 'update' && s.id) {
      await svc.from('suspects').update(fields).eq('id', s.id).eq('case_id', caseRow.id);
    }
    if (suspectId && s.variant_data?.length) {
      await syncVariantData(svc, caseRow.id, suspectId, s.full_name, s.variant_data);
    }
  }

  return NextResponse.json({ ok: true, suspects: await listSuspects(svc, caseRow.id) });
}
