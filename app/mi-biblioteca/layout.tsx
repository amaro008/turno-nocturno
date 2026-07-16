import './library.css';
import AppHeader from '@/components/AppHeader';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
