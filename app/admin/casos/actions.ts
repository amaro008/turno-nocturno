'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { logAdminAction } from '@/lib/server/admin-audit';

export async function toggleCaseActive(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const next = String(formData.get('next') ?? 'false') === 'true';
  const svc = createServiceClient();
  await svc.from('cases').update({ active: next }).eq('id', id);
  await logAdminAction(admin.id, next ? 'case_activate' : 'case_deactivate', 'case', id, {});
  revalidatePath('/admin/casos');
}
