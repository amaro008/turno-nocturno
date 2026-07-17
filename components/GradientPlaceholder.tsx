// Placeholder gradiente elegante (server-safe) cuando un asset no tiene imagen.
function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export default function GradientPlaceholder({ seed, label }: { seed: string; label?: string }) {
  const hue = hashHue(seed);
  const bg = `radial-gradient(120% 120% at 25% 12%, hsl(${hue} 30% 20%), hsl(${(hue + 26) % 360} 28% 8%) 72%)`;
  return (
    <div className="gph" style={{ background: bg }} aria-hidden="true">
      {label && <span className="gph-label mono">{label}</span>}
      <span className="initials-ph-scan" />
    </div>
  );
}
