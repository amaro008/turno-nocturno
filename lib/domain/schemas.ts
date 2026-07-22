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
  full_name: z.string().min(1, 'Falta el nombre').max(120),
  age: z.coerce.number().int().min(1).max(120).nullable().optional(),
  occupation: z.string().max(400).nullable().optional(),
  relationship_to_victim: z.string().max(600).nullable().optional(),
  photo_path: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  // Ficha pública neutra
  physical_description: z.string().max(3000).nullable().optional(),
  distinctive_features: z.string().max(3000).nullable().optional(),
  accent_or_speech: z.string().max(1000).nullable().optional(),
  typical_attire: z.string().max(1000).nullable().optional(),
  is_victim: z.boolean().default(false),
  // Admin-only
  internal_notes: z.string().max(12000).nullable().optional(),
  image_prompt: z.string().max(6000).nullable().optional(),
  // Data por variante (se upserta junto con el sospechoso)
  variant_data: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        alibi_declared: z.string().max(3000).nullable().optional(),
        motive_apparent: z.string().max(3000).nullable().optional(),
        variant_specific_notes: z.string().max(8000).nullable().optional(),
        is_culprit_in_variant: z.boolean().default(false),
      }),
    )
    .optional(),
});
export type SuspectInput = z.infer<typeof suspectSchema>;

// ---- Dirección de arte del caso ----
export const artDirectionSchema = z.object({
  art_direction: z.string().max(4000).default(''),
  cover_image_prompt: z.string().max(4000).default(''),
  hero_image_prompt: z.string().max(4000).default(''),
  art_autoinject: z.boolean().default(true),
});
export type ArtDirectionInput = z.infer<typeof artDirectionSchema>;

// ---- Prompt visual (asset adicional) ----
export const visualPromptSchema = z.object({
  id: z.string().uuid().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  slot_name: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_-]+$/, 'Minúsculas, números, guiones y guion bajo'),
  media_kind: z.enum(['image', 'video']),
  prompt: z.string().max(6000).default(''),
  negative_prompt: z.string().max(2000).default(''),
  technical_params: z.record(z.any()).default({}),
  reference_notes: z.string().max(2000).default(''),
  generated_asset_path: z.string().nullable().optional(),
  status: z.enum(['pending', 'generated', 'approved']).default('pending'),
});
export type VisualPromptInput = z.infer<typeof visualPromptSchema>;

export const evidenceType = z.enum(['document', 'photo', 'audio', 'video', 'testimony', 'record']);
export const evidenceScope = z.enum(['shared', 'variant']);

/** Contenido por tipo (flexible; el route toma solo lo que aplica al tipo). */
export const evidenceContentSchema = z
  .object({
    body_md: z.string().nullable().optional(),
    transcript: z.string().nullable().optional(),
    image_path: z.string().nullable().optional(),
    audio_path: z.string().nullable().optional(),
    video_path: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    witness_name: z.string().max(160).nullable().optional(),
    record_type: z.string().max(160).nullable().optional(),
    duration_seconds: z.coerce.number().int().min(0).nullable().optional(),
    frames_path: z.string().nullable().optional(),
    metadata: z.record(z.any()).optional(),
    speakers: z.array(z.any()).optional(),
    timestamps: z.array(z.any()).optional(),
    structured_data: z.record(z.any()).optional(),
  })
  .default({});

export const evidenceSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(2, 'Código muy corto')
    .max(40)
    .regex(/^[A-Z0-9-]+$/, 'Mayúsculas, números y guiones (ej. CINTA-0158)'),
  type: evidenceType,
  scope: evidenceScope,
  variant_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Falta el título').max(160),
  public_description: z.string().max(600).default(''),
  admin_notes: z.string().max(4000).default(''),
  initial: z.boolean().default(false),
  unlocked_at_minute: z.coerce.number().int().min(0).max(360).nullable().optional(),
  unlocked_by_event_id: z.string().uuid().nullable().optional(),
  is_report: z.boolean().default(false),
  content: evidenceContentSchema,
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
