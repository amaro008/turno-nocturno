// ============================================================================
// GAME — Lógica de servidor de la sesión (SOLO servidor, service role).
// Carga de sesión, evidencia entregada, motor de eventos temporales
// (idempotente) y entrega de evidencia con gating.
// ============================================================================

import { createServiceClient } from './supabase';
import { canDeliver, visibleCatalog } from '@/lib/engine/evidence-gating';
import { minutesElapsed } from '@/lib/engine/timeline';
import { dueEvents } from '@/lib/engine/timeline';
import type { Case, EvidenceItem, GameSession, TimelineEvent, Variant } from '@/lib/domain';

export interface SessionContext {
  session: GameSession;
  caseRow: Case;
  variant: Variant;
  variantCode: string;
}

export interface PublicEvidence {
  id: string;
  code: string;
  kind: EvidenceItem['kind'];
  title: string;
  body_md: string | null;
  transcript: string | null;
  media_path: string | null;
}

export function toPublicEvidence(e: EvidenceItem): PublicEvidence {
  return {
    id: e.id,
    code: e.code,
    kind: e.kind,
    title: e.title,
    body_md: e.body_md,
    transcript: e.transcript,
    media_path: e.media_path,
  };
}

/** Carga sesión por código de acceso, validando propiedad del usuario. */
export async function getSessionByCode(
  code: string,
  userId: string,
): Promise<SessionContext | null> {
  const svc = createServiceClient();
  const { data: ac } = await svc
    .from('access_codes')
    .select('id, user_id, session_id, status')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (!ac || ac.user_id !== userId || !ac.session_id) return null;

  const { data: session } = await svc.from('sessions').select('*').eq('id', ac.session_id).maybeSingle();
  if (!session) return null;

  const { data: caseRow } = await svc.from('cases').select('*').eq('id', session.case_id).maybeSingle();
  const { data: variant } = await svc.from('variants').select('*').eq('id', session.variant_id).maybeSingle();
  if (!caseRow || !variant) return null;

  return {
    session: session as GameSession,
    caseRow: caseRow as Case,
    variant: variant as Variant,
    variantCode: (variant as Variant).code,
  };
}

/** Catálogo de evidencia visible para la sesión (shared + variante). */
export async function getCatalog(caseId: string, variantId: string): Promise<EvidenceItem[]> {
  const svc = createServiceClient();
  const { data } = await svc.from('evidence_items').select('*').eq('case_id', caseId);
  return visibleCatalog((data ?? []) as EvidenceItem[], variantId);
}

/** Códigos de evidencia ya entregados/desbloqueados en la sesión. */
export async function getDeliveredCodes(sessionId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('session_events')
    .select('payload')
    .eq('session_id', sessionId)
    .eq('type', 'unlock');
  return (data ?? []).map((r) => String((r.payload as { code?: string }).code)).filter(Boolean);
}

async function getFiredTimelineIds(sessionId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('session_events')
    .select('payload')
    .eq('session_id', sessionId)
    .eq('type', 'timed_event_fired');
  return (data ?? []).map((r) => String((r.payload as { timeline_id?: string }).timeline_id)).filter(Boolean);
}

/**
 * Entrega una evidencia (con gating). Inserta la tarjeta en el chat y el evento
 * de unlock. Idempotente: si ya estaba entregada, no la duplica.
 * Devuelve el item público o null + razón.
 */
export async function deliverEvidence(
  ctx: SessionContext,
  code: string,
  opts: { elapsedMin: number; announce?: string } = { elapsedMin: 0 },
): Promise<{ ok: true; item: PublicEvidence } | { ok: false; reason: string }> {
  const svc = createServiceClient();
  const catalog = await getCatalog(ctx.caseRow.id, ctx.variant.id);
  const delivered = await getDeliveredCodes(ctx.session.id);

  if (delivered.includes(code)) {
    const existing = catalog.find((e) => e.code === code);
    if (existing) return { ok: true, item: toPublicEvidence(existing) };
  }

  const result = canDeliver(code, catalog, {
    variantId: ctx.variant.id,
    elapsedMin: opts.elapsedMin,
    unlockedCodes: delivered,
  });
  if (!result.ok) return { ok: false, reason: result.reason };

  // Evento de unlock (fuente de verdad de "entregada")
  await svc.from('session_events').insert({
    session_id: ctx.session.id,
    type: 'unlock',
    payload: { code },
  });

  // Tarjeta en el chat
  await svc.from('chat_messages').insert({
    session_id: ctx.session.id,
    role: 'commander',
    kind: 'evidence_card',
    content: result.item.title,
    evidence_code: code,
  });

  return { ok: true, item: toPublicEvidence(result.item) };
}

/**
 * Motor de eventos temporales. Dispara los eventos vencidos aún no ejecutados,
 * garantizando idempotencia con el índice único de session_events.
 * Devuelve cuántos eventos disparó.
 */
export async function processDueEvents(ctx: SessionContext, now: Date = new Date()): Promise<number> {
  if (!ctx.session.activated_at) return 0;
  const svc = createServiceClient();

  const elapsedMin = minutesElapsed(ctx.session.activated_at, now);
  const { data: tl } = await svc.from('case_timeline').select('*').eq('case_id', ctx.caseRow.id);
  const timeline = (tl ?? []) as TimelineEvent[];
  const firedIds = await getFiredTimelineIds(ctx.session.id);

  const due = dueEvents(timeline, { elapsedMin, variantCode: ctx.variantCode, firedIds });
  let fired = 0;

  for (const ev of due) {
    // Reserva idempotente: si el índice único rechaza, ya se disparó.
    const { error: guardErr } = await svc.from('session_events').insert({
      session_id: ctx.session.id,
      type: 'timed_event_fired',
      payload: { timeline_id: ev.id, minute: ev.minute, action: ev.action },
    });
    if (guardErr) continue; // ya disparado por otra petición

    const payload = ev.payload as {
      text?: string;
      transcript?: string;
      voice_path?: string;
      variant_codes?: Record<string, string>;
      also?: string[];
    };

    if (ev.action === 'message' || ev.action === 'pressure' || ev.action === 'deadline') {
      if (payload.text) {
        await svc.from('chat_messages').insert({
          session_id: ctx.session.id,
          role: 'commander',
          kind: 'text',
          content: payload.text,
        });
      }
    } else if (ev.action === 'voice') {
      await svc.from('chat_messages').insert({
        session_id: ctx.session.id,
        role: 'commander',
        kind: 'voice',
        content: payload.text ?? payload.transcript ?? '',
        voice_path: payload.voice_path ?? null,
      });
    } else if (ev.action === 'evidence') {
      if (payload.text) {
        await svc.from('chat_messages').insert({
          session_id: ctx.session.id,
          role: 'commander',
          kind: 'text',
          content: payload.text,
        });
      }
      const codes: string[] = [];
      const primary = payload.variant_codes?.[ctx.variantCode];
      if (primary) codes.push(primary);
      if (payload.also) codes.push(...payload.also);
      for (const c of codes) {
        await deliverEvidence(ctx, c, { elapsedMin });
      }
    }
    fired += 1;
  }

  return fired;
}
