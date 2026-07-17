'use client';

import { useState } from 'react';
import type { SessionSuspect } from '../types';
import { InitialsAvatar } from '@/components/Initials';
import EmptyState from '@/components/EmptyState';

export default function SuspectsGrid({ suspects }: { suspects: SessionSuspect[] }) {
  const [open, setOpen] = useState<SessionSuspect | null>(null);
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());

  function toggleDiscard(id: string) {
    setDiscarded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  if (suspects.length === 0) {
    return (
      <EmptyState
        ill="suspects"
        title="Sin sospechosos"
        message="Este caso todavía no tiene sospechosos cargados en el expediente."
      />
    );
  }

  return (
    <>
      <div className="suspects-grid">
        {suspects.map((s) => {
          const isOut = discarded.has(s.id);
          return (
            <div className={'suspect-card' + (isOut ? ' discarded' : '')} key={s.id}>
              <button className="suspect-open" onClick={() => setOpen(s)}>
                <div className="suspect-photo">
                  {s.photoUrl ? <img src={s.photoUrl} alt={s.name} draggable={false} /> : <InitialsAvatar name={s.name} />}
                  {isOut && <span className="discard-stamp">DESCARTADO</span>}
                </div>
                <div className="suspect-body">
                  <h3>{s.name}</h3>
                  <div className="suspect-sub">
                    {s.age ? `${s.age} años` : ''}{s.age && s.occupation ? ' · ' : ''}{s.occupation ?? ''}
                  </div>
                  {s.relation && <div className="suspect-rel">{s.relation}</div>}
                </div>
              </button>
              <button className="suspect-discard" onClick={() => toggleDiscard(s.id)}>
                {isOut ? 'Reconsiderar' : 'Descartar'}
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="modal-back" onClick={() => setOpen(null)}>
          <div className="modal suspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="suspect-modal-top">
              <div className="suspect-modal-photo">
                {open.photoUrl ? <img src={open.photoUrl} alt={open.name} draggable={false} /> : <InitialsAvatar name={open.name} />}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{open.name}</h2>
                <div className="suspect-sub" style={{ marginTop: 4 }}>
                  {open.age ? `${open.age} años` : ''}{open.age && open.occupation ? ' · ' : ''}{open.occupation ?? ''}
                </div>
                {open.relation && <div className="suspect-rel" style={{ marginTop: 6 }}>{open.relation}</div>}
              </div>
            </div>

            {open.description && (
              <div className="suspect-field">
                <span className="sf-label">Descripción</span>
                <p>{open.description}</p>
              </div>
            )}
            {open.alibi && (
              <div className="suspect-field">
                <span className="sf-label">Coartada declarada</span>
                <p>{open.alibi}</p>
              </div>
            )}
            <div className="suspect-field">
              <span className="sf-label">Observaciones de la mesa</span>
              <p style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
                Usa la pestaña “Mis notas” para registrar horas, contradicciones y sospechas.
              </p>
            </div>

            <div className="vactions">
              <button className="btn ghost" onClick={() => { toggleDiscard(open.id); }}>
                {discarded.has(open.id) ? 'Reconsiderar' : 'Descartar sospechoso'}
              </button>
              <button className="btn primary" onClick={() => setOpen(null)}>Cerrar ficha</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
