import { createServiceClient } from '@/lib/server/supabase';
import { createCode } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoCodigoPage({ searchParams }: { searchParams: { error?: string } }) {
  const svc = createServiceClient();
  const { data: cases } = await svc.from('cases').select('id, title, city, era_year').eq('active', true).order('slug');

  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / Códigos / <b>Nuevo</b>
        </span>
      </div>
      <div className="admin-content">
        <div className="admin-h">
          <h1>Crear código de acceso</h1>
        </div>

        {searchParams.error && <div className="note-error" style={{ marginBottom: 14 }}>{searchParams.error}</div>}

        <form className="form-card" action={createCode}>
          <div>
            <label className="label">Correo del usuario</label>
            <input className="input" name="email" type="email" required placeholder="usuario@correo.com" />
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6 }}>
              El usuario debe estar registrado. No creamos cuentas fantasma.
            </div>
          </div>
          <div>
            <label className="label">Caso</label>
            <select className="input" name="case_id" required defaultValue="">
              <option value="" disabled>
                Selecciona un caso…
              </option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.city} {c.era_year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nota interna (opcional)</label>
            <input className="input" name="note" placeholder="SPEI 12/jul, ref 448291" />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn ghost" type="submit" name="send" value="draft">
              Guardar borrador
            </button>
            <button className="btn primary" type="submit" name="send" value="now">
              Guardar y enviar email
            </button>
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
            Si Resend no está configurado, el código se crea igual y lo verás en el listado para enviarlo por WhatsApp.
          </div>
        </form>
      </div>
    </>
  );
}
