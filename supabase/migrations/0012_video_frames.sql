-- ============================================================================
-- 0012: evidencia de video → secuencia de fotogramas (fotos con timestamp)
-- en vez de un archivo de video real. Generar video con IA es caro/inviable
-- para producción; una secuencia de imágenes fijas con hora "quemada" logra
-- el mismo efecto narrativo (repasar material de cámara) sin depender de eso.
-- ============================================================================

ALTER TABLE evidence_video ADD COLUMN frames jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: timestamps [{real_time,event}] -> frames [{time,caption,image_path:null}]
UPDATE evidence_video
SET frames = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'time', elem->>'real_time',
    'caption', elem->>'event',
    'image_path', NULL
  )), '[]'::jsonb)
  FROM jsonb_array_elements(timestamps) elem
)
WHERE jsonb_array_length(timestamps) > 0;

ALTER TABLE evidence_video DROP COLUMN video_path;
ALTER TABLE evidence_video DROP COLUMN duration_seconds;
ALTER TABLE evidence_video DROP COLUMN frames_path;
ALTER TABLE evidence_video DROP COLUMN timestamps;
