import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import {
  getSessionByCode,
  getCatalog,
  getDeliveredCodes,
  processDueEvents,
  toPublicEvidence,
} from '@/lib/server/game';
import { secondsRemaining } from '@/lib/engine/timeline';
import { MAX_HINTS } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  // Motor de eventos: dispara lo vencido (briefing incluido) antes de leer.
  await processDueEvents(ctx);

  const svc = createServiceClient();

  const [{ data: rawMessages }, catalog, deliveredCodes, { data: variantRows }, { data: verdict }] =
    await Promise.all([
      svc.from('chat_messages').select('*').eq('session_id', ctx.session.id).order('at', { ascending: true }),
      getCatalog(ctx.caseRow.id, ctx.variant.id),
      getDeliveredCodes(ctx.session.id),
      svc.from('variants').select('culprit').eq('case_id', ctx.caseRow.id),
      svc.from('verdicts').select('*').eq('session_id', ctx.session.id).maybeSingle(),
    ]);

  const deliveredSet = new Set(deliveredCodes);
  const byCode = new Map(catalog.map((e) => [e.code, toPublicEvidence(e)]));

  const messages = (rawMessages ?? []).map((m) => ({
    id: m.id,
    at: m.at,
    role: m.role,
    kind: m.kind,
    content: m.content,
    voice_path: m.voice_path,
    evidence_code: m.evidence_code,
    evidence: m.evidence_code ? byCode.get(m.evidence_code) ?? null : null,
  }));

  const evidence = catalog.filter((e) => deliveredSet.has(e.code)).map(toPublicEvidence);
  const suspects = Array.from(new Set((variantRows ?? []).map((v) => v.culprit))).filter(Boolean);

  const secs = ctx.session.activated_at
    ? secondsRemaining(ctx.session.activated_at, ctx.caseRow.time_limit_min)
    : ctx.caseRow.time_limit_min * 60;

  return NextResponse.json({
    status: ctx.session.status,
    variantCode: ctx.variantCode,
    secondsRemaining: secs,
    hintsUsed: ctx.session.hints_used,
    maxHints: MAX_HINTS,
    case: {
      title: ctx.caseRow.title,
      city: ctx.caseRow.city,
      eraYear: ctx.caseRow.era_year,
      timeLimitMin: ctx.caseRow.time_limit_min,
    },
    messages,
    evidence,
    suspects,
    verdict: verdict ?? null,
    // La narrativa solo se revela cuando la sesión ya tiene veredicto.
    resolvedNarrative: verdict ? ctx.variant.solution_narrative : null,
    resolvedCulprit: verdict ? ctx.variant.culprit : null,
  });
}
