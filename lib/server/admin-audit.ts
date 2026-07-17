// Auditoría de acciones admin (SOLO servidor).
import { createServiceClient } from './supabase';

export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  payload: Record<string, unknown> = {},
) {
  const svc = createServiceClient();
  await svc.from('admin_actions').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload_json: payload,
  });
}
