// ============================================================================
// ANTHROPIC — Cliente del Comandante (SOLO servidor).
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const COMMANDER_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';
export const EVAL_MODEL = process.env.ANTHROPIC_EVAL_MODEL ?? COMMANDER_MODEL;
