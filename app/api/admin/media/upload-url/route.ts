// POST /api/admin/media/upload-url — URL firmada para subida directa a Storage.
// No expone la service key: el cliente sube con el token devuelto.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createUploadUrl, safeFilename, UPLOAD_LIMITS, MEDIA_BUCKET, UploadKind } from '@/lib/server/storage';
import { slugify } from '@/lib/ui/slug';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { caseSlug, kind, category, filename, size, mime } = (await req.json()) as {
    caseSlug?: string;
    kind?: UploadKind;
    category?: string;
    filename?: string;
    size?: number;
    mime?: string;
  };

  if (!caseSlug || !kind || !category || !filename) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const limits = UPLOAD_LIMITS[kind];
  if (!limits) return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  if (typeof size === 'number' && size > limits.maxBytes) {
    return NextResponse.json({ error: 'too_large', maxBytes: limits.maxBytes }, { status: 400 });
  }
  if (mime && !limits.mime.includes(mime as never)) {
    return NextResponse.json({ error: 'invalid_mime', allowed: limits.mime }, { status: 400 });
  }

  const path = `casos/${slugify(caseSlug)}/${slugify(category)}/${safeFilename(filename)}`;
  const signed = await createUploadUrl(path);
  if (!signed) return NextResponse.json({ error: 'storage' }, { status: 500 });

  return NextResponse.json({ ok: true, bucket: MEDIA_BUCKET, path: signed.path, token: signed.token });
}
