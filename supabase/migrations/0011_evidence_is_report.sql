-- ============================================================================
-- 0011 — Reporte inicial del caso (Refactor F4).
-- Marca UNA evidencia (type=document, initial=true) como el "reporte inicial":
-- el parte que se abre por defecto al entrar a la consola.
-- Rollback: alter table evidence_items drop column if exists is_report;
-- ============================================================================
alter table evidence_items add column if not exists is_report boolean not null default false;

update evidence_items ei set is_report = true
  from cases c where c.id = ei.case_id and c.slug = '001-ultima-transmision' and ei.code = 'PARTE-INFORME';
