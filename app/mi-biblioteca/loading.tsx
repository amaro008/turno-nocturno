import { Skeleton } from '@/components/Skeleton';

export default function BibliotecaLoading() {
  return (
    <main className="wrap lib">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <Skeleton className="sk-line" style={{ width: 90, height: 12 }} />
        <Skeleton className="sk-line" style={{ width: 220, height: 28 }} />
      </div>
      <div className="lib-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="lib-card" key={i}>
            <Skeleton className="sk-block" style={{ height: 128, borderRadius: 0 }} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton className="sk-line" style={{ width: '65%', height: 18 }} />
              <Skeleton className="sk-line" style={{ width: '45%' }} />
              <Skeleton className="sk-block" style={{ height: 38, marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
