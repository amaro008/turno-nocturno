// PATCH /api/admin/cases/[slug] — editar caso (General + matriz de validación)
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { logAdminAction } from '@/lib/server/admin-audit';
import { caseGeneralSchema } from '@/lib/domain/schemas';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const svc = createServiceClient();
  const { data: existing } = await svc.from('cases').select('id, slug').eq('slug', params.slug).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json();

  // Actualización parcial: sólo la matriz de validación
  if (body.validation_matrix !== undefined && Object.keys(body).length === 1) {
    await svc.from('cases').update({ validation_matrix: body.validation_matrix }).eq('id', existing.id);
    await logAdminAction(admin.id, 'case_matrix_update', 'case', existing.id, {});
    return NextResponse.json({ ok: true });
  }

  const parsed = caseGeneralSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });
  }
  const c = parsed.data;

  // Si cambia el slug, verificar que no choque
  if (c.slug && c.slug !== existing.slug) {
    const { data: clash } = await svc.from('cases').select('id').eq('slug', c.slug).maybeSingle();
    if (clash) return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
  }

  const { error } = await svc.from('cases').update(c).eq('id', existing.id);
  if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'case_update', 'case', existing.id, { fields: Object.keys(c) });
  return NextResponse.json({ ok: true, slug: c.slug ?? existing.slug });
}
