// GET /api/admin/assets — listar todos los slots con su imagen firmada.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { listAssetsForAdmin } from '@/lib/server/site-assets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const assets = await listAssetsForAdmin();
  return NextResponse.json({ ok: true, assets });
}
