// ============================================================================
// GAME — Lógica de servidor de la sesión (SOLO servidor, service role).
// Carga de sesión, evidencia entregada, motor de eventos temporales
// (idempotente) y entrega de evidencia con gating.
// ============================================================================

import { createServiceClient } from './supabase';
import { canOpen, visibleForVariant, openReason } from '@/lib/engine/evidence-gating';
import { minutesElapsed } from '@/lib/engine/timeline';
import { dueEvents } from '@/lib/engine/timeline';
import {
  loadCaseEvidenceBase,
  assembleEvidence,
  toLegacyPublic,
  type LegacyPublicEvidence,
} from './evidence';
import { evidenceText, SUSPECT_PUBLIC_COLUMNS } from '@/lib/domain';
import type { Case, EvidenceBase, EvidenceFull, GameSession, SuspectPublic, TimelineEvent, Variant } from '@/lib/domain';
import type { CommanderSuspect, CommanderEvidence } from './prompts/commander.build';

export interface SessionContext {
  session: GameSession;
  caseRow: Case;
  variant: Variant;
  variantCode: string;
}

export type PublicEvidence = LegacyPublicEvidence;

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

/** Catálogo base visible para la sesión (shared + variante sorteada). */
export async function getCatalog(caseId: string, variantId: string | null): Promise<EvidenceBase[]> {
  const all = await loadCaseEvidenceBase(caseId);
  return visibleForVariant(all, variantId);
}

/** Códigos de evidencia desbloqueados manualmente (código/herramienta) en la sesión. */
export async function getDeliveredCodes(sessionId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('session_events')
    .select('payload')
    .eq('session_id', sessionId)
    .eq('type', 'unlock');
  return (data ?? []).map((r) => String((r.payload as { code?: string }).code)).filter(Boolean);
}

export async function getFiredTimelineIds(sessionId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from('session_events')
    .select('payload')
    .eq('session_id', sessionId)
    .eq('type', 'timed_event_fired');
  return (data ?? []).map((r) => String((r.payload as { timeline_id?: string }).timeline_id)).filter(Boolean);
}

/**
 * Evidencia ABIERTA para la sesión (initial + tiempo + eventos disparados +
 * desbloqueos manuales), ensamblada con contenido. Base para /state y managers.
 */
export async function getOpenEvidence(ctx: SessionContext): Promise<EvidenceFull[]> {
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;
  const [catalog, unlockedCodes, firedEventIds] = await Promise.all([
    getCatalog(ctx.caseRow.id, ctx.variant.id),
    getDeliveredCodes(ctx.session.id),
    getFiredTimelineIds(ctx.session.id),
  ]);
  const openBases = catalog.filter(
    (e) => openReason(e, { variantId: ctx.variant.id, elapsedMin, firedEventIds, unlockedCodes }) !== null,
  );
  return assembleEvidence(openBases);
}

/**
 * Datos AUTORIZADOS para el system prompt del Comandante: ficha pública de
 * sospechosos + subset de variante (sin culpabilidad) + lista de evidencia con
 * public_description (todas) y contenido solo de las abiertas.
 */
export async function getCommanderData(
  ctx: SessionContext,
): Promise<{ suspects: CommanderSuspect[]; evidence: CommanderEvidence[] }> {
  const svc = createServiceClient();
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;

  const [catalog, unlockedCodes, firedEventIds, { data: suspectRows }, { data: svd }] = await Promise.all([
    getCatalog(ctx.caseRow.id, ctx.variant.id),
    getDeliveredCodes(ctx.session.id),
    getFiredTimelineIds(ctx.session.id),
    svc.from('suspects').select(SUSPECT_PUBLIC_COLUMNS).eq('case_id', ctx.caseRow.id).order('sort_order'),
    svc
      .from('suspect_variant_data')
      .select('suspect_id, alibi_declared, motive_apparent, variant_specific_notes') // NUNCA is_culprit_in_variant
      .eq('variant_id', ctx.variant.id),
  ]);

  const vdBySuspect = new Map(
    ((svd ?? []) as { suspect_id: string; alibi_declared: string | null; motive_apparent: string | null; variant_specific_notes: string | null }[]).map(
      (r) => [r.suspect_id, r],
    ),
  );

  const suspects: CommanderSuspect[] = ((suspectRows ?? []) as SuspectPublic[]).filter((s) => !s.is_victim).map((s) => {
    const vd = vdBySuspect.get(s.id);
    return {
      full_name: s.full_name,
      occupation: s.occupation,
      relationship_to_victim: s.relationship_to_victim,
      physical_description: s.physical_description,
      distinctive_features: s.distinctive_features,
      alibi_declared: vd?.alibi_declared ?? null,
      motive_apparent: vd?.motive_apparent ?? null,
      variant_notes: vd?.variant_specific_notes ?? null,
    };
  });

  const openSet = new Set(
    catalog
      .filter((e) => openReason(e, { variantId: ctx.variant.id, elapsedMin, firedEventIds, unlockedCodes }) !== null)
      .map((e) => e.code),
  );
  const openFull = await assembleEvidence(catalog.filter((e) => openSet.has(e.code)));
  const textByCode = new Map(openFull.map((e) => [e.code, evidenceText(e)]));

  const evidence: CommanderEvidence[] = catalog.map((e) => ({
    code: e.code,
    title: e.title,
    type: e.type,
    public_description: e.public_description,
    open: openSet.has(e.code),
    content: openSet.has(e.code) ? textByCode.get(e.code) ?? null : undefined,
  }));

  return { suspects, evidence };
}

