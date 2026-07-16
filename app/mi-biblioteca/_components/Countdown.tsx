'use client';

import { useEffect, useState } from 'react';
import { formatRemaining } from '@/lib/engine/code-lifecycle';

export default function Countdown({ expiresAt }: { expiresAt: string }) {
  const [ms, setMs] = useState<number>(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000 * 30);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (ms <= 0) return <span className="lib-expire">Expirado</span>;
  return (
    <span className="lib-expire">
      Expira en <b>{formatRemaining(ms)}</b>
    </span>
  );
}
