// PATCH /api/admin/assets/[slot] — actualiza image_path y/o alt_text.
import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { logAdminAction } from '@/lib/server/admin-audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { slot: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const svc = createServiceClient();
  const { data: existing } = await svc.from('site_assets').select('slot').eq('slot', params.slot).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = (await req.json()) as { image_path?: string | null; alt_text?: string };
  const patch: Record<string, unknown> = { updated_by_admin: admin.id, updated_at: new Date().toISOString() };
  if (body.image_path !== undefined) patch.image_path = body.image_path;
  if (typeof body.alt_text === 'string') patch.alt_text = body.alt_text.slice(0, 300);

  const { error } = await svc.from('site_assets').update(patch).eq('slot', params.slot);
  if (error) return NextResponse.json({ error: 'db', detail: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'site_asset_update', 'site_asset', params.slot, {
    changed: Object.keys(patch).filter((k) => k !== 'updated_by_admin' && k !== 'updated_at'),
  });
  return NextResponse.json({ ok: true });
}
