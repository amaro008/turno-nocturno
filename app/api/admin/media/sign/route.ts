// POST /api/admin/media/sign — URL firmada de LECTURA para previsualizar media
// ya subida en el admin (bucket privado). Admin-only; no expone la service key.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { signedUrl } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { path } = (await req.json()) as { path?: string };
  if (!path) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const url = await signedUrl(path);
  if (!url) return NextResponse.json({ error: 'storage' }, { status: 404 });

  return NextResponse.json({ ok: true, url });
}
