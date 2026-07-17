import { describe, it, expect } from 'vitest';
import { buildSuspectPrompt, buildCoverPrompt, buildVideoPrompt } from '@/lib/engine/prompt-builder';

const AD = 'Fotografía noir de 1989, grano fino, claroscuro, paleta desaturada con acento carmín';

describe('buildSuspectPrompt', () => {
  const suspect = {
    name: 'Elena Vidal',
    age: 41,
    occupation: 'productora de radio',
    physical_description: 'cabello castaño recogido, complexión delgada, mirada firme',
    distinctive_features: 'anillo de plata con piedra granate en la mano izquierda',
  };

  it('incluye sujeto, rasgos distintivos, estilo, negativo y aspecto', () => {
    const p = buildSuspectPrompt(suspect, AD);
    expect(p).toContain('[SUBJECT] Portrait photograph of Elena Vidal, 41 year old productora de radio');
    expect(p).toContain('[DISTINCTIVE FEATURES] anillo de plata');
    expect(p).toContain('must be clearly visible');
    expect(p).toContain(AD);
    expect(p).toContain('[NEGATIVE]');
    expect(p).toContain('--ar 3:4 --s 250');
  });

  it('omite el estilo del caso si autoInject=false', () => {
    const p = buildSuspectPrompt(suspect, AD, false);
    expect(p).not.toContain(AD);
    expect(p).toContain('[STYLE]');
  });

  it('omite la línea de rasgos si no hay features', () => {
    const p = buildSuspectPrompt({ name: 'Anónimo' }, AD);
    expect(p).not.toContain('[DISTINCTIVE FEATURES]');
  });
});

describe('buildCoverPrompt', () => {
  it('genera prompt de escena con aspecto 3:4', () => {
    const p = buildCoverPrompt('Cabina de radio a oscuras', AD);
    expect(p).toContain('[SCENE] Cabina de radio a oscuras');
    expect(p).toContain('--ar 3:4');
    expect(p).toContain(AD);
  });
});

describe('buildVideoPrompt', () => {
  it('genera prompt de video de vigilancia con duración y negativo', () => {
    const p = buildVideoPrompt({
      angle: 'fixed high angle',
      location: 'estación de radio, pasillo',
      event: 'una figura con chamarra beige cruza a las 02:29',
      eraStyle: '1989 VHS security camera, timestamp 27/10/1989 02:29:14, black and white, heavy grain',
      durationSeconds: 6,
    });
    expect(p).toContain('[SCENE] Security camera footage');
    expect(p).toContain('[EVENT]');
    expect(p).toContain('[DURATION] 6 seconds');
    expect(p).toContain('[NEGATIVE] cinematic, professional, color');
  });
});
