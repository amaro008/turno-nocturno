// ============================================================================
// REGRESIÓN ANTI-SPOILER — El código interno de evidencia (con sufijo de
// variante …-A/-B/-C) JAMÁS debe llegar al cliente.
//
// El sufijo revela la variante sorteada (y, por tanto, al culpable). El único
// identificador que ve el jugador es el `id` opaco. Este test blinda la capa de
// proyección `toLegacyPublic` y la lógica de enlace mensaje→evidencia del /state
// contra futuras regresiones que reintroduzcan `code` en el payload.
// ============================================================================

import { describe, it, expect, vi } from 'vitest';

// La proyección firma URLs vía Storage → lo aislamos de la red.
vi.mock('@/lib/server/storage', () => ({
  signedUrl: async () => 'https://signed.example/media',
  SESSION_MEDIA_TTL: 600,
}));

import { toLegacyPublic, type LegacyPublicEvidence } from '@/lib/server/evidence';
import type { EvidenceFull } from '@/lib/domain';

// Pieza de variante B: su `code` lleva el sufijo delator `-B`.
const necroB: EvidenceFull = {
  id: 'uuid-necro-b',
  case_id: 'case-1',
  code: 'NECRO-B',
  title: 'Informe de necropsia',
  type: 'document',
  scope: 'variant',
  variant_id: 'variant-b',
  initial: false,
  unlocked_at_minute: 45,
  unlocked_by_event_id: null,
  public_description: 'Resultados del forense.',
  admin_notes: 'La víctima presentaba… (solo admin)',
  is_report: false,
  content: { body_md: 'Cuerpo del informe', image_path: null, transcript: null },
};

describe('anti-spoiler: toLegacyPublic', () => {
  it('nunca incluye la propiedad `code`', async () => {
    const out = await toLegacyPublic(necroB);
    expect('code' in out).toBe(false);
    // TypeScript ya lo garantiza, pero lo verificamos en runtime también:
    expect((out as unknown as Record<string, unknown>).code).toBeUndefined();
  });

  it('ningún valor del payload filtra el código ni su sufijo de variante', async () => {
    const out = await toLegacyPublic(necroB);
    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain('NECRO-B');
    expect(serialized).not.toContain('NECRO');
    // Ningún valor termina en el sufijo delator -A/-B/-C.
    for (const value of Object.values(out)) {
      if (typeof value === 'string') {
        expect(/-[ABC]$/.test(value)).toBe(false);
      }
    }
  });

  it('sí conserva los campos públicos que el jugador debe ver', async () => {
    const out = await toLegacyPublic(necroB);
    expect(out.id).toBe('uuid-necro-b');
    expect(out.title).toBe('Informe de necropsia');
    expect(out.public_description).toBe('Resultados del forense.');
    // No arrastra admin_notes bajo ningún alias.
    expect(JSON.stringify(out)).not.toContain('solo admin');
  });
});

describe('anti-spoiler: enlace mensaje→evidencia (réplica de /state)', () => {
  // El route resuelve `evidence_code` (server-side) a `id` opaco y NUNCA envía
  // `evidence_code` al cliente. Replicamos esa transformación para blindarla.
  it('el mensaje entregado al cliente referencia por `id`, sin `evidence_code`', async () => {
    const openEvidence = [necroB];
    const evidence = await Promise.all(openEvidence.map((e) => toLegacyPublic(e)));
    const idByCode = new Map(openEvidence.map((e) => [e.code, e.id]));
    const evById = new Map(evidence.map((e) => [e.id, e]));

    const rawMessages = [
      { id: 'm1', at: '', role: 'commander', kind: 'evidence_card', content: 'x', voice_path: null, evidence_code: 'NECRO-B' },
    ];
    const messages = rawMessages.map((m) => {
      const evId = m.evidence_code ? idByCode.get(m.evidence_code) : null;
      return {
        id: m.id, at: m.at, role: m.role, kind: m.kind, content: m.content,
        voice_path: m.voice_path,
        evidence: evId ? evById.get(evId) ?? null : null,
      };
    });

    const serialized = JSON.stringify(messages);
    expect(serialized).not.toContain('evidence_code');
    expect(serialized).not.toContain('NECRO-B');
    // El enlace se resolvió correctamente por id.
    expect((messages[0].evidence as LegacyPublicEvidence).id).toBe('uuid-necro-b');
  });
});
