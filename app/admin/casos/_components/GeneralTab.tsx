'use client';

import { useState } from 'react';
import type { Case, SuspectWithVariants, EvidenceFull, Variant, TimelineEvent } from '@/lib/domain';
import CaseGeneralForm from './CaseGeneralForm';
import MarketingTab from './MarketingTab';
import ArtDirectionTab from './ArtDirectionTab';
import StatusBanner from './StatusBanner';

export default function GeneralTab({
  caseRow,
  suspects,
  evidence,
  variants,
  timeline,
}: {
  caseRow: Case;
  suspects: SuspectWithVariants[];
  evidence: EvidenceFull[];
  variants: Variant[];
  timeline: TimelineEvent[];
}) {
  const [showArt, setShowArt] = useState(false);

  return (
    <div className="cpanel wide">
      <StatusBanner caseRow={caseRow} suspects={suspects} evidence={evidence} variants={variants} timelineCount={timeline.length} />

      <section className="gen-sec">
        <h3 className="art-h">Metadatos</h3>
        <CaseGeneralForm mode="edit" initial={caseRow} />
      </section>

      <section className="gen-sec">
        <h3 className="art-h">Marketing</h3>
        <MarketingTab caseRow={caseRow} />
      </section>

      <section className="gen-sec">
        <button className="fold-toggle" onClick={() => setShowArt((v) => !v)}>
          {showArt ? '▾' : '▸'} Dirección de arte (prompts de IA)
        </button>
        {showArt && <ArtDirectionTab slug={caseRow.slug} />}
      </section>
    </div>
  );
}