// NOTA ANTI-SPOILER: sin `code` — el sufijo de variante revelaría la variante.
export interface EvidenceListItem {
  id: string;
  title: string;
  type: EvidenceBase['type'];
  scope: EvidenceBase['scope'];
  public_description: string;
  open: boolean;
  unlocked_at_minute: number | null;
  is_report: boolean;
}

/** Listado del expediente: TODAS las visibles con public_description + flag `open`. */
export async function getEvidenceListing(ctx: SessionContext): Promise<EvidenceListItem[]> {
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;
  const [catalog, unlockedCodes, firedEventIds] = await Promise.all([
    getCatalog(ctx.caseRow.id, ctx.variant.id),
    getDeliveredCodes(ctx.session.id),
    getFiredTimelineIds(ctx.session.id),
  ]);
  return catalog.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    scope: e.scope,
    public_description: e.public_description,
    open: openReason(e, { variantId: ctx.variant.id, elapsedMin, firedEventIds, unlockedCodes }) !== null,
    unlocked_at_minute: e.unlocked_at_minute,
    is_report: e.is_report,
  }));
}

/**
 * Detalle de una pieza: contenido completo SOLO si está abierta en la sesión.
 * `ref` puede ser el `id` opaco (uuid, lo que usa el cliente) o el `code` interno.
 */
export async function getEvidenceDetail(ctx: SessionContext, ref: string): Promise<PublicEvidence | null> {
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;
  const [catalog, unlockedCodes, firedEventIds] = await Promise.all([
    getCatalog(ctx.caseRow.id, ctx.variant.id),
    getDeliveredCodes(ctx.session.id),
    getFiredTimelineIds(ctx.session.id),
  ]);
  const needle = ref.trim();
  const base = catalog.find((e) => e.id === needle) ?? catalog.find((e) => e.code === needle.toUpperCase());
  if (!base) return null;
  if (openReason(base, { variantId: ctx.variant.id, elapsedMin, firedEventIds, unlockedCodes }) === null) return null;
  const [full] = await assembleEvidence([base]);
  return toLegacyPublic(full);
}

/**
 * Abre una evidencia por petición (código impreso / herramienta del Comandante).
 * Inserta la tarjeta en el chat y el evento 'unlock'. Idempotente.
 * `viaEvent` omite la compuerta de tiempo (la dispara un evento del Comandante).
 */
export async function deliverEvidence(
  ctx: SessionContext,
  code: string,
  opts: { elapsedMin: number; viaEvent?: boolean } = { elapsedMin: 0 },
): Promise<{ ok: true; item: PublicEvidence } | { ok: false; reason: string }> {
  const svc = createServiceClient();
  const catalog = await getCatalog(ctx.caseRow.id, ctx.variant.id);
  const delivered = await getDeliveredCodes(ctx.session.id);

  const base = catalog.find((e) => e.code === code);
  const already = delivered.includes(code);

  const result = canOpen(
    code,
    catalog,
    { variantId: ctx.variant.id, elapsedMin: opts.elapsedMin, unlockedCodes: delivered },
    opts.viaEvent,
  );
  if (!already && !result.ok) return { ok: false, reason: result.reason };

  const target = base ?? (result.ok ? result.item : null);
  if (!target) return { ok: false, reason: 'not_found' };

  const [full] = await assembleEvidence([target]);
  const item = await toLegacyPublic(full);

  if (already) return { ok: true, item };

  // Evento de unlock (registro del desbloqueo manual) + tarjeta en el chat.
  await svc.from('session_events').insert({ session_id: ctx.session.id, type: 'unlock', payload: { code } });
  await svc.from('chat_messages').insert({
    session_id: ctx.session.id,
    role: 'commander',
    kind: 'evidence_card',
    content: target.title,
    evidence_code: code,
  });

  return { ok: true, item };
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
        // Vínculo al evento: permite resolver el audio EN VIVO al leer el estado,
        // así un cambio de audio en el admin se refleja sin re-congelar la ruta.
        timeline_id: ev.id,
      });
    } else if (ev.action === 'evidence') {
      // Aviso breve en el chat (autoría o fallback) — la evidencia va al expediente.
      await svc.from('chat_messages').insert({
        session_id: ctx.session.id,
        role: 'commander',
        kind: 'text',
        content: payload.text || 'Detectives, peritajes acaba de entregar más material. Está en su expediente.',
      });
      const codes: string[] = [];
      const primary = payload.variant_codes?.[ctx.variantCode];
      if (primary) codes.push(primary);
      if (payload.also) codes.push(...payload.also);
      for (const c of codes) {
        await deliverEvidence(ctx, c, { elapsedMin, viaEvent: true });
      }
    }
    fired += 1;
  }

  return fired;
}
