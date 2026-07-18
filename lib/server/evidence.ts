// ============================================================================
// EVIDENCIA (SOLO servidor). Ensambla la base + contenido tipado en EvidenceFull,
// expone helpers de disponibilidad y un adaptador "legacy" para la consola actual.
// ============================================================================

import { createServiceClient } from './supabase';
import { signedUrl, SESSION_MEDIA_TTL } from './storage';
import {
  EVIDENCE_CONTENT_TABLE,
  evidenceMediaPath,
  evidenceText,
  type EvidenceBase,
  type EvidenceFull,
  type EvidenceType,
} from '@/lib/domain';

const BASE_COLS =
  'id, case_id, code, title, type, scope, variant_id, initial, unlocked_at_minute, unlocked_by_event_id, public_description, admin_notes, is_report';

/** Todas las piezas base (metadata) de un caso. */
export async function loadCaseEvidenceBase(caseId: string): Promise<EvidenceBase[]> {
  const svc = createServiceClient();
  const { data } = await svc.from('evidence_items').select(BASE_COLS).eq('case_id', caseId).order('code');
  return (data ?? []) as EvidenceBase[];
}

/** Carga el contenido de las piezas dadas y las ensambla como EvidenceFull. */
export async function assembleEvidence(bases: EvidenceBase[]): Promise<EvidenceFull[]> {
  if (bases.length === 0) return [];
  const svc = createServiceClient();

  // Agrupa ids por tipo y consulta cada tabla de contenido una vez.
  const byType = new Map<EvidenceType, string[]>();
  for (const b of bases) {
    const arr = byType.get(b.type) ?? [];
    arr.push(b.id);
    byType.set(b.type, arr);
  }
  const contentById = new Map<string, Record<string, unknown>>();
  await Promise.all(
    [...byType.entries()].map(async ([type, ids]) => {
      const { data } = await svc.from(EVIDENCE_CONTENT_TABLE[type]).select('*').in('evidence_id', ids);
      for (const row of (data ?? []) as { evidence_id: string }[]) {
        contentById.set(row.evidence_id, row as Record<string, unknown>);
      }
    }),
  );

  return bases.map((b) => assembleOne(b, contentById.get(b.id)));
}

/** Ensambla una pieza base + su fila de contenido (o defaults vacíos). */
export function assembleOne(base: EvidenceBase, content: Record<string, unknown> | undefined): EvidenceFull {
  const c = content ?? {};
  switch (base.type) {
    case 'document':
      return { ...base, type: 'document', content: { body_md: str(c.body_md), image_path: str(c.image_path), transcript: str(c.transcript) } };
    case 'photo':
      return { ...base, type: 'photo', content: { image_path: str(c.image_path), caption: str(c.caption), metadata: obj(c.metadata) } };
    case 'audio':
      return { ...base, type: 'audio', content: { audio_path: str(c.audio_path), duration_seconds: num(c.duration_seconds), transcript: str(c.transcript), speakers: arr(c.speakers) } };
    case 'video':
      return { ...base, type: 'video', content: { video_path: str(c.video_path), duration_seconds: num(c.duration_seconds), transcript: str(c.transcript), timestamps: arr(c.timestamps), frames_path: str(c.frames_path) } };
    case 'testimony':
      return { ...base, type: 'testimony', content: { witness_name: str(c.witness_name), body_md: str(c.body_md), audio_path: str(c.audio_path) } };
    case 'record':
      return { ...base, type: 'record', content: { record_type: str(c.record_type), body_md: str(c.body_md), image_path: str(c.image_path), structured_data: obj(c.structured_data) } };
  }
}

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

// -------------------------------------------------------------- Adaptador ---
// Forma "legacy" que consume la consola actual (se reemplaza en la fase de
// managers por tipo). NUNCA incluye admin_notes.
export interface LegacyPublicEvidence {
  id: string;
  code: string;
  kind: 'audio' | 'video' | 'document';
  type: EvidenceType;
  title: string;
  public_description: string;
  body_md: string | null;
  transcript: string | null;
  media_path: string | null;
  mediaUrl: string | null;
  // Extras tipados para los viewers de la consola:
  caption: string | null;
  witness_name: string | null;
  record_type: string | null;
}

