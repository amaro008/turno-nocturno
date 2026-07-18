'use client';

import { useState } from 'react';
import type { SuspectWithVariants, EvidenceFull, Variant, TimelineEvent } from '@/lib/domain';
import VariantsTab from './VariantsTab';
import TimelineTab from './TimelineTab';

const ACTION_LABEL: Record<string, string> = {
  message: 'Mensaje', voice: 'Voz', evidence: 'Evidencia', pressure: 'Presión', deadline: 'Deadline',
};

export default function GuionTab({
  slug,
  variants,
  setVariants,
  suspects,
  timeline,
  setTimeline,
  evidence,
}: {
  slug: string;
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  suspects: SuspectWithVariants[];
  timeline: TimelineEvent[];
  setTimeline: (t: TimelineEvent[]) => void;
  evidence: EvidenceFull[];
}) {
  const [sub, setSub] = useState<'variantes' | 'timeline' | 'consolidado'>('variantes');

  return (
    <div className="cpanel wide">
      <div className="ev-subtabs">
        <button className={'ev-subtab' + (sub === 'variantes' ? ' active' : '')} onClick={() => setSub('variantes')}>
          Variantes <span className="tcount">{variants.length}</span>
        </button>
        <button className={'ev-subtab' + (sub === 'timeline' ? ' active' : '')} onClick={() => setSub('timeline')}>
          Timeline <span className="tcount">{timeline.length}</span>
        </button>
        <button className={'ev-subtab' + (sub === 'consolidado' ? ' active' : '')} onClick={() => setSub('consolidado')}>
          Vista consolidada
        </button>
      </div>

      {sub === 'variantes' && (
        <VariantsTab slug={slug} variants={variants} setVariants={setVariants} suspects={suspects} />
      )}
      {sub === 'timeline' && (
        <TimelineTab slug={slug} timeline={timeline} setTimeline={setTimeline} evidence={evidence} />
      )}
      {sub === 'consolidado' && <ConsolidatedTimeline timeline={timeline} variants={variants} />}
    </div>
  );
}

function ConsolidatedTimeline({ timeline, variants }: { timeline: TimelineEvent[]; variants: Variant[] }) {
  if (timeline.length === 0) {
    return <div className="empty-hint">Sin eventos. Agrégalos en el sub-tab Timeline.</div>;
  }
  const sorted = [...timeline].sort((a, b) => a.minute - b.minute);
  const maxMin = Math.max(60, ...sorted.map((t) => t.minute));

  return (
    <div className="consolidated">
      <p className="field-hint">Eventos del Comandante ordenados por minuto. El color indica el tipo.</p>
      <div className="ctl-track">
        <div className="ctl-axis">
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <span key={p} className="ctl-tick mono" style={{ left: `${p * 100}%` }}>{Math.round(p * maxMin)}′</span>
          ))}
        </div>
        {sorted.map((t) => (
          <div
            key={t.id}
            className={'ctl-node ' + t.action}
            style={{ left: `${(t.minute / maxMin) * 100}%` }}
            title={`min ${t.minute} · ${ACTION_LABEL[t.action] ?? t.action}${t.variant_scope ? ` (var ${t.variant_scope})` : ''}`}
          >
            <span className="ctl-dot" />
            <span className="ctl-min mono">{t.minute}′</span>
            <span className="ctl-lbl">{ACTION_LABEL[t.action] ?? t.action}</span>
          </div>
        ))}
      </div>
      <div className="ctl-legend">
        {Object.entries(ACTION_LABEL).map(([k, v]) => (
          <span key={k} className="ctl-leg"><span className={'ctl-dot ' + k} /> {v}</span>
        ))}
      </div>
      {variants.length > 0 && (
        <p className="field-hint" style={{ marginTop: 10 }}>
          Variantes: {variants.map((v) => `${v.code}${v.active ? '' : ' (inactiva)'}`).join(' · ')}
        </p>
      )}
    </div>
  );
}
