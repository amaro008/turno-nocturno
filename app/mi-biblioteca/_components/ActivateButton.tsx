'use client';

import { activateSession } from '../actions';

export default function ActivateButton({ codeId }: { codeId: string }) {
  return (
    <form
      action={activateSession}
      onSubmit={(e) => {
        const ok = window.confirm(
          'Una vez activada tendrás 2–3 h para resolver el caso y hasta 24 h para completarlo. El culpable se sortea ahora y no hay vuelta atrás. ¿Listos?',
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="code_id" value={codeId} />
      <button className="btn primary block" type="submit">
        Activar sesión
      </button>
    </form>
  );
}
