// ============================================================================
// CHAT STREAM — El Comandante en vivo (SSE, Anthropic).
// Persiste el mensaje del jugador, construye el system prompt (SIN culpable),
// transmite la respuesta y ejecuta la herramienta enviar_evidencia con gating.
// ============================================================================

import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { anthropic, COMMANDER_MODEL } from '@/lib/server/anthropic';
import { getSessionByCode, getCatalog, getDeliveredCodes, deliverEvidence } from '@/lib/server/game';
import { buildCommanderSystem, ENVIAR_EVIDENCIA_TOOL } from '@/lib/server/prompts/commander.build';
import { isExtractionAttempt } from '@/lib/server/guardrails';
import { canDeliver } from '@/lib/engine/evidence-gating';
import { minutesElapsed } from '@/lib/engine/timeline';
import { MAX_HINTS } from '@/lib/domain';
import type Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AnthropicMessage = Anthropic.MessageParam;

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return new Response('no-auth', { status: 401 });

  const body = (await req.json()) as { code?: string; message?: string; isHint?: boolean };
  const isHint = body.isHint === true;
  const message = (body.message ?? '').trim() || (isHint ? 'Necesitamos una pista, Comandante.' : '');
  if (!body.code || !message) return new Response('bad-request', { status: 400 });

  const ctx = await getSessionByCode(body.code, user.id);
  if (!ctx) return new Response('not-found', { status: 404 });

  const svc = createServiceClient();

  // 0) Pista: incrementar contador (con tope) y registrar telemetría
  if (isHint) {
    if (ctx.session.hints_used >= MAX_HINTS) {
      return new Response('no-hints', { status: 409 });
    }
    ctx.session.hints_used += 1;
    await svc.from('sessions').update({ hints_used: ctx.session.hints_used }).eq('id', ctx.session.id);
    await svc.from('session_events').insert({
      session_id: ctx.session.id,
      type: 'hint',
      payload: { n: ctx.session.hints_used },
    });
  }

  // 1) Persistir mensaje del jugador
  await svc.from('chat_messages').insert({
    session_id: ctx.session.id,
    role: 'players',
    kind: 'text',
    content: message,
  });

  // 2) Guardarraíl (telemetría, no bloquea)
  if (isExtractionAttempt(message)) {
    await svc.from('session_events').insert({
      session_id: ctx.session.id,
      type: 'guardrail_attempt',
      payload: { text: message.slice(0, 300) },
    });
  }

  // 3) Estado para el prompt
  const elapsedMin = ctx.session.activated_at ? minutesElapsed(ctx.session.activated_at) : 0;
  const catalog = await getCatalog(ctx.caseRow.id, ctx.variant.id);
  const delivered = await getDeliveredCodes(ctx.session.id);
  const deliveredSet = new Set(delivered);

  const deliveredEvidence = catalog
    .filter((e) => deliveredSet.has(e.code))
    .map((e) => ({ code: e.code, title: e.title }));

  const deliverableEvidence = catalog
    .filter((e) => !deliveredSet.has(e.code))
    .filter(
      (e) =>
        canDeliver(e.code, catalog, {
          variantId: ctx.variant.id,
          elapsedMin,
          unlockedCodes: delivered,
        }).ok,
    )
    .map((e) => ({ code: e.code, title: e.title }));

  const system = buildCommanderSystem({
    caseTitle: ctx.caseRow.title,
    city: ctx.caseRow.city,
    eraYear: ctx.caseRow.era_year,
    commanderContext: ctx.variant.commander_context,
    elapsedMin,
    timeLimitMin: ctx.caseRow.time_limit_min,
    deliveredEvidence,
    deliverableEvidence,
    hintsUsed: ctx.session.hints_used,
    maxHints: MAX_HINTS,
  });

  // 4) Historial → mensajes Anthropic
  const { data: history } = await svc
    .from('chat_messages')
    .select('role, kind, content')
    .eq('session_id', ctx.session.id)
    .order('at', { ascending: true })
    .limit(40);

  const messages: AnthropicMessage[] = [];
  for (const m of history ?? []) {
    if (m.role === 'players') {
      messages.push({ role: 'user', content: m.content });
    } else if (m.kind === 'evidence_card') {
      messages.push({ role: 'assistant', content: `He entregado la evidencia: ${m.content}` });
    } else if (m.kind === 'text' || m.kind === 'voice') {
      if (m.content) messages.push({ role: 'assistant', content: m.content });
    }
  }
  // Anthropic exige que el primer mensaje sea de rol user.
  if (messages.length === 0 || messages[0].role !== 'user') {
    messages.unshift({ role: 'user', content: '(Los detectives abren el expediente.)' });
  }

  const client = anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      let commanderText = '';

      async function streamTurn(
        msgs: AnthropicMessage[],
        withTools: boolean,
      ): Promise<Anthropic.Message> {
        const s = client.messages.stream({
          model: COMMANDER_MODEL,
          max_tokens: 700,
          system,
          messages: msgs,
          ...(withTools ? { tools: [ENVIAR_EVIDENCIA_TOOL] } : {}),
        });
        for await (const event of s) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            commanderText += event.delta.text;
            send({ type: 'text', delta: event.delta.text });
          }
        }
        return s.finalMessage();
      }

      try {
        // Turno 1 (con herramienta)
        const first = await streamTurn(messages, true);
        const toolUses = first.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );

        if (toolUses.length > 0) {
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            const code = String((tu.input as { code?: string }).code ?? '').trim();
            const res = await deliverEvidence(ctx, code, { elapsedMin });
            if (res.ok) {
              send({ type: 'evidence', item: res.item });
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: `Entregada la evidencia ${code} (${res.item.title}) a los detectives.`,
              });
            } else {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                is_error: true,
                content: `El archivo rechazó ${code}: ${res.reason}. Responde en personaje sin entregarla.`,
              });
            }
          }

          // Turno 2 (con el resultado de la herramienta, sin más herramientas)
          const followMessages: AnthropicMessage[] = [
            ...messages,
            { role: 'assistant', content: first.content },
            { role: 'user', content: toolResults },
          ];
          await streamTurn(followMessages, false);
        }

        // Persistir la respuesta final del Comandante
        if (commanderText.trim()) {
          await svc.from('chat_messages').insert({
            session_id: ctx.session.id,
            role: 'commander',
            kind: 'text',
            content: commanderText.trim(),
          });
        }

        // Marcar la sesión en progreso
        if (ctx.session.status === 'activated') {
          await svc.from('sessions').update({ status: 'in_progress' }).eq('id', ctx.session.id);
        }

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
