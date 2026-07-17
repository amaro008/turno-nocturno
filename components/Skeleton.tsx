// Skeleton de carga (estilo shadcn) — shimmer sobre superficie del tema.
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={'skeleton' + (className ? ' ' + className : '')} style={style} aria-hidden="true" />;
}

/** Fila de líneas de texto simuladas. */
export function SkeletonText({ lines = 3, width = '100%' }: { lines?: number; width?: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton sk-line"
          style={{ width: i === lines - 1 ? '70%' : width }}
        />
      ))}
    </div>
  );
}
