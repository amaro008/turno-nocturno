// POST /api/admin/assets/upload-url — URL firmada de subida para un asset del sitio.
// Ruta versionada implícita: site-assets/{slot}/{timestamp}-{filename} (nunca se sobrescribe).
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createUploadUrl, safeFilename, UPLOAD_LIMITS, MEDIA_BUCKET } from '@/lib/server/storage';
import { slugify } from '@/lib/ui/slug';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { slot, filename, size, mime } = (await req.json()) as {
    slot?: string;
    filename?: string;
    size?: number;
    mime?: string;
  };
  if (!slot || !filename) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const limits = UPLOAD_LIMITS.image;
  if (typeof size === 'number' && size > limits.maxBytes) {
    return NextResponse.json({ error: 'too_large', maxBytes: limits.maxBytes }, { status: 400 });
  }
  if (mime && !limits.mime.includes(mime as never)) {
    return NextResponse.json({ error: 'invalid_mime', allowed: limits.mime }, { status: 400 });
  }

  const path = `site-assets/${slugify(slot.replace(/\./g, '-'))}/${safeFilename(filename)}`;
  const signed = await createUploadUrl(path);
  if (!signed) return NextResponse.json({ error: 'storage' }, { status: 500 });

  return NextResponse.json({ ok: true, bucket: MEDIA_BUCKET, path: signed.path, token: signed.token });
}
