// Helper de cliente para las rutas CRUD de sub-entidades del caso.
export type Op = 'create' | 'update' | 'delete' | 'reorder';

export async function entityOp<T>(
  slug: string,
  entity: 'suspects' | 'evidence' | 'variants' | 'timeline',
  op: Op,
  data: unknown,
): Promise<{ ok: boolean; error?: string; list?: T[] }> {
  const res = await fetch(`/api/admin/cases/${slug}/${entity}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, data }),
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, error: json.error ?? 'error' };
  const listKey = entity === 'suspects' ? 'suspects' : entity === 'evidence' ? 'evidence' : entity === 'variants' ? 'variants' : 'timeline';
  return { ok: true, list: json[listKey] as T[] };
}
