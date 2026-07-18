// La pantalla de briefing se reemplazó por la hoja de misión (Fase 3).
// Mantiene compatibilidad con enlaces antiguos redirigiendo a /mision.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BriefingRedirect({ params }: { params: { code: string } }) {
  redirect(`/s/${params.code.toUpperCase()}/mision`);
}
