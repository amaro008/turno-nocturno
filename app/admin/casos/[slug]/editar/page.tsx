import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/server/supabase';
import { loadCaseEvidenceBase, assembleEvidence } from '@/lib/server/evidence';
import CaseEditor from '../../_components/CaseEditor';
import type { Case, SuspectWithVariants, EvidenceFull, Variant, TimelineEvent } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export default async function EditarCasoPage({ params }: { params: { slug: string } }) {
  const svc = createServiceClient();
  const { data: caseRow } = await svc.from('cases').select('*').eq('slug', params.slug).maybeSingle();
  if (!caseRow) notFound();

  const [{ data: suspectRows }, evidence, { data: variants }, { data: timeline }] = await Promise.all([
    svc.from('suspects').select('*').eq('case_id', caseRow.id).order('sort_order', { ascending: true }),
    assembleEvidence(await loadCaseEvidenceBase(caseRow.id)),
    svc.from('variants').select('*').eq('case_id', caseRow.id).order('code', { ascending: true }),
    svc.from('case_timeline').select('*').eq('case_id', caseRow.id).order('minute', { ascending: true }),
  ]);

  // Embebe la data por variante en cada personaje (admin-only).
  const suspectIds = (suspectRows ?? []).map((s) => s.id);
  const { data: vd } = suspectIds.length
    ? await svc.from('suspect_variant_data').select('*').in('suspect_id', suspectIds)
    : { data: [] as { suspect_id: string }[] };
  const vdBySuspect = new Map<string, unknown[]>();
  for (const r of vd ?? []) {
    const arr = vdBySuspect.get(r.suspect_id) ?? [];
    arr.push(r);
    vdBySuspect.set(r.suspect_id, arr);
  }
  const suspects = (suspectRows ?? []).map((s) => ({ ...s, variant_data: vdBySuspect.get(s.id) ?? [] }));

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <Link href="/admin/casos">Casos</Link> / <b>{caseRow.title}</b>
        </span>
      </div>
      <div className="admin-content" style={{ maxWidth: 1000 }}>
        <div className="admin-h">
          <h1>{caseRow.title}</h1>
          <span className={'badge-state ' + (caseRow.active ? 'on' : 'soon')}>
            {caseRow.active ? 'Activo' : 'Borrador'}
          </span>
        </div>

        <CaseEditor
          caseRow={caseRow as Case}
          initialSuspects={suspects as SuspectWithVariants[]}
          initialEvidence={evidence as EvidenceFull[]}
          initialVariants={(variants ?? []) as Variant[]}
          initialTimeline={(timeline ?? []) as TimelineEvent[]}
        />
      </div>
    </>
  );
}
