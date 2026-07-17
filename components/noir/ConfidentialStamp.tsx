import { cn } from '@/lib/ui/cn';

export type StampVariant = 'CONFIDENCIAL' | 'CLASIFICADO' | 'ARCHIVO MUERTO' | 'EVIDENCIA' | 'TOP SECRET';

/** Sello de tinta rojo con rotación variable y textura gastada. Decorativo. */
export default function ConfidentialStamp({
  variant = 'CONFIDENCIAL',
  rotate = -8,
  className,
}: {
  variant?: StampVariant;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('noir-stamp font-typewriter', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <span className="noir-stamp-inner">{variant}</span>
    </span>
  );
}
