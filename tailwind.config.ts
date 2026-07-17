import type { Config } from 'tailwindcss';

/**
 * El sistema de diseño vive en `app/globals.css` como variables CSS (tokens),
 * para soportar tema oscuro (turno nocturno) y claro (expediente en papel).
 * Tailwind se usa para utilidades de layout; los colores se leen de los tokens.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: 'var(--night)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        'panel-3': 'var(--panel-3)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        amber: 'var(--amber)',
        'amber-2': 'var(--amber-2)',
        teal: 'var(--teal)',
        alert: 'var(--alert)',
        // Paleta noir (Iteración 3, Fase 2)
        'paper-manila': 'var(--paper-manila)',
        'ink-black': 'var(--ink-black)',
        'stamp-red': 'var(--stamp-red)',
        'stamp-red-faded': 'var(--stamp-red-faded)',
        'evidence-yellow': 'var(--evidence-yellow)',
        'noir-navy': 'var(--noir-navy)',
        'smoke-gray': 'var(--smoke-gray)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        mono: 'var(--font-mono)',
        typewriter: 'var(--font-typewriter-stack)',
        editorial: 'var(--font-editorial-stack)',
      },
      maxWidth: {
        content: '1140px',
      },
    },
  },
  plugins: [],
};

export default config;
