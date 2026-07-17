'use client';

import { useEffect, useRef, useState } from 'react';

export default function NotesBoard({ code, initial }: { code: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(true);
  const dirty = useRef(false);
  const lastSaved = useRef(initial);

  // Auto-guardado cada 5 s si hay cambios.
  useEffect(() => {
    const id = setInterval(async () => {
      if (!dirty.current) return;
      const snapshot = notes;
      try {
        await fetch(`/api/sessions/${code}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: snapshot }),
        });
        lastSaved.current = snapshot;
        dirty.current = snapshot !== notes;
        setSaved(!dirty.current);
      } catch {
        /* reintenta en el próximo ciclo */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [code, notes]);

  return (
    <div className="notes-board">
      <div className="notes-head">
        <span className="sf-label">Bloc de la mesa</span>
        <span className={'notes-status mono' + (saved ? ' ok' : '')}>{saved ? 'Guardado' : 'Guardando…'}</span>
      </div>
      <textarea
        className="notes-area"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          dirty.current = e.target.value !== lastSaved.current;
          setSaved(!dirty.current);
        }}
        placeholder={'Teorías, horas clave, contradicciones…\n\nEj.\n02:49 corte de transmisión\n03:10 hallazgo — 21 min sin testigos'}
      />
      <div className="field-hint">Se guarda solo cada 5 segundos y persiste si recargan.</div>
    </div>
  );
}
