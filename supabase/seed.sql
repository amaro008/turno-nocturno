-- ============================================================================
-- SEED — Caso 001 "La Última Transmisión" (Monterrey, 1989)
-- Variantes A (Treviño) y B (Vidal). C queda diseñada, no producida (active=false).
-- Media_path va en null: el juego funciona en texto; los medios se suben aparte.
-- Re-ejecutable: borra el caso 001 y lo recrea (cascada).
-- ============================================================================

delete from cases where slug = '001-ultima-transmision';

do $$
declare
  v_case uuid;
  v_a uuid;  -- variante A (Treviño)
  v_b uuid;  -- variante B (Vidal)
begin
  -- ---- CASO ----
  insert into cases (slug, title, synopsis, city, era_year, era_profile, time_limit_min, active)
  values (
    '001-ultima-transmision',
    'La Última Transmisión',
    'Un locutor nocturno de Radio Norte es hallado sin vida en la cabina la madrugada del 27 de octubre de 1989. Su última transmisión cortó a las 02:49. Veintiún minutos sin testigos hasta el hallazgo.',
    'Monterrey', 1989, 'vhs-80s', 150, true
  ) returning id into v_case;

  -- ---- VARIANTE A: Marcos Treviño (ingeniero) ----
  insert into variants (case_id, code, active, culprit, commander_context, solution_narrative, rubric)
  values (
    v_case, 'A', true, 'Marcos Treviño',
    'Contexto del expediente (no reveles quién es el culpable): Rodrigo Salazar iba a exponer al aire, a las 03:00, un negocio de casetes pirata de llamadas confidenciales. La bitácora del vigilante registra un ingreso a las 02:28. La sala de moduladores fue ajustada manualmente a las 02:31 y el registro no muestra ninguna falla técnica esa noche. La cinta del pasillo capta a una figura con ropa beige a las 02:29 y 02:41. El forense reporta fibras beige en la mano del occiso. El ingeniero de guardia tenía acceso a la sala de moduladores.',
    'Marcos Treviño, ingeniero de la estación, silenció a Salazar para que no expusiera su negocio de casetes pirata. Ingresó a las 02:28, ajustó el modulador a las 02:31 para encubrir el corte, y dejó fibras beige en el forcejeo. La cinta del pasillo lo ubica en la escena a las 02:29 y 02:41.',
    '{"how_summary":"Treviño ingresa 02:28, ajusta el modulador 02:31 sin falla real, la cinta del pasillo lo ubica 02:29/02:41 y hay fibras beige.","how_keywords":["modulador","02:31","fibras beige","pasillo","02:29","sin falla"],"why_summary":"Salazar iba a exponer al aire el negocio de casetes pirata de Treviño a las 03:00.","why_keywords":["casetes pirata","exponer","03:00","llamadas confidenciales"]}'::jsonb
  ) returning id into v_a;

  -- ---- VARIANTE B: Elena Vidal (productora) ----
  insert into variants (case_id, code, active, culprit, commander_context, solution_narrative, rubric)
  values (
    v_case, 'B', true, 'Elena Vidal',
    'Contexto del expediente (no reveles quién es el culpable): el negocio de casetes pirata lo operaba la productora; el locatario de Audio Rey es su primo. Un ticket de estacionamiento marca las 01:26, en contradicción con la declaración de haber salido a las 02:10. La cinta del lobby muestra una salida a la 01:20 y un regreso a la 01:45. El forense reporta fibras color guinda. El registro de moduladores SÍ marca una falla real entre 02:05 y 02:55, lo que exonera al ingeniero. La cinta del pasillo ubica al ingeniero saliendo a las 02:33, antes de la ventana del crimen.',
    'Elena Vidal, productora, dirigía el negocio de casetes pirata (su primo es el locatario de Audio Rey). Salió a la 01:20 y regresó a la 01:45; su ticket de las 01:26 desmiente su coartada de las 02:10. Dejó fibras guinda. El modulador registra una falla real 02:05-02:55, que exonera a Treviño, a quien la cinta del pasillo ubica saliendo a las 02:33.',
    '{"how_summary":"El ticket 01:26 rompe su coartada de 02:10; la cinta del lobby la ubica saliendo 01:20 y regresando 01:45; fibras guinda; el modulador tuvo falla real 02:05-02:55 que exonera a Treviño.","how_keywords":["ticket","01:26","lobby","fibras guinda","falla del modulador","coartada"],"why_summary":"Ella operaba el negocio de casetes pirata; su primo es el locatario de Audio Rey y Salazar iba a delatarla.","why_keywords":["casetes pirata","primo","Audio Rey","operaba el negocio"]}'::jsonb
  ) returning id into v_b;

  -- ---- VARIANTE C: diseñada, no producida ----
  insert into variants (case_id, code, active, culprit, commander_context, solution_narrative, rubric)
  values (v_case, 'C', false, 'Fernando Ibarra',
    'Diseñada, no producida en MVP.', 'Diseñada, no producida en MVP.', '{}'::jsonb);

  -- ---- EVIDENCIA COMPARTIDA (shared) ----
  insert into evidence_items (case_id, code, kind, scope, title, body_md, transcript, deliverable_from_minute, delivery) values
  (v_case, 'PARTE-INFORME', 'document', 'shared', 'Parte informativo 89-1027-H',
    'Occiso: Rodrigo Salazar, 41, locutor nocturno de Radio Norte. Hallado en cabina a las 03:10 por el velador. Causa: asfixia. Última transmisión al aire cortó a las 02:49. No hay señales de robo.',
    null, 0, 'chat_push'),
  (v_case, 'CROQUIS', 'document', 'shared', 'Croquis de la estación',
    'Planta baja de Radio Norte: acceso principal (lobby con cámara), pasillo hacia cabina (cámara), sala de moduladores (sin cámara), patio trasero, caseta de vigilante.',
    null, 0, 'chat_push'),
  (v_case, 'FICHAS', 'document', 'shared', 'Fichas de sospechosos',
    'Marcos Treviño (ingeniero, acceso a moduladores). Elena Vidal (productora, cierra la cabina). Fernando Ibarra (dueño de la estación).',
    null, 0, 'chat_push'),
  (v_case, 'CINTA-0158', 'audio', 'shared', 'CINTA-0158 · Cabina',
    null,
    'Transmisión de Salazar. Al fondo, hacia el final, se oye una puerta y una segunda voz apagada. Corta abruptamente.',
    0, 'on_request'),
  (v_case, 'TEL-0223', 'audio', 'shared', 'TEL-0223 · Registro Telmex',
    null,
    'Llamada saliente de la estación a las 02:23 hacia un domicilio particular. Duración 40 segundos.',
    0, 'on_request'),
  (v_case, 'EMERG-0249', 'audio', 'shared', 'EMERG-0249 · Emergencias',
    null,
    'Reporte del velador a las 03:12: "El señor Salazar no responde, la puerta de la cabina estaba entreabierta".',
    0, 'on_request');

  -- ---- EVIDENCIA VARIANTE A ----
  insert into evidence_items (case_id, variant_id, code, kind, scope, title, body_md, transcript, deliverable_from_minute, delivery) values
  (v_case, v_a, 'MODULADOR-A', 'document', 'variant', 'Registro del modulador (A)',
    'La sala de moduladores fue ajustada manualmente a las 02:31. El registro NO muestra ninguna falla técnica esa noche: el corte de la transmisión fue provocado, no accidental.',
    null, 45, 'on_request'),
  (v_case, v_a, 'VHS-PASILLO-A', 'video', 'variant', 'VHS Pasillo (A)',
    'Realce moderno de la cinta del pasillo: una figura con ropa beige aparece a las 02:29 y de nuevo a las 02:41, en dirección a la cabina.',
    'Figura de complexión media, chamarra beige, 02:29 y 02:41.', 45, 'chat_push'),
  (v_case, v_a, 'INT-TREV-A', 'audio', 'variant', 'Interrogatorio Treviño (A)',
    null,
    'Treviño afirma haber salido "temprano" pero no precisa la hora y se contradice sobre si entró a la sala de moduladores.',
    60, 'on_request'),
  (v_case, v_a, 'FORENSE-A', 'document', 'variant', 'Forense (A)',
    'Fibras textiles color beige halladas en la mano derecha del occiso, compatibles con forcejeo.',
    null, 30, 'on_request'),
  (v_case, v_a, 'BITACORA-A', 'document', 'variant', 'Bitácora del vigilante (A)',
    'Registro de ingresos: 02:28 — entra personal técnico por acceso principal. Sin salida registrada hasta 02:52.',
    null, 30, 'on_request');

  -- ---- EVIDENCIA VARIANTE B ----
  insert into evidence_items (case_id, variant_id, code, kind, scope, title, body_md, transcript, deliverable_from_minute, delivery) values
  (v_case, v_b, 'TICKET-B', 'document', 'variant', 'Ticket de estacionamiento (B)',
    'Ticket sellado a las 01:26, en contradicción con la declaración de la productora de haber salido a las 02:10.',
    null, 45, 'chat_push'),
  (v_case, v_b, 'VHS-LOBBY-B', 'video', 'variant', 'VHS Lobby (B)',
    'Cámara del lobby: la productora sale a la 01:20 y regresa a la 01:45. Después ya no vuelve a aparecer saliendo.',
    'Salida 01:20, regreso 01:45.', 45, 'chat_push'),
  (v_case, v_b, 'VHS-PASILLO-B', 'video', 'variant', 'VHS Pasillo (B)',
    'Realce del pasillo: el ingeniero aparece SALIENDO a las 02:33, antes de la ventana del crimen. (Red herring: lo exonera.)',
    'Ingeniero saliendo 02:33.', 45, 'on_request'),
  (v_case, v_b, 'MODULADOR-B', 'document', 'variant', 'Registro del modulador (B)',
    'El registro marca una FALLA técnica real entre 02:05 y 02:55. El corte pudo ser accidental por la falla; esto exonera al ingeniero.',
    null, 45, 'on_request'),
  (v_case, v_b, 'FORENSE-B', 'document', 'variant', 'Forense (B)',
    'Fibras textiles color guinda halladas en la mano del occiso.',
    null, 30, 'on_request'),
  (v_case, v_b, 'LOCATARIO-B', 'audio', 'variant', 'Locatario Audio Rey (B)',
    null,
    'El locatario de Audio Rey declara: "Una señorita mandaba los encargos de los casetes. Es de la familia".',
    60, 'on_request');

  -- ---- TIMELINE (default 150 min) ----
  -- Eventos de evidencia variante-específicos: el código se resuelve por variante
  -- en payload.variant_codes (dentro del UNIQUE(case_id,minute,action)).
  insert into case_timeline (case_id, minute, action, variant_scope, payload) values
  (v_case, 0, 'voice', null,
    '{"text":"Detective. Habla el Comandante. Reabrimos el expediente 89-1027-H. Revisen el parte y escuchen la cinta. El reloj ya corre.","transcript":"Briefing inicial del Comandante."}'::jsonb),
  (v_case, 0, 'evidence', null,
    '{"variant_codes":{"A":"PARTE-INFORME","B":"PARTE-INFORME"},"also":["CROQUIS","FICHAS"],"text":"Ahí tienen el parte, el croquis y las fichas. Empiecen por la ventana sin testigos."}'::jsonb),
  (v_case, 45, 'evidence', null,
    '{"variant_codes":{"A":"VHS-PASILLO-A","B":"VHS-LOBBY-B"},"text":"El laboratorio devolvió un peritaje moderno sobre una de las cintas. Miren bien."}'::jsonb),
  (v_case, 75, 'voice', null,
    '{"text":"¿Ya tienen una línea de investigación? Si andan perdidos, los documentos aburridos suelen guardar la hora exacta.","transcript":"El Comandante pide avances."}'::jsonb),
  (v_case, 105, 'message', null,
    '{"text":"El Ministerio Público me está presionando. Necesito algo sólido: quién estuvo, a qué hora, y qué lo rompe."}'::jsonb),
  (v_case, 135, 'voice', null,
    '{"text":"Se acaba el turno, detectives. Última llamada. Preparen su veredicto.","transcript":"Ultimátum del Comandante."}'::jsonb),
  (v_case, 150, 'deadline', null,
    '{"text":"Se acabó el tiempo. Necesito su veredicto ahora: quién, cómo y por qué."}'::jsonb);

  raise notice 'Seed Caso 001 completado. case=%, A=%, B=%', v_case, v_a, v_b;
end $$;
