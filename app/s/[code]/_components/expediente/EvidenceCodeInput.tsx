'use client';

import { useState } from 'react';

export default function EvidenceCodeInput({
  code,
  onUnlocked,
}: {
  code: string;
  onUnlocked: () => void;
}) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ code: string; ok: boolean; label: string }[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const target = val.trim().toUpperCase();
    if (!target || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/evidence/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, evidence_code: target }),
      });
      const data = await res.json();
      const ok = !!data.ok;
      setHistory((h) => [
        { code: target, ok, label: ok ? (data.already ? 'ya estaba abierto' : 'desbloqueado') : 'inválido o no disponible' },
        ...h,
      ]);
      if (ok) {
        setVal('');
        onUnlocked();
      }
    } catch {
      setHistory((h) => [{ code: target, ok: false, label: 'error de red' }, ...h]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="codes-tab">
      <p className="field-hint" style={{ marginTop: 0 }}>
        Algunos documentos esconden códigos. Captúralos aquí para desbloquear más evidencia.
      </p>
      <form className="codes-form" onSubmit={submit}>
        <input
          className="input mono"
          value={val}
          onChange={(e) => setVal(e.target.value.toUpperCase())}
          placeholder="EJ. CINTA-0158"
        />
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? '…' : 'Desbloquear'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="codes-history">
          <span className="sf-label">Historial</span>
          {history.map((h, i) => (
            <div className={'code-hist' + (h.ok ? ' ok' : ' bad')} key={i}>
              <span className="mono">{h.code}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
