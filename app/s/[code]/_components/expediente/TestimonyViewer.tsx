'use client';

import type { PublicEvidence } from '../types';
import { Markdown } from '../markdown';

/** Testimonios en formato entrevista (testigo + declaración, audio opcional). */
export default function TestimonyViewer({ items }: { items: PublicEvidence[] }) {
  return (
    <div className="testi-list">
      {items.map((t) => (
        <article className="testi-card" key={t.id}>
          <header className="testi-head">
            <div className="testi-avatar">{(t.witness_name ?? '?').slice(0, 1).toUpperCase()}</div>
            <div>
              <b>{t.witness_name ?? 'Testigo'}</b>
              <div className="testi-meta mono">{t.code} · {t.title}</div>
            </div>
          </header>
          {t.mediaUrl && (
            <audio className="testi-audio" controls controlsList="nodownload" preload="none" src={t.mediaUrl} onContextMenu={(e) => e.preventDefault()} />
          )}
          {t.body_md && <div className="testi-body"><Markdown source={t.body_md} /></div>}
        </article>
      ))}
    </div>
  );
}
