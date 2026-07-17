// Genera el Markdown de la "Guía de Arte" de un caso (para content/casos/{slug}/).
import type { Case, Suspect, CaseVisualPrompt, Variant } from '@/lib/domain';

export function buildArtGuideMarkdown(
  caseRow: Case,
  suspects: Suspect[],
  visualPrompts: CaseVisualPrompt[],
  variants: Variant[],
): string {
  const variantCode = (id: string | null) => variants.find((v) => v.id === id)?.code ?? '—';
  const now = new Date().toISOString().slice(0, 10);

  const parts: string[] = [
    `# Guía de Arte — ${caseRow.title}`,
    `**Caso:** \`${caseRow.slug}\` · ${caseRow.city} ${caseRow.era_year} · generada ${now}`,
    '',
    '> Archivo autogenerado desde el módulo de Dirección de Arte del admin. Copia y pega los',
    '> prompts en tu generador (Midjourney / DALL·E 3 / Ideogram / Flux para imágenes; Kling /',
    '> Veo / Runway para video).',
    '',
    '## Dirección de arte del caso',
    '```',
    caseRow.art_direction || '(sin definir)',
    '```',
    `Auto-inyección del estilo en prompts: **${caseRow.art_autoinject ? 'activada' : 'desactivada'}**`,
    '',
    '## Portada del caso',
    '```',
    caseRow.cover_image_prompt || '(sin definir)',
    '```',
    '',
    '## Imagen hero (detalle)',
    '```',
    caseRow.hero_image_prompt || '(sin definir)',
    '```',
    '',
    '## Sospechosos',
  ];

  for (const s of suspects) {
    parts.push(
      `### ${s.name}${s.occupation ? ` — ${s.occupation}` : ''}`,
      s.physical_description ? `**Físico:** ${s.physical_description}` : '',
      s.distinctive_features ? `**Rasgos distintivos:** ${s.distinctive_features}` : '',
      '```',
      s.image_prompt || '(prompt sin generar)',
      '```',
      '',
    );
  }

  parts.push('## Assets adicionales (escena, VHS, evidencia)');
  if (visualPrompts.length === 0) parts.push('_(ninguno)_', '');
  for (const v of visualPrompts) {
    const tech = Object.entries(v.technical_params ?? {})
      .map(([k, val]) => `${k}: ${val}`)
      .join(' · ');
    parts.push(
      `### \`${v.slot_name}\` — ${v.media_kind}${v.variant_id ? ` · variante ${variantCode(v.variant_id)}` : ''} · [${v.status}]`,
      '```',
      v.prompt || '(sin prompt)',
      '```',
      v.negative_prompt ? `**Negative:** ${v.negative_prompt}` : '',
      tech ? `**Técnicos:** ${tech}` : '',
      v.reference_notes ? `**Notas:** ${v.reference_notes}` : '',
      '',
    );
  }

  return parts.filter((l) => l !== '').join('\n') + '\n';
}
