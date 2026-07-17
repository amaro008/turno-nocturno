import './admin.css';
import Link from 'next/link';
import { requireAdmin } from '@/lib/server/auth';
import { logoutAction } from '@/app/(auth)/actions';

export const metadata = { title: 'Admin · Turno Nocturno', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
              <path d="M9 12.5 11 14.5 15.5 9.5" />
            </svg>
          </span>
          Turno Nocturno
        </div>
        <div className="admin-tag">Panel de operación</div>
        <Link className="admin-link" href="/admin">Dashboard</Link>
        <Link className="admin-link" href="/admin/casos">Casos</Link>
        <Link className="admin-link" href="/admin/codigos">Códigos</Link>
        <Link className="admin-link" href="/admin/codigos/nuevo">Crear código</Link>
        <Link className="admin-link" href="/mi-biblioteca">← Volver a la app</Link>
        <form action={logoutAction}>
          <button className="btn ghost block" type="submit" style={{ marginTop: 8 }}>Salir</button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