function legacyKind(e: EvidenceFull): 'audio' | 'video' | 'document' {
  if (e.type === 'audio') return 'audio';
  if (e.type === 'video') return 'video';
  if (e.type === 'testimony') return e.content.audio_path ? 'audio' : 'document';
  return 'document';
}

/** Proyecta EvidenceFull a la forma legacy, firmando la URL de media (10 min). */
export async function toLegacyPublic(e: EvidenceFull): Promise<LegacyPublicEvidence> {
  const mediaPath = evidenceMediaPath(e);
  return {
    id: e.id,
    code: e.code,
    kind: legacyKind(e),
    type: e.type,
    title: e.title,
    public_description: e.public_description,
    body_md: e.type === 'document' || e.type === 'testimony' || e.type === 'record' ? e.content.body_md : null,
    transcript: e.type === 'audio' || e.type === 'video' ? e.content.transcript : null,
    media_path: mediaPath,
    mediaUrl: await signedUrl(mediaPath, SESSION_MEDIA_TTL),
    caption: e.type === 'photo' ? e.content.caption : null,
    witness_name: e.type === 'testimony' ? e.content.witness_name : null,
    record_type: e.type === 'record' ? e.content.record_type : null,
  };
}

// ----------------------------------------------------------------- Admin ----
export interface EvidenceContentInput {
  body_md?: string | null; transcript?: string | null; image_path?: string | null;
  audio_path?: string | null; video_path?: string | null; caption?: string | null;
  witness_name?: string | null; record_type?: string | null; duration_seconds?: number | null;
  frames_path?: string | null; metadata?: Record<string, unknown>; speakers?: unknown[];
  timestamps?: unknown[]; structured_data?: Record<string, unknown>;
}

/** Reemplaza (upsert) la fila de contenido según el tipo. */
export async function upsertEvidenceContent(evidenceId: string, type: EvidenceType, c: EvidenceContentInput): Promise<void> {
  const svc = createServiceClient();
  let row: Record<string, unknown>;
  switch (type) {
    case 'document': row = { body_md: c.body_md ?? null, image_path: c.image_path ?? null, transcript: c.transcript ?? null }; break;
    case 'photo': row = { image_path: c.image_path ?? null, caption: c.caption ?? null, metadata: c.metadata ?? {} }; break;
    case 'audio': row = { audio_path: c.audio_path ?? null, duration_seconds: c.duration_seconds ?? null, transcript: c.transcript ?? null, speakers: c.speakers ?? [] }; break;
    case 'video': row = { video_path: c.video_path ?? null, duration_seconds: c.duration_seconds ?? null, transcript: c.transcript ?? null, timestamps: c.timestamps ?? [], frames_path: c.frames_path ?? null }; break;
    case 'testimony': row = { witness_name: c.witness_name ?? null, body_md: c.body_md ?? null, audio_path: c.audio_path ?? null }; break;
    case 'record': row = { record_type: c.record_type ?? null, body_md: c.body_md ?? null, image_path: c.image_path ?? null, structured_data: c.structured_data ?? {} }; break;
  }
  await svc.from(EVIDENCE_CONTENT_TABLE[type]).upsert({ evidence_id: evidenceId, ...row }, { onConflict: 'evidence_id' });
}

/** Borra las filas de contenido de OTROS tipos (al cambiar el tipo de una pieza). */
export async function pruneOtherContent(evidenceId: string, keepType: EvidenceType): Promise<void> {
  const svc = createServiceClient();
  await Promise.all(
    (Object.keys(EVIDENCE_CONTENT_TABLE) as EvidenceType[])
      .filter((t) => t !== keepType)
      .map((t) => svc.from(EVIDENCE_CONTENT_TABLE[t]).delete().eq('evidence_id', evidenceId)),
  );
}
