-- ============================================================================
-- 0010 — Marca de víctima en personajes (Refactor F2).
-- Uno de los "suspects" del caso puede ser la víctima (is_victim=true). La
-- víctima no aparece en el grid de sospechosos del jugador ni entra al sorteo.
-- Rollback: alter table suspects drop column if exists is_victim;
-- ============================================================================
alter table suspects add column if not exists is_victim boolean not null default false;
