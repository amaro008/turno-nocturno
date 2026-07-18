// ============================================================================
// DOMINIO — Tipos y contratos compartidos cliente/servidor.
// Este módulo NO importa de nadie (solo define tipos y constantes).
// ============================================================================

// ---- Roles ----
export type UserRole = 'user' | 'admin';

// ---- Perfil ----
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  birth_year: number | null;
  country: string | null;
  city: string | null;
  role: UserRole;
  is_vip: boolean;
  is_blocked: boolean;
  accepted_terms_at: string | null;
  accepted_privacy_at: string | null;
  created_at: string;
}

// ---- Caso ----
export interface Case {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  city: string;
  era_year: number;
  era_profile: string;
  time_limit_min: number;
  briefing_voice_path: string | null;
  price_ref_mxn: number | null;
  validation_matrix: ValidationMatrix;
  cover_image_path: string | null;
  atmosphere_image_path: string | null;
  marketing_synopsis: string | null;
  difficulty: CaseDifficulty;
  players_min: number;
  players_max: number;
  // Dirección de arte (Iteración 3, Fase 3)
  art_direction: string;
  cover_image_prompt: string;
  hero_image_prompt: string;
  art_autoinject: boolean;
  active: boolean;
  created_at: string;
}

export type CaseDifficulty = 'facil' | 'medio' | 'dificil';

export const DIFFICULTY_LABEL: Record<CaseDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

/** Matriz de validación documental: evidenceCode → variantCode → celda */
export type ValidationMatrix = Record<
  string,
  Record<string, { consistent: boolean; note: string }>
>;

/** Perfiles de época disponibles (estética + post-fx). */
export const ERA_PROFILES = [
  { value: 'vhs-80s', label: 'VHS · años 80' },
  { value: 'cassette-90s', label: 'Cassette · años 90' },
  { value: 'cctv-2000s', label: 'CCTV · años 2000' },
  { value: 'smartphone-2010s', label: 'Smartphone · años 2010' },
  { value: 'default', label: 'Sin perfil' },
] as const;

// ---- Sospechoso (Refactor F1: público vs. variante) ----
export type {
  SuspectPublic,
  SuspectFull,
  SuspectVariantData,
  SuspectWithVariants,
} from './suspect';
export { SUSPECT_PUBLIC_COLUMNS, toSuspectPublic } from './suspect';

// ---- Prompt visual de un asset del caso (escena, VHS, evidencia) ----
export type VisualMediaKind = 'image' | 'video';
export type VisualStatus = 'pending' | 'generated' | 'approved';

export interface CaseVisualPrompt {
  id: string;
  case_id: string;
  variant_id: string | null;
  slot_name: string;
  media_kind: VisualMediaKind;
  prompt: string;
  negative_prompt: string;
  technical_params: Record<string, unknown>;
  reference_notes: string;
  generated_asset_path: string | null;
  status: VisualStatus;
  created_at: string;
}

// ---- Variante (culprit NUNCA se envía al cliente) ----
export interface Variant {
  id: string;
  case_id: string;
  code: string; // 'A' | 'B' | 'C'
  active: boolean;
  culprit: string;
  culprit_suspect_id: string | null;
  solution_narrative: string;
  solution_voice_path: string | null;
  commander_context: string;
  rubric: VerdictRubric;
}

export interface VerdictRubric {
  how_keywords: string[];
  why_keywords: string[];
  how_summary: string;
  why_summary: string;
}

// ---- Evidencia (Refactor F1: base + contenido tipado) ----
export type {
  EvidenceType,
  EvidenceScope,
  EvidenceBase,
  EvidenceFull,
  DocumentContent,
  PhotoContent,
  AudioContent,
  VideoContent,
  TestimonyContent,
  RecordContent,
} from './evidence';
export {
  isDocument,
  isPhoto,
  isAudio,
  isVideo,
  isTestimony,
  isRecord,
  EVIDENCE_CONTENT_TABLE,
  evidenceMediaPath,
  evidenceText,
} from './evidence';

// ---- Timeline de eventos temporales ----
export type TimelineAction = 'message' | 'voice' | 'evidence' | 'pressure' | 'deadline';

export interface TimelineEvent {
  id: string;
  case_id: string;
  minute: number;
  action: TimelineAction;
  payload: Record<string, unknown>;
  variant_scope: string | null; // null = todas las variantes
}

// ---- Sesión ----
export type SessionStatus =
  | 'created'
  | 'activated'
  | 'in_progress'
  | 'verdict_submitted'
  | 'resolved'
  | 'expired';

export interface GameSession {
  id: string;
  access_code_id: string;
  user_id: string;
  case_id: string;
  variant_id: string | null;
  status: SessionStatus;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  hints_used: number;
  player_notes: string;
}

// ---- Mensajes del chat ----
export type ChatRole = 'commander' | 'players';
export type ChatKind = 'text' | 'voice' | 'evidence_card' | 'system';

export interface ChatMessage {
  id: string;
  session_id: string;
  at: string;
  role: ChatRole;
  kind: ChatKind;
  content: string;
  voice_path: string | null;
  evidence_code: string | null;
}

// ---- Eventos de sesión (telemetría) ----
export type SessionEventType =
  | 'unlock'
  | 'hint'
  | 'timed_event_fired'
  | 'guardrail_attempt'
  | 'verdict_submitted'
  | 'evidence_requested';

export interface SessionEvent {
  id: string;
  session_id: string;
  at: string;
  type: SessionEventType;
  payload: Record<string, unknown>;
}

// ---- Veredicto ----
export type VerdictScore = 'correcto' | 'parcial' | 'incorrecto';

export interface Verdict {
  session_id: string;
  accused: string;
  how_text: string;
  why_text: string;
  culprit_correct: boolean;
  how_score: VerdictScore;
  why_score: VerdictScore;
  total_score: number;
  created_at: string;
}

// ---- Códigos de acceso ----
export type AccessCodeStatus =
  | 'draft'
  | 'sent'
  | 'redeemed'
  | 'activated'
  | 'in_progress'
  | 'completed'
  | 'expired';

export interface AccessCode {
  id: string;
  code: string;
  user_id: string;
  case_id: string;
  status: AccessCodeStatus;
  note: string | null;
  session_id: string | null;
  created_at: string;
  sent_at: string | null;
  redeemed_at: string | null;
  activated_at: string | null;
  completed_at: string | null;
}

// ---- Constantes de negocio ----
export const CODE_REDEEM_WINDOW_HOURS = 24; // desde sent_at para canjear
export const CODE_TOTAL_LIFE_DAYS = 5; // desde created_at, vida total
export const SESSION_WINDOW_HOURS = 24; // desde activated_at para completar
export const MAX_HINTS = 3;
export const HINT_PENALTY = 15; // puntos por pista
export const BASE_SCORE = 100;
