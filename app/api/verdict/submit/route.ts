// ============================================================================
// VERDICT SUBMIT — Evalúa quién/cómo/por qué.
// Culpable: comparación exacta contra BD. Cómo/por qué: llamada AISLADA a
// Anthropic con rúbrica (sin historial del chat). Persiste y narra la resolución.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { anthropic, EVAL_MODEL } from '@/lib/server/anthropic';
import { getSessionByCode } from '@/lib/server/game';
import { buildEvaluatorPrompt } from '@/lib/server/prompts/rubric.evaluator';
import { scoreVerdict } from '@/lib/engine/verdict-scoring';
import { VerdictScore } from '@/lib/domain';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const { code, accused, how, why } = (await req.json()) as {
    code?: string;
    accused?: string;
    how?: string;
    why?: string;
  };
  if (!code || !accused) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const ctx = await getSessionByCode(code, user.id);
  if (!ctx) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const svc = createServiceClient();

  // ¿Ya hay veredicto? (un solo intento)
  const { data: existing } = await svc
    .from('verdicts')
    .select('*')
    .eq('session_id', ctx.session.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      already: true,
      verdict: existing,
      narrative: ctx.variant.solution_narrative,
    });
  }

  const culpritCorrect = normalize(accused) === normalize(ctx.variant.culprit);

  // Evaluación aislada del cómo/por qué
  let howScore: VerdictScore = 'incorrecto';
  let whyScore: VerdictScore = 'incorrecto';
  let feedback = '';
  try {
    const prompt = buildEvaluatorPrompt({
      culpritCorrect,
      accused,
      actualCulprit: ctx.variant.culprit,
      howText: how ?? '',
      whyText: why ?? '',
      rubric: ctx.variant.rubric,
    });
    const res = await anthropic().messages.create({
      model: EVAL_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content.find((b) => b.type === 'text');
    const raw = text && text.type === 'text' ? text.text : '{}';
    const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    if (['correcto', 'parcial', 'incorrecto'].includes(json.how_score)) howScore = json.how_score;
    if (['correcto', 'parcial', 'incorrecto'].includes(json.why_score)) whyScore = json.why_score;
    feedback = String(json.feedback ?? '');
  } catch {
    // Si el evaluador falla, puntuamos solo el culpable (degradación elegante).
    feedback = '';
  }

  const score = scoreVerdict({
    culpritCorrect,
    howScore,
    whyScore,
    hintsUsed: ctx.session.hints_used,
  });

  // Persistir veredicto
  const { data: verdict } = await svc
    .from('verdicts')
    .insert({
      session_id: ctx.session.id,
      accused,
      how_text: how ?? '',
      why_text: why ?? '',
      culprit_correct: culpritCorrect,
      how_score: howScore,
      why_score: whyScore,
      total_score: score.total,
    })
    .select('*')
    .single();

  // Cerrar sesión y código
  const nowIso = new Date().toISOString();
  await svc.from('sessions').update({ status: 'resolved' }).eq('id', ctx.session.id);
  await svc
    .from('access_codes')
    .update({ status: 'completed', completed_at: nowIso })
    .eq('id', ctx.session.access_code_id);

  await svc.from('session_events').insert({
    session_id: ctx.session.id,
    type: 'verdict_submitted',
    payload: { accused, culprit_correct: culpritCorrect, total: score.total },
  });

  // Mensaje de reacción del Comandante en el chat
  const reaction = culpritCorrect
    ? `Cerraron el expediente. ${feedback || 'Buen trabajo, detectives.'}`
    : `El expediente queda como estaba. ${feedback || 'No era quien señalaron.'}`;
  await svc.from('chat_messages').insert({
    session_id: ctx.session.id,
    role: 'commander',
    kind: 'text',
    content: reaction,
  });

  return NextResponse.json({
    verdict,
    breakdown: score.breakdown,
    feedback,
    narrative: ctx.variant.solution_narrative,
    culprit: ctx.variant.culprit,
  });
}
