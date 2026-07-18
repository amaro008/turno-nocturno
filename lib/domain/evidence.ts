// ============================================================================
// DOMINIO — Evidencia tipada (Refactor F1). Base común + contenido por tipo,
// como unión discriminada por `type`. El cliente solo ve `public_description`
// en el listado; el `content` se carga al abrir una pieza YA disponible.
// ============================================================================

export type EvidenceType = 'document' | 'photo' | 'audio' | 'video' | 'testimony' | 'record';
export type EvidenceScope = 'shared' | 'variant';

/** Campos comunes (tabla evidence_items). `admin_notes` nunca sale al cliente. */
export interface EvidenceBase {
  id: string;
  case_id: string | null;
  code: string;
  title: string;
  type: EvidenceType;
  scope: EvidenceScope;
  variant_id: string | null;
  initial: boolean;
  unlocked_at_minute: number | null;
  unlocked_by_event_id: string | null;
  public_description: string;
  admin_notes: string;
  is_report: boolean;
}

export interface DocumentContent { body_md: string | null; image_path: string | null; transcript: string | null; }
export interface PhotoContent { image_path: string | null; caption: string | null; metadata: Record<string, unknown>; }
export interface AudioContent { audio_path: string | null; duration_seconds: number | null; transcript: string | null; speakers: unknown[]; }
export interface VideoContent { video_path: string | null; duration_seconds: number | null; transcript: string | null; timestamps: unknown[]; frames_path: string | null; }
export interface TestimonyContent { witness_name: string | null; body_md: string | null; audio_path: string | null; }
export interface RecordContent { record_type: string | null; body_md: string | null; image_path: string | null; structured_data: Record<string, unknown>; }

export type EvidenceFull =
  | (EvidenceBase & { type: 'document'; content: DocumentContent })
  | (EvidenceBase & { type: 'photo'; content: PhotoContent })
  | (EvidenceBase & { type: 'audio'; content: AudioContent })
  | (EvidenceBase & { type: 'video'; content: VideoContent })
  | (EvidenceBase & { type: 'testimony'; content: TestimonyContent })
  | (EvidenceBase & { type: 'record'; content: RecordContent });

// ---- Type guards ----
export const isDocument = (e: EvidenceFull): e is EvidenceBase & { type: 'document'; content: DocumentContent } => e.type === 'document';
export const isPhoto = (e: EvidenceFull): e is EvidenceBase & { type: 'photo'; content: PhotoContent } => e.type === 'photo';
export const isAudio = (e: EvidenceFull): e is EvidenceBase & { type: 'audio'; content: AudioContent } => e.type === 'audio';
export const isVideo = (e: EvidenceFull): e is EvidenceBase & { type: 'video'; content: VideoContent } => e.type === 'video';
export const isTestimony = (e: EvidenceFull): e is EvidenceBase & { type: 'testimony'; content: TestimonyContent } => e.type === 'testimony';
export const isRecord = (e: EvidenceFull): e is EvidenceBase & { type: 'record'; content: RecordContent } => e.type === 'record';

/** Nombre de la tabla de contenido para un tipo dado. */
export const EVIDENCE_CONTENT_TABLE: Record<EvidenceType, string> = {
  document: 'evidence_document',
  photo: 'evidence_photo',
  audio: 'evidence_audio',
  video: 'evidence_video',
  testimony: 'evidence_testimony',
  record: 'evidence_record',
};

/** Ruta del media asociado (para firmar la URL), según el tipo. */
export function evidenceMediaPath(e: EvidenceFull): string | null {
  switch (e.type) {
    case 'document': return e.content.image_path;
    case 'photo': return e.content.image_path;
    case 'audio': return e.content.audio_path;
    case 'video': return e.content.video_path;
    case 'testimony': return e.content.audio_path;
    case 'record': return e.content.image_path;
  }
}

/** Texto principal (cuerpo/transcripción) para búsqueda o vista de texto. */
export function evidenceText(e: EvidenceFull): string | null {
  switch (e.type) {
    case 'document': return e.content.body_md ?? e.content.transcript;
    case 'photo': return e.content.caption;
    case 'audio': return e.content.transcript;
    case 'video': return e.content.transcript;
    case 'testimony': return e.content.body_md;
    case 'record': return e.content.body_md;
  }
}
