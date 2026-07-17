import { cn } from '@/lib/ui/cn';

/** Mancha de tinta negra decorativa. */
export default function InkSplotch({
  size = 120,
  rotate = 0,
  color = 'var(--ink-black)',
  className,
}: {
  size?: number;
  rotate?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      className={cn('noir-ink', className)}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M52 8c9-3 15 6 22 10s16 3 19 13-7 16-6 26 8 17 1 25-19 2-28 7-12 14-23 12S18
        108 12 99s2-19-2-29-14-15-12-26 14-14 18-24S43 11 52 8Z"
        opacity="0.9"
      />
      <circle cx="18" cy="30" r="4" fill={color} opacity="0.7" />
      <circle cx="86" cy="70" r="3" fill={color} opacity="0.6" />
      <circle cx="70" cy="14" r="2.4" fill={color} opacity="0.6" />
    </svg>
  );
}
