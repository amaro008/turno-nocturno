import type { Metadata, Viewport } from 'next';
import { Courier_Prime, Playfair_Display } from 'next/font/google';
import './globals.css';

// Tipografías noir (Iteración 3, Fase 2)
const typewriter = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-typewriter',
  display: 'swap',
});
const editorial = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-editorial',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Turno Nocturno — Reabre el caso',
  description:
    'Juego de misterio conducido por IA. Reúne a tu mesa, reabran un caso criminal archivado y encuentren al culpable antes de que el reloj llegue a cero.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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
    <html lang="es" className={`${typewriter.variable} ${editorial.variable}`}>
      <body>{children}</body>
    </html>
  );
}
