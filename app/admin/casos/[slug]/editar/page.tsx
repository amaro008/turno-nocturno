import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/server/supabase';
import { loadCaseEvidenceBase, assembleEvidence } from '@/lib/server/evidence';
import CaseEditor from '../../_components/CaseEditor';
import type { Case, SuspectFull, EvidenceFull, Variant, TimelineEvent } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export default async function EditarCasoPage({ params }: { params: { slug: string } }) {
  const svc = createServiceClient();
  const { data: caseRow } = await svc.from('cases').select('*').eq('slug', params.slug).maybeSingle();
  if (!caseRow) notFound();

  const [{ data: suspects }, evidence, { data: variants }, { data: timeline }] = await Promise.all([
    svc.from('suspects').select('*').eq('case_id', caseRow.id).order('sort_order', { ascending: true }),
    assembleEvidence(await loadCaseEvidenceBase(caseRow.id)),
    svc.from('variants').select('*').eq('case_id', caseRow.id).order('code', { ascending: true }),
    svc.from('case_timeline').select('*').eq('case_id', caseRow.id).order('minute', { ascending: true }),
  ]);

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
          initialSuspects={(suspects ?? []) as SuspectFull[]}
          initialEvidence={evidence as EvidenceFull[]}
          initialVariants={(variants ?? []) as Variant[]}
          initialTimeline={(timeline ?? []) as TimelineEvent[]}
        />
      </div>
    </>
  );
}
