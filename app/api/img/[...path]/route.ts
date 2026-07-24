// ============================================================================
// GET /api/img/<ruta> — sirve imágenes PÚBLICAS del bucket privado con una URL
// estable (sin firmar, sin caducidad). Lee el objeto con el service-role y lo
// devuelve con caché de CDN. Resuelve los fallos intermitentes de las URLs
// firmadas en marketing.
//
// SEGURIDAD: whitelist estricta de prefijos. Solo portadas, hero, retratos de
// sospechosos y assets del sitio — TODO son públicos por diseño. La evidencia
// del juego (evidencia/, timeline/, briefing/, audio/) NO se sirve aquí; esa
// sigue por URL firmada temporal (anti-descarga / anti-spoiler).
// ============================================================================

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/server/supabase';
import { MEDIA_BUCKET } from '@/lib/server/storage';

// Prefijos permitidos (imágenes públicas). Cualquier otra ruta → 404.
const ALLOWED = [
  /^casos\/[^/]+\/cover\//,
  /^casos\/[^/]+\/atmosphere\//,
  /^casos\/[^/]+\/sospechosos\//,
  /^site-assets\//,
];

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const path = (params.path ?? []).join('/');
  if (!path || !ALLOWED.some((re) => re.test(path))) {
    return new NextResponse('not found', { status: 404 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc.storage.from(MEDIA_BUCKET).download(path);
  if (error || !data) return new NextResponse('not found', { status: 404 });

  const type = data.type && IMAGE_TYPES.has(data.type) ? data.type : 'image/jpeg';
  const buf = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': type,
      // Estable: se cachea en el CDN y en el navegador. La ruta lleva un hash en
      // el nombre, así que un reemplazo genera una ruta nueva (sin caché rancio).
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
