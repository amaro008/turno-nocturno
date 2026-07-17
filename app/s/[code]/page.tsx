import './session.css';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/server/auth';
import { getSessionByCode } from '@/lib/server/game';
import SessionApp from './_components/SessionApp';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Sesión · Turno Nocturno',
  referrer: 'no-referrer' as const,
  robots: { index: false, follow: false },
};

export default async function SessionPage({ params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) redirect('/login');

  const ctx = await getSessionByCode(params.code, user.id);
  // Sin sesión activada para ese código → de vuelta a la biblioteca.
  if (!ctx) redirect('/mi-biblioteca');

  return <SessionApp code={params.code.toUpperCase()} />;
}
