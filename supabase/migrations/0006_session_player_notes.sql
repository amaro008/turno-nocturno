-- ============================================================================
-- 0006 — Notas colaborativas de la mesa (Fase 4)
-- Persisten en la sesión y sobreviven a recargas.
-- ============================================================================

alter table sessions add column if not exists player_notes text not null default '';
