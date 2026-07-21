'use client';

import { useEffect, useRef, useState } from 'react';

type Item =
  | { type: 'text'; html: string; t: string }
  | { type: 'voice'; meta: string; t: string }
  | { type: 'card'; title: string; sub: string; t: string };

const SCRIPT: Item[] = [
  { type: 'text', html: 'Detective. Habla el Comandante. Tenemos el expediente <b>89-1027-H</b> sobre la mesa.', t: '02:49' },
  { type: 'voice', meta: '0:48', t: '02:49' },
  {
    type: 'text',
    html: 'Rodrigo Salazar, locutor de Radio Norte. Su última transmisión cortó a las <b>02:49</b>. Tienen hasta el amanecer para saber quién lo calló.',
    t: '02:50',
  },
  { type: 'card', title: 'Parte informativo', sub: 'Documento · folio 89-1027-H', t: '02:50' },
];

function Wave() {
  const bars = Array.from({ length: 26 }, (_, i) => 4 + Math.abs(Math.sin(i * 0.85)) * 18);
  return (
    <div className="wave" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${h.toFixed(0)}px` }} />
      ))}
    </div>
  );
}

function Bubble({ item }: { item: Item }) {
  if (item.type === 'text') {
    return (
      <div className="tbub">
        <span dangerouslySetInnerHTML={{ __html: item.html }} />
        <span className="t mono">{item.t}</span>
      </div>
    );
  }
  if (item.type === 'voice') {
    return (
      <div className="tbub tvoice">
        <button className="play" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <Wave />
        <span className="vmeta">{item.meta}</span>
      </div>
    );
  }
  return (
    <div className="tbub" style={{ padding: 0, background: 'none', border: 'none' }}>
      <div className="tcard">
        <span className="tstrip" />
        <span className="tic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
          </svg>
        </span>
        <span className="tcx">
          <b>{item.title}</b>
          <span>{item.sub}</span>
        </span>
        <span className="topen">Abrir</span>
      </div>
    </div>
  );
}

export default function HeroTeaser() {
  const [shown, setShown] = useState<number>(0);
  const [typing, setTyping] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(SCRIPT.length);
      return;
    }
    let i = 0;
    const push = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
    };
    const next = () => {
      if (i >= SCRIPT.length) return;
      setTyping(true);
      push(() => {
        setTyping(false);
        setShown((s) => s + 1);
        i += 1;
        push(next, 650);
      }, i === 0 ? 500 : 900);
    };
    next();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <div className="teaser" aria-label="Vista previa del chat del Comandante">
      <div className="teaser-top">
        <div className="teaser-av">C</div>
        <div>
          <div className="tt-name">Comandante</div>
          <div className="tt-status">
            <span className="d" />
            en línea
          </div>
        </div>
        <div className="tt-time">02:49</div>
      </div>
      <div className="tmsgs">
        {SCRIPT.slice(0, shown).map((item, idx) => (
          <Bubble key={idx} item={item} />
        ))}
        {typing && (
          <div className="ttyping">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
    </div>
  );
}
