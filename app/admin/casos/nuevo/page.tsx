import CaseGeneralForm from '../_components/CaseGeneralForm';

export const dynamic = 'force-dynamic';

export default function NuevoCasoPage() {
  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / Casos / <b>Nuevo</b>
        </span>
      </div>
      <div className="admin-content">
        <div className="admin-h">
          <h1>Nuevo caso</h1>
        </div>
        <p style={{ color: 'var(--ink-2)', marginTop: -8, marginBottom: 20, maxWidth: 620 }}>
          Empieza por lo básico. Al crear el caso podrás agregar sospechosos, evidencias, variantes
          y el timeline del Comandante.
        </p>
        <CaseGeneralForm mode="create" />
      </div>
    </>
  );
}
