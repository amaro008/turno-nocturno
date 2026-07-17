import { Skeleton } from '@/components/Skeleton';

// Skeleton de la consola mientras hidrata el estado (en vez de un spinner).
export default function SessionSkeleton() {
  return (
    <div className="sess sk-console">
      <header className="sbar">
        <div className="brand">
          <Skeleton className="sk-block" style={{ width: 38, height: 38 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton className="sk-line" style={{ width: 180 }} />
            <Skeleton className="sk-line" style={{ width: 90, height: 9 }} />
          </div>
        </div>
        <div className="sbar-center"><Skeleton className="sk-line" style={{ width: 130, height: 26 }} /></div>
        <div className="sbar-right"><Skeleton className="sk-block" style={{ width: 120, height: 38 }} /></div>
      </header>

      <main className="console">
        <section className="chat" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton className="sk-block" style={{ width: '70%', height: 54 }} />
          <Skeleton className="sk-block" style={{ width: '55%', height: 40 }} />
          <Skeleton className="sk-block" style={{ width: '78%', height: 64 }} />
          <Skeleton className="sk-block" style={{ alignSelf: 'flex-end', width: '48%', height: 40 }} />
        </section>
        <aside className="exp" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="sk-line" style={{ width: 74, height: 18 }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="sk-block" style={{ aspectRatio: '4/5' }} />
            ))}
          </div>
        </aside>
      </main>

      <footer className="sfoot">
        <Skeleton className="sk-line" style={{ width: 140 }} />
      </footer>
    </div>
  );
}
