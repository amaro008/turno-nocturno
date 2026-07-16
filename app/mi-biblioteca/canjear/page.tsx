import { redeemCode } from '../actions';

export const metadata = { title: 'Canjear código · Turno Nocturno' };

// Página de canje con código pre-llenado desde el email del admin.
export default function CanjearPage({ searchParams }: { searchParams: { code?: string; error?: string } }) {
  return (
    <main className="wrap lib" style={{ maxWidth: 520 }}>
      <span className="kicker">Canjear</span>
      <h1 style={{ fontSize: 26, margin: '8px 0 4px' }}>Agrega tu caso a la biblioteca</h1>
      <p style={{ color: 'var(--ink-2)', marginBottom: 20 }}>
        Confirma el código que recibiste por correo. Tras canjearlo, podrás activar la sesión cuando
        tu mesa esté lista.
      </p>

      {searchParams.error && <div className="note-error" style={{ marginBottom: 14 }}>{searchParams.error}</div>}

      <div className="redeem-box">
        <form action={redeemCode} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <input
            className="input"
            name="code"
            defaultValue={searchParams.code ?? ''}
            placeholder="TN-XXXX-XXXX"
            aria-label="Código de acceso"
            style={{ marginBottom: 10 }}
          />
          <button className="btn primary block" type="submit">
            Canjear y guardar
          </button>
        </form>
      </div>
    </main>
  );
}
