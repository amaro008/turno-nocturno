import { cn } from '@/lib/ui/cn';

/** Mancha de café SVG (anillo) como decoración de esquina. */
export default function CoffeeStain({
  size = 90,
  rotate = 0,
  opacity = 0.5,
  className,
}: {
  size?: number;
  rotate?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={cn('noir-coffee', className)}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotate}deg)`, opacity }}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="34" fill="none" stroke="#6b4a2b" strokeWidth="4" opacity="0.55" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#4a2f16" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.7" />
      <path d="M20 46c8-6 18 4 30 2s20-8 30-2" fill="none" stroke="#6b4a2b" strokeWidth="2" opacity="0.35" />
      <circle cx="50" cy="50" r="30" fill="#6b4a2b" opacity="0.06" />
    </svg>
  );
}
