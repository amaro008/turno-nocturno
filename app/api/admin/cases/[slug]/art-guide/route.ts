// GET /api/admin/cases/[slug]/art-guide — descarga la GUIA-DE-ARTE.md generada
// desde la data actual del caso (los prompts listos para copiar/pegar).
import { assertAdminApi } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getCaseBySlug } from '@/lib/server/admin-cases';
import { buildArtGuideMarkdown } from '@/lib/server/art-guide';
import type { Case, Suspect, CaseVisualPrompt, Variant } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const admin = await assertAdminApi();
  if (!admin) return new Response('forbidden', { status: 403 });
  const caseRow = await getCaseBySlug(params.slug);
  if (!caseRow) return new Response('not found', { status: 404 });

  const svc = createServiceClient();
  const [{ data: suspects }, { data: visual }, { data: variants }] = await Promise.all([
    svc.from('suspects').select('*').eq('case_id', caseRow.id).order('sort_order'),
    svc.from('case_visual_prompts').select('*').eq('case_id', caseRow.id).order('slot_name'),
    svc.from('variants').select('*').eq('case_id', caseRow.id).order('code'),
  ]);

  const md = buildArtGuideMarkdown(
    caseRow as Case,
    (suspects ?? []) as Suspect[],
    (visual ?? []) as CaseVisualPrompt[],
    (variants ?? []) as Variant[],
  );

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="GUIA-DE-ARTE-${caseRow.slug}.md"`,
    },
  });
}
