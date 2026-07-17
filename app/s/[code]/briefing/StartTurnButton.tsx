'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartTurnButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    const ok = window.confirm(
      'Una vez que inicies, el reloj no se detiene. Tendrán 2–3 horas para resolver el caso. ¿Listos para arrancar el turno?',
    );
    if (!ok) return;
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
        setError(
          data.error === 'expired'
            ? 'El código expiró y ya no puede activarse.'
            : 'No pudimos iniciar el turno. Intenta de nuevo.',
        );
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
    <div className="brief-start">
      <button className="start-btn" onClick={start} disabled={busy}>
        {busy ? 'Iniciando…' : 'INICIAR TURNO NOCTURNO'}
      </button>
      {error && <div className="note-error" style={{ marginTop: 12 }}>{error}</div>}
    </div>
  );
}
