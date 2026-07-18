// Tipos compartidos por la consola de sesión (espejo de /state).

export interface PublicEvidence {
  id: string;
  code: string;
  kind: 'audio' | 'video' | 'document';
  type: 'document' | 'photo' | 'audio' | 'video' | 'testimony' | 'record';
  title: string;
  public_description: string;
  body_md: string | null;
  transcript: string | null;
  media_path: string | null;
  mediaUrl: string | null;
  caption: string | null;
  witness_name: string | null;
  record_type: string | null;
}

export type EvType = 'document' | 'photo' | 'audio' | 'video' | 'testimony' | 'record';

export interface EvidenceListItem {
  id: string;
  code: string;
  title: string;
  type: EvType;
  scope: 'shared' | 'variant';
  public_description: string;
  open: boolean;
  unlocked_at_minute: number | null;
  is_report: boolean;
}

export interface SessionSuspect {
  id: string;
  full_name: string;
  age: number | null;
  occupation: string | null;
  relationship_to_victim: string | null;
  physical_description: string | null;
  distinctive_features: string | null;
  accent_or_speech: string | null;
  typical_attire: string | null;
  photoUrl: string | null;
}

export interface Msg {
  id: string;
  at: string;
  role: 'commander' | 'players';
  kind: 'text' | 'voice' | 'evidence_card' | 'system';
  content: string;
  voice_path: string | null;
  evidence_code: string | null;
  evidence: PublicEvidence | null;
}

export interface VerdictRow {
  accused: string;
  how_score: string;
  why_score: string;
  culprit_correct: boolean;
  total_score: number;
}

export interface SessionState {
  status: string;
  variantCode: string;
  secondsRemaining: number;
  hintsUsed: number;
  maxHints: number;
  playerNotes: string;
  case: { title: string; city: string; eraYear: number; timeLimitMin: number };
  commander: { name: string; role: string };
  messages: Msg[];
  evidence: PublicEvidence[];
  evidenceListing: EvidenceListItem[];
  suspects: SessionSuspect[];
  verdict: VerdictRow | null;
  resolvedNarrative: string | null;
  resolvedCulprit: string | null;
}

export type ExpTab =
  | 'reporte'
  | 'sospechosos'
  | 'documentos'
  | 'fotos'
  | 'audios'
  | 'videos'
  | 'testimonios'
  | 'registros'
  | 'notas'
  | 'codigos';
