'use client';

import Link from 'next/link';
import { cn } from '@/lib/ui/cn';

interface Drawer {
  label: string;
  href?: string;
  onClick?: () => void;
}

/** Archivero SVG con cajones etiquetados y clickeables (se deslizan en hover). */
export default function FilingCabinet({ drawers, className }: { drawers: Drawer[]; className?: string }) {
  return (
    <div className={cn('noir-cabinet', className)} role="group" aria-label="Archivero">
      {drawers.map((d, i) => {
        const inner = (
          <>
            <span className="noir-drawer-handle" aria-hidden="true" />
            <span className="font-typewriter noir-drawer-label">{d.label}</span>
          </>
        );
        if (d.href) {
          return (
            <Link key={i} href={d.href} className="noir-drawer">
              {inner}
            </Link>
          );
        }
        return (
          <button key={i} className="noir-drawer" onClick={d.onClick} type="button">
            {inner}
          </button>
        );
      })}
    </div>
  );
}
