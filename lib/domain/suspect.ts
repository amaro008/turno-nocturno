// ============================================================================
// DOMINIO — Sospechosos. Separación tajante público vs. variante (Refactor F1).
//   SuspectPublic  → lo ÚNICO que llega al cliente. Igual sin importar la variante.
//   SuspectFull    → admin (incluye internal_notes + arte).
//   SuspectVariantData → ADMIN-ONLY + subset autorizado del Comandante.
// ============================================================================

/** Ficha pública neutra del sospechoso (segura para el cliente). */
export interface SuspectPublic {
  id: string;
  case_id: string;
  sort_order: number;
  full_name: string;
  age: number | null;
  occupation: string | null;
  /** Vínculo objetivo con la víctima, sin cargas ("empleado de la empresa"). */
  relationship_to_victim: string | null;
  physical_description: string;
  /** Marcas visibles/observables (pueden ser pistas, pero no son secretas). */
  distinctive_features: string;
  accent_or_speech: string | null;
  typical_attire: string | null;
  photo_path: string | null;
}

/** Ficha completa (admin). Nunca se serializa al cliente. */
export interface SuspectFull extends SuspectPublic {
  internal_notes: string | null;
  image_prompt: string;
  created_at: string;
}

/** Data por variante (coartada, móvil, culpabilidad). ADMIN-ONLY. */
export interface SuspectVariantData {
  id: string;
  suspect_id: string;
  variant_id: string;
  alibi_declared: string | null;
  motive_apparent: string | null;
  variant_specific_notes: string | null;
  is_culprit_in_variant: boolean;
}

/** Columnas seguras para SELECT de la ficha pública (sin internal_notes ni arte). */
export const SUSPECT_PUBLIC_COLUMNS =
  'id, case_id, sort_order, full_name, age, occupation, relationship_to_victim, physical_description, distinctive_features, accent_or_speech, typical_attire, photo_path';

/** Proyecta una fila completa a su versión pública (defensa en profundidad). */
export function toSuspectPublic(s: SuspectFull): SuspectPublic {
  return {
    id: s.id,
    case_id: s.case_id,
    sort_order: s.sort_order,
    full_name: s.full_name,
    age: s.age,
    occupation: s.occupation,
    relationship_to_victim: s.relationship_to_victim,
    physical_description: s.physical_description,
    distinctive_features: s.distinctive_features,
    accent_or_speech: s.accent_or_speech,
    typical_attire: s.typical_attire,
    photo_path: s.photo_path,
  };
}
