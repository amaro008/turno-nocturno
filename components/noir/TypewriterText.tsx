'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/ui/cn';

/**
 * Escribe el texto letra por letra con cursor parpadeante. El sonido está
 * deshabilitado por default. Respeta prefers-reduced-motion (muestra todo).
 */
export default function TypewriterText({
  text,
  speed = 42,
  startDelay = 250,
  sound = false,
  className,
  as: Tag = 'span',
  cursor = true,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  sound?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  cursor?: boolean;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCount(text.length);
      setDone(true);
      return;
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const startId = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (sound && text[i - 1] && text[i - 1] !== ' ') tick();
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(startId);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function tick() {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200 + Math.random() * 300;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      /* audio no disponible */
    }
  }

  return (
    <Tag className={cn('noir-typewriter', className)}>
      {text.slice(0, count)}
      {cursor && !done && <span className="noir-caret" aria-hidden="true" />}
    </Tag>
  );
}
