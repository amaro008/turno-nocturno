import { requireAdmin } from '@/lib/server/auth';
import { listAssetsForAdmin } from '@/lib/server/site-assets';
import AssetsClient from './AssetsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Assets del sitio · Admin', robots: { index: false, follow: false } };

export default async function AssetsAdminPage() {
  await requireAdmin();
  const assets = await listAssetsForAdmin();
  return (
    <>
      <div className="admin-topbar">
        <span className="crumbs">
          Admin / <b>Assets del sitio</b>
        </span>
      </div>
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        <div className="admin-h">
          <h1>Assets del sitio</h1>
        </div>
        <p style={{ color: 'var(--ink-2)', marginTop: -8, marginBottom: 22, maxWidth: 640 }}>
          Cambia las imágenes del landing y marketing sin tocar código. Cada archivo se guarda
          versionado (no se sobrescribe) y se sirve con URL firmada.
        </p>
        <AssetsClient
          assets={assets.map((a) => ({
            slot: a.slot,
            title: a.title,
            description: a.description,
            alt_text: a.alt_text,
            url: a.url,
          }))}
        />
      </div>
    </>
  );
}
