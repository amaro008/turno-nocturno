-- ============================================================================
-- Seed reproducible del remap de contenido del Caso 001 al modelo F1.
-- Idempotente y sin UUIDs hardcodeados (matchea por slug/nombre/código).
-- Aplica DESPUÉS de la migración 0009. Registro de lo ejecutado vía MCP.
-- ============================================================================

do $$
declare c_id uuid;
begin
  select id into c_id from cases where slug = '001-ultima-transmision';
  if c_id is null then raise notice 'Caso 001 no existe; nada que hacer'; return; end if;

  -- ----- Ficha pública neutralizada + campos nuevos -----
  update suspects set
    distinctive_features = 'Cicatriz vertical en la ceja derecha. Reloj de pulsera plateado grande, muy visible en la muñeca izquierda al levantar el brazo.',
    physical_description = replace(physical_description, 'camisa de trabajo beige arremangada', 'camisa de trabajo arremangada'),
    typical_attire = 'Camisa de trabajo y pantalón de mezclilla.',
    accent_or_speech = 'Acento regiomontano, habla parca.'
   where case_id = c_id and full_name = 'Marcos Treviño';

  update suspects set
    distinctive_features = 'Anillo de plata con piedra granate en la mano izquierda, visible de cerca.',
    typical_attire = 'Blusa oscura de oficina, falda recta.',
    accent_or_speech = 'Voz clara y firme, dicción de locución.'
   where case_id = c_id and full_name = 'Elena Vidal';

  update suspects set
    distinctive_features = 'Anillo de graduación universitaria muy visible en la mano derecha.',
    typical_attire = 'Traje oscuro de buen corte.',
    accent_or_speech = 'Habla pausada, tono de autoridad.'
   where case_id = c_id and full_name = 'Fernando Ibarra';

  update suspects set
    distinctive_features = 'Lentes de aumento con montura de pasta negra gruesa. Padece nictalopía (ceguera nocturna) documentada.',
    typical_attire = 'Suéter tejido y falda larga.',
    accent_or_speech = 'Voz baja, algo nerviosa.',
    internal_notes = 'La nictalopía (no puede conducir de noche) contradice su coartada de haberse ido manejando.'
   where case_id = c_id and full_name = 'Silvia Rentería';

  update suspects set
    distinctive_features = 'Tatuaje de un cuervo en el cuello, autoinfligido y mal hecho. Le falta el dedo anular de la mano izquierda.',
    typical_attire = 'Chamarra de mezclilla gastada.',
    accent_or_speech = 'Habla rápida, jerga de oficio.'
   where case_id = c_id and full_name like 'Joaquin%';

  update suspects set
    distinctive_features = 'Collar con un dije que guarda el retrato de un familiar.',
    typical_attire = 'Blusa clara y falda de oficina.',
    accent_or_speech = 'Voz suave, trato amable.',
    internal_notes = 'El collar es relevante emocional para el personaje; NO es pista del crimen.'
   where case_id = c_id and full_name = 'Beatriz Campos';

  -- ----- Data por variante (admin-only) -----
  update suspect_variant_data svd set
    variant_specific_notes = 'Esa madrugada vestía prenda beige; su reloj plateado aparece en el VHS del pasillo y deja fibras beige en la mano del occiso.',
    motive_apparent = 'Salazar iba a exponer al aire su negocio de casetes pirata.'
   from suspects s, variants v
   where svd.suspect_id = s.id and svd.variant_id = v.id and s.case_id = c_id
     and s.full_name = 'Marcos Treviño' and v.code = 'A';

  update suspect_variant_data svd set
    variant_specific_notes = 'Su anillo de plata con granate aparece en la muñeca al cerrar la puerta en el VHS del lobby.',
    motive_apparent = 'Operaba el negocio de casetes pirata que Salazar iba a exponer.'
   from suspects s, variants v
   where svd.suspect_id = s.id and svd.variant_id = v.id and s.case_id = c_id
     and s.full_name = 'Elena Vidal' and v.code = 'B';

  update suspect_variant_data svd set
    variant_specific_notes = 'Su anillo de graduación aparece en la foto del acceso del patio.',
    motive_apparent = 'Tensiones financieras; Salazar iba a exponer un negocio de la estación.'
   from suspects s, variants v
   where svd.suspect_id = s.id and svd.variant_id = v.id and s.case_id = c_id
     and s.full_name = 'Fernando Ibarra' and v.code = 'C';

  update suspect_variant_data svd set
    variant_specific_notes = 'Su ausencia en todos los VHS de esa noche lo exonera en esta variante.'
   from suspects s, variants v
   where svd.suspect_id = s.id and svd.variant_id = v.id and s.case_id = c_id
     and s.full_name like 'Joaquin%' and v.code = 'C';

  -- ----- Evidencia: descripciones públicas + admin_notes (meta) -----
  update evidence_items set admin_notes = 'Red herring de la variante B: la falla exonera al ingeniero.' where case_id = c_id and code = 'MODULADOR-B';
  update evidence_items set admin_notes = 'Red herring: ubica al ingeniero saliendo antes del crimen; lo exonera.' where case_id = c_id and code = 'VHS-PASILLO-B';
  update evidence_document d set body_md = 'El registro marca una FALLA técnica real entre 02:05 y 02:55; el corte pudo ser accidental por la falla.'
    from evidence_items ei where ei.id = d.evidence_id and ei.case_id = c_id and ei.code = 'MODULADOR-B';
end $$;

-- Nota: la reclasificación de tipos (audio→testimony/record, document→record) y
-- las public_description por pieza se aplicaron vía MCP; ver docs/DATA-MODEL.md.
