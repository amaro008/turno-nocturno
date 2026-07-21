import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Turno Nocturno — Juego de misterio criminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Imagen OG generada para landing y catálogo público.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'radial-gradient(120% 90% at 20% 10%, #1a1205 0%, #0b0e12 60%)',
          color: '#e7ebf0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#e9a63c', fontSize: 26, letterSpacing: 6, textTransform: 'uppercase' }}>
          Juego de misterio conducido por IA
        </div>
        <div style={{ display: 'flex', fontSize: 82, fontWeight: 800, lineHeight: 1.02, marginTop: 24, maxWidth: 900 }}>
          Sigue las pistas. Encuentra al culpable.
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#a7b0bc', marginTop: 28 }}>
          Turno Nocturno · una noche, una mesa, el reloj en contra
        </div>
      </div>
    ),
    { ...size },
  );
}
