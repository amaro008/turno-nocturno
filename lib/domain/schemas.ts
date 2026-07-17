// ============================================================================
// Esquemas Zod compartidos (cliente + servidor). Validan los payloads del
// módulo de gestión de casos del admin.
// ============================================================================

import { z } from 'zod';

export const caseGeneralSchema = z.object({
  title: z.string().min(2, 'Título muy corto').max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  synopsis: z.string().max(2000).default(''),
  city: z.string().min(1, 'Falta la ciudad').max(80),
  era_year: z.coerce.number().int().min(1900).max(2100),
  era_profile: z.string().min(1),
  time_limit_min: z.coerce.number().int().min(30).max(360).default(150),
  price_ref_mxn: z.coerce.number().int().min(0).max(100000).nullable().optional(),
  active: z.boolean().default(false),
  briefing_voice_path: z.string().nullable().optional(),
  // Marketing (Fase 2)
  cover_image_path: z.string().nullable().optional(),
  atmosphere_image_path: z.string().nullable().optional(),
  marketing_synopsis: z.string().max(3000).nullable().optional(),
  difficulty: z.enum(['facil', 'medio', 'dificil']).optional(),
  players_min: z.coerce.number().int().min(1).max(12).optional(),
  players_max: z.coerce.number().int().min(1).max(12).optional(),
});
export type CaseGeneralInput = z.infer<typeof caseGeneralSchema>;

// Payload del tab Marketing (subconjunto que se guarda vía PATCH)
export const caseMarketingSchema = z.object({
  cover_image_path: z.string().nullable().optional(),
  atmosphere_image_path: z.string().nullable().optional(),
  marketing_synopsis: z.string().max(3000).nullable().optional(),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  players_min: z.coerce.number().int().min(1).max(12),
  players_max: z.coerce.number().int().min(1).max(12),
});
export type CaseMarketingInput = z.infer<typeof caseMarketingSchema>;

export const suspectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Falta el nombre').max(120),
  age: z.coerce.number().int().min(1).max(120).nullable().optional(),
  occupation: z.string().max(120).nullable().optional(),
  relation: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  alibi: z.string().max(1000).nullable().optional(),
  photo_path: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
});
export type SuspectInput = z.infer<typeof suspectSchema>;

export const evidenceKind = z.enum(['audio', 'video', 'document', 'hint']);
export const evidenceScope = z.enum(['shared', 'variant']);
export const evidenceDelivery = z.enum(['chat_push', 'on_request', 'code_only']);

export const evidenceSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(2, 'Código muy corto')
    .max(40)
    .regex(/^[A-Z0-9-]+$/, 'Mayúsculas, números y guiones (ej. CINTA-0158)'),
  kind: evidenceKind,
  scope: evidenceScope,
  variant_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Falta el título').max(160),
  body_md: z.string().nullable().optional(),
  media_path: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  unlocked_by: z.array(z.string()).default([]),
  deliverable_from_minute: z.coerce.number().int().min(0).max(360).default(0),
  delivery: evidenceDelivery.default('on_request'),
});
export type EvidenceInput = z.infer<typeof evidenceSchema>;

export const rubricSchema = z.object({
  how_summary: z.string().default(''),
  how_keywords: z.array(z.string()).default([]),
  why_summary: z.string().default(''),
  why_keywords: z.array(z.string()).default([]),
});

export const variantSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.enum(['A', 'B', 'C']),
  active: z.boolean().default(true),
  culprit_suspect_id: z.string().uuid({ message: 'Selecciona el culpable' }),
  solution_narrative: z.string().default(''),
  solution_voice_path: z.string().nullable().optional(),
  commander_context: z.string().default(''),
  rubric: rubricSchema.default({ how_summary: '', how_keywords: [], why_summary: '', why_keywords: [] }),
});
export type VariantInput = z.infer<typeof variantSchema>;

export const timelineAction = z.enum(['message', 'voice', 'evidence', 'pressure', 'deadline']);

export const timelineSchema = z.object({
  id: z.string().uuid().optional(),
  minute: z.coerce.number().int().min(0).max(360),
  action: timelineAction,
  variant_scope: z.string().nullable().optional(), // null = todas
  payload: z.record(z.any()).default({}),
});
export type TimelineInput = z.infer<typeof timelineSchema>;

// Operaciones CRUD genéricas para sub-entidades
export const crudOp = z.enum(['create', 'update', 'delete', 'reorder']);
