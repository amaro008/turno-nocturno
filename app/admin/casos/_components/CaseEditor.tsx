'use client';

import { useState } from 'react';
import type { Case, SuspectWithVariants, EvidenceFull, Variant, TimelineEvent } from '@/lib/domain';
import GeneralTab from './GeneralTab';
import PersonajesTab from './PersonajesTab';
import EvidenciasTab from './EvidenciasTab';
import GuionTab from './GuionTab';

type TabId = 'general' | 'personajes' | 'evidencias' | 'guion';

export default function CaseEditor({
  caseRow,
  initialSuspects,
  initialEvidence,
  initialVariants,
  initialTimeline,
}: {
  caseRow: Case;
  initialSuspects: SuspectWithVariants[];
  initialEvidence: EvidenceFull[];
  initialVariants: Variant[];
  initialTimeline: TimelineEvent[];
}) {
  const [tab, setTab] = useState<TabId>('general');
  const [suspects, setSuspects] = useState<SuspectWithVariants[]>(initialSuspects);
  const [evidence, setEvidence] = useState<EvidenceFull[]>(initialEvidence);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);

  const tabs: { id: TabId; label: string; n?: number }[] = [
    { id: 'general', label: 'General' },
    { id: 'personajes', label: 'Personajes', n: suspects.length },
    { id: 'evidencias', label: 'Evidencias', n: evidence.length },
    { id: 'guion', label: 'Guion', n: variants.length + timeline.length },
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
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <GeneralTab caseRow={caseRow} suspects={suspects} evidence={evidence} variants={variants} timeline={timeline} />
      )}
      {tab === 'personajes' && (
        <PersonajesTab slug={caseRow.slug} suspects={suspects} setSuspects={setSuspects} variants={variants} />
      )}
      {tab === 'evidencias' && (
        <EvidenciasTab slug={caseRow.slug} evidence={evidence} setEvidence={setEvidence} variants={variants} timeline={timeline} />
      )}
      {tab === 'guion' && (
        <GuionTab
          slug={caseRow.slug}
          variants={variants}
          setVariants={setVariants}
          suspects={suspects}
          timeline={timeline}
          setTimeline={setTimeline}
          evidence={evidence}
        />
      )}
    </div>
  );
}
