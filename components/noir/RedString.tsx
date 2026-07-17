import { cn } from '@/lib/ui/cn';

interface Point {
  x: number;
  y: number;
}

/**
 * Hilo rojo estilo "conspiration board" que tiende curvas entre puntos (%),
 * con chinches en cada extremo. Puramente decorativo.
 */
export default function RedString({
  points,
  className,
}: {
  points: Point[];
  className?: string;
}) {
  if (points.length < 2) return null;
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      const sag = 6; // combadura del hilo
      return `Q ${midX} ${Math.max(prev.y, p.y) + sag} ${p.x} ${p.y}`;
    })
    .join(' ');

  return (
    <svg
      className={cn('noir-string', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={d} fill="none" stroke="var(--stamp-red)" strokeWidth="0.5" opacity="0.85" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.1" fill="#5a1414" />
          <circle cx={p.x - 0.3} cy={p.y - 0.3} r="0.4" fill="#c04040" />
        </g>
      ))}
    </svg>
  );
}
