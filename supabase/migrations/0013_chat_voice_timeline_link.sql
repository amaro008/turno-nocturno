-- ============================================================================
-- 0013 — Vincula las notas de voz del Comandante a su evento del timeline.
--
-- Motivo: `processDueEvents` copiaba el `voice_path` al mensaje al dispararse
-- (snapshot). Si luego se cambiaba el audio del evento en el admin, las sesiones
-- ya iniciadas seguían reproduciendo el archivo viejo. Con este vínculo, el
-- servidor resuelve el audio EN VIVO desde el timeline al leer el estado, y el
-- `voice_path` guardado queda sólo como fallback histórico.
-- ============================================================================

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS timeline_id uuid REFERENCES case_timeline(id) ON DELETE SET NULL;
