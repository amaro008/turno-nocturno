import { Skeleton } from '@/components/Skeleton';

export default function CasosLoading() {
  return (
    <main className="block">
      <div className="wrap">
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton className="sk-line" style={{ width: 120, height: 12 }} />
          <Skeleton className="sk-line" style={{ width: 340, height: 30 }} />
        </div>
        <div className="catalog-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="ccard" key={i}>
              <Skeleton className="sk-block" style={{ aspectRatio: '3/2', borderRadius: 0 }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton className="sk-line" style={{ width: '70%', height: 18 }} />
                <Skeleton className="sk-line" style={{ width: '100%' }} />
                <Skeleton className="sk-line" style={{ width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
