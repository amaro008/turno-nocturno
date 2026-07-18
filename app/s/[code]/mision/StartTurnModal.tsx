'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StartTurnModal({ code }: { code: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/sessions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'expired' ? 'El código expiró y ya no puede activarse.' : 'No pudimos iniciar el turno. Intenta de nuevo.');
        setBusy(false);
        return;
      }
      router.push(`/s/${data.code}`);
    } catch {
      setError('Error de red. Intenta de nuevo.');
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mis-cta">
        <Link className="mis-btn ghost" href="/mi-biblioteca">Regresar a mi biblioteca</Link>
        <button className="mis-btn primary" onClick={() => setOpen(true)}>Iniciar Turno Nocturno</button>
      </div>
      {error && <div className="note-error" style={{ marginTop: 12, textAlign: 'center' }}>{error}</div>}

      {open && (
        <div className="mis-modal-back" onClick={() => !busy && setOpen(false)}>
          <div className="mis-modal" onClick={(e) => e.stopPropagation()}>
            <span className="mis-modal-stamp">ÚLTIMO AVISO</span>
            <h2 className="font-editorial">Una vez que inicien, el reloj no se detiene.</h2>
            <p className="font-typewriter">
              Tendrán su tiempo completo desde este momento, sin pausa. ¿Están todos presentes y listos?
            </p>
            <div className="mis-modal-actions">
              <button className="mis-btn ghost" disabled={busy} onClick={() => setOpen(false)}>Todavía no</button>
              <button className="mis-btn primary" disabled={busy} onClick={start}>{busy ? 'Iniciando…' : 'Sí, iniciar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
