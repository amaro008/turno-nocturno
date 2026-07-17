import { cn } from '@/lib/ui/cn';

/** Clip metálico SVG para la esquina de un elemento. Decorativo. */
export default function PaperclipCorner({ className }: { className?: string }) {
  return (
    <svg className={cn('noir-clip', className)} width="34" height="60" viewBox="0 0 34 60" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="clipg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9edf2" />
          <stop offset="0.5" stopColor="#9aa3ad" />
          <stop offset="1" stopColor="#6c757e" />
        </linearGradient>
      </defs>
      <path
        d="M22 6c-6 0-9 3-9 9v28c0 4 2 6 5 6s5-2 5-6V16"
        stroke="url(#clipg)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 12v30c0 6 3 10 9 10s9-4 9-10V14c0-7-4-11-11-11S8 7 8 15v26"
        stroke="url(#clipg)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
