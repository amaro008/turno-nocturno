// Placeholders elegantes con iniciales sobre gradiente atmosférico determinista.
// Cuando falta una imagen (sospechoso sin foto, caso sin portada) generamos un
// fondo con hue derivado del texto, no un icono genérico.

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

function gradientFor(seed: string): string {
  const hue = hashHue(seed);
  const h2 = (hue + 28) % 360;
  // Oscuro y atmosférico: baja luminosidad, ligero acento cálido en la esquina.
  return `radial-gradient(120% 120% at 25% 15%, hsl(${hue} 32% 22%), hsl(${h2} 30% 9%) 70%)`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Retrato cuadrado/vertical con iniciales (sospechosos). */
export function InitialsAvatar({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={'initials-ph' + (className ? ' ' + className : '')}
      style={{ background: gradientFor(name), ...style }}
      aria-label={name}
    >
      <span className="initials-ph-text">{initialsOf(name)}</span>
      <span className="initials-ph-scan" aria-hidden="true" />
    </div>
  );
}

/** Portada de caso: número/iniciales + subtítulo (ciudad·año) sobre gradiente. */
export function InitialsCover({
  seed,
  label,
  sub,
  className,
}: {
  seed: string;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={'initials-cover' + (className ? ' ' + className : '')}
      style={{ background: gradientFor(seed) }}
      aria-label={label}
    >
      <span className="initials-cover-label mono">{label}</span>
      {sub && <span className="initials-cover-sub mono">{sub}</span>}
      <span className="initials-ph-scan" aria-hidden="true" />
    </div>
  );
}
