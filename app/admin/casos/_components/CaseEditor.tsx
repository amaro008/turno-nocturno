'use client';

import { useMemo, useState } from 'react';
import type { Case, Suspect, EvidenceItem, Variant, TimelineEvent } from '@/lib/domain';
import CaseGeneralForm from './CaseGeneralForm';
import SuspectsTab from './SuspectsTab';
import EvidenceTab from './EvidenceTab';
import VariantsTab from './VariantsTab';
import TimelineTab from './TimelineTab';
import MatrixTab from './MatrixTab';

type TabId = 'general' | 'sospechosos' | 'evidencias' | 'variantes' | 'timeline' | 'matriz';

export default function CaseEditor({
  caseRow,
  initialSuspects,
  initialEvidence,
  initialVariants,
  initialTimeline,
}: {
  caseRow: Case;
  initialSuspects: Suspect[];
  initialEvidence: EvidenceItem[];
  initialVariants: Variant[];
  initialTimeline: TimelineEvent[];
}) {
  const [tab, setTab] = useState<TabId>('general');
  const [suspects, setSuspects] = useState<Suspect[]>(initialSuspects);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);

  // ¿Cuántas evidencias no están validadas en la matriz para variantes existentes?
  const unvalidated = useMemo(() => {
    const vm = caseRow.validation_matrix ?? {};
    const codes = variants.filter((v) => v.active).map((v) => v.code);
    if (codes.length === 0) return 0;
    let count = 0;
    for (const e of evidence) {
      const row = vm[e.code] ?? {};
      const allChecked = codes.every((c) => row[c]?.consistent);
      if (!allChecked) count += 1;
    }
    return count;
  }, [caseRow.validation_matrix, evidence, variants]);

  const tabs: { id: TabId; label: string; n?: number; warn?: boolean }[] = [
    { id: 'general', label: 'General' },
    { id: 'sospechosos', label: 'Sospechosos', n: suspects.length },
    { id: 'evidencias', label: 'Evidencias', n: evidence.length },
    { id: 'variantes', label: 'Variantes', n: variants.length },
    { id: 'timeline', label: 'Timeline', n: timeline.length },
    { id: 'matriz', label: 'Matriz', warn: unvalidated > 0 },
  ];

  return (
    <div>
      <div className="ctabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={'ctab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
          >
            {t.label}
            {typeof t.n === 'number' && <span className="badge-n">{t.n}</span>}
            {t.warn && <span className="warn-dot" title="Hay evidencias sin validar" />}
          </button>
        ))}
      </div>

      {tab === 'general' && <CaseGeneralForm mode="edit" initial={caseRow} />}
      {tab === 'sospechosos' && (
        <SuspectsTab slug={caseRow.slug} suspects={suspects} setSuspects={setSuspects} />
      )}
      {tab === 'evidencias' && (
        <EvidenceTab slug={caseRow.slug} evidence={evidence} setEvidence={setEvidence} variants={variants} />
      )}
      {tab === 'variantes' && (
        <VariantsTab slug={caseRow.slug} variants={variants} setVariants={setVariants} suspects={suspects} />
      )}
      {tab === 'timeline' && (
        <TimelineTab slug={caseRow.slug} timeline={timeline} setTimeline={setTimeline} evidence={evidence} />
      )}
      {tab === 'matriz' && (
        <MatrixTab caseRow={caseRow} evidence={evidence} variants={variants} unvalidated={unvalidated} />
      )}
    </div>
  );
}
