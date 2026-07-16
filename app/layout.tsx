import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Turno Nocturno — Reabre el caso',
  description:
    'Juego de misterio conducido por IA. Reúne a tu mesa, reabran un caso criminal archivado y encuentren al culpable antes de que el reloj llegue a cero.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Turno Nocturno',
    description: 'Reabran el caso. Tienen una noche.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0e12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
