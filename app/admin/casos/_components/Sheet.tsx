'use client';

import { useEffect } from 'react';

/** Panel lateral deslizante (equivalente a shadcn Sheet, con el CSS propio). */
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <aside className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="sheet-head">
          <div style={{ minWidth: 0 }}>
            <h2 className="sheet-title">{title}</h2>
            {subtitle && <div className="sheet-sub mono">{subtitle}</div>}
          </div>
          <button className="sheet-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div className="sheet-body scroll">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </aside>
    </div>
  );
}
