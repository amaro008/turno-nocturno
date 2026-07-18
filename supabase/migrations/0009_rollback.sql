-- ============================================================================
-- ROLLBACK de 0009 — vuelve al modelo anterior (kind genérico + suspects mixto).
-- Nota: el contenido reclasificado a tablas por tipo se recupera a media_path/
-- body_md/transcript; las notas de variante (suspect_variant_data.alibi_declared)
-- se devuelven a suspects.alibi tomando la variante activa más baja por code.
-- Ejecutar solo si se revierte el despliegue del código de Fase 1.
-- ============================================================================

-- ===================================================== EVIDENCE (revert) =====
alter table evidence_items add column if not exists kind evidence_kind;
alter table evidence_items add column if not exists body_md text;
alter table evidence_items add column if not exists media_path text;
alter table evidence_items add column if not exists transcript text;
alter table evidence_items add column if not exists deliverable_from_minute int not null default 0;
alter table evidence_items add column if not exists delivery evidence_delivery not null default 'on_request';
alter table evidence_items add column if not exists unlocked_by text[] not null default '{}';

update evidence_items set kind = case type
  when 'audio' then 'audio'::evidence_kind
  when 'video' then 'video'::evidence_kind
  else 'document'::evidence_kind end;

update evidence_items e set body_md = d.body_md, media_path = d.image_path, transcript = d.transcript
  from evidence_document d where d.evidence_id = e.id;
update evidence_items e set media_path = a.audio_path, transcript = a.transcript
  from evidence_audio a where a.evidence_id = e.id;
update evidence_items e set media_path = v.video_path, transcript = v.transcript
  from evidence_video v where v.evidence_id = e.id;
update evidence_items e set media_path = p.image_path, body_md = p.caption
  from evidence_photo p where p.evidence_id = e.id;
update evidence_items e set body_md = t.body_md, media_path = t.audio_path
  from evidence_testimony t where t.evidence_id = e.id;
update evidence_items e set body_md = r.body_md, media_path = r.image_path
  from evidence_record r where r.evidence_id = e.id;

update evidence_items set deliverable_from_minute = coalesce(unlocked_at_minute, 0);

drop table if exists evidence_document, evidence_photo, evidence_audio,
  evidence_video, evidence_testimony, evidence_record;

alter table evidence_items drop column if exists type;
alter table evidence_items drop column if exists initial;
alter table evidence_items drop column if exists unlocked_at_minute;
alter table evidence_items drop column if exists unlocked_by_event_id;
alter table evidence_items drop column if exists public_description;
alter table evidence_items drop column if exists admin_notes;
drop type if exists evidence_type;

-- ===================================================== SUSPECTS (revert) =====
alter table suspects add column if not exists description text;
alter table suspects add column if not exists alibi text;

-- Recuperar alibi desde la variante de menor code por sospechoso.
update suspects s set alibi = svd.alibi_declared
  from (
    select distinct on (suspect_id) suspect_id, alibi_declared
    from suspect_variant_data
    order by suspect_id, variant_id
  ) svd
 where svd.suspect_id = s.id;

drop table if exists suspect_variant_data;

alter table suspects drop column if exists accent_or_speech;
alter table suspects drop column if exists typical_attire;
alter table suspects drop column if exists internal_notes;
alter table suspects rename column relationship_to_victim to relation;
alter table suspects rename column full_name to name;
