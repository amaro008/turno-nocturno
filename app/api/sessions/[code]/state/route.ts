import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getSessionByCode, getOpenEvidence, processDueEvents } from '@/lib/server/game';
import { toLegacyPublic } from '@/lib/server/evidence';
import { signedUrl, SESSION_MEDIA_TTL } from '@/lib/server/storage';
import { secondsRemaining } from '@/lib/engine/timeline';
import { MAX_HINTS, SUSPECT_PUBLIC_COLUMNS, type SuspectPublic } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const ctx = await getSessionByCode(params.code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  // Motor de eventos: dispara lo vencido (briefing incluido) antes de leer.
  await processDueEvents(ctx);

  const svc = createServiceClient();

  const [{ data: rawMessages }, openEvidence, { data: suspectRows }, { data: verdict }] =
    await Promise.all([
      svc.from('chat_messages').select('*').eq('session_id', ctx.session.id).order('at', { ascending: true }),
      getOpenEvidence(ctx),
      svc
        .from('suspects')
        .select(SUSPECT_PUBLIC_COLUMNS) // SOLO ficha pública — jamás internal_notes ni data de variante
        .eq('case_id', ctx.caseRow.id)
        .order('sort_order', { ascending: true }),
      svc.from('verdicts').select('*').eq('session_id', ctx.session.id).maybeSingle(),
    ]);

  // Evidencia abierta → forma legacy con URL de media firmada a 10 min (anti-descarga).
  const evidence = await Promise.all(openEvidence.map((e) => toLegacyPublic(e)));
  const evByCode = new Map(evidence.map((e) => [e.code, e]));

  const messages = (rawMessages ?? []).map((m) => ({
    id: m.id,
    at: m.at,
    role: m.role,
    kind: m.kind,
    content: m.content,
    voice_path: m.voice_path,
    evidence_code: m.evidence_code,
    evidence: m.evidence_code ? evByCode.get(m.evidence_code) ?? null : null,
  }));

  // Ficha PÚBLICA de sospechosos (con foto firmada). Neutra, igual en toda variante.
  // La víctima no aparece como sospechoso acusable.
  const suspects = await Promise.all(
    ((suspectRows ?? []) as SuspectPublic[]).filter((s) => !s.is_victim).map(async (s) => ({
      id: s.id,
      full_name: s.full_name,
      age: s.age,
      occupation: s.occupation,
      relationship_to_victim: s.relationship_to_victim,
      physical_description: s.physical_description,
      distinctive_features: s.distinctive_features,
      accent_or_speech: s.accent_or_speech,
      typical_attire: s.typical_attire,
      photoUrl: await signedUrl(s.photo_path, SESSION_MEDIA_TTL),
    })),
  );

  const secs = ctx.session.activated_at
    ? secondsRemaining(ctx.session.activated_at, ctx.caseRow.time_limit_min)
    : ctx.caseRow.time_limit_min * 60;

  return NextResponse.json({
    status: ctx.session.status,
    variantCode: ctx.variantCode,
    secondsRemaining: secs,
    hintsUsed: ctx.session.hints_used,
    maxHints: MAX_HINTS,
    playerNotes: ctx.session.player_notes ?? '',
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
    resolvedNarrative: verdict ? ctx.variant.solution_narrative : null,
    resolvedCulprit: verdict ? ctx.variant.culprit : null,
  });
}
