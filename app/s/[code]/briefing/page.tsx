import './briefing.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { signedUrl } from '@/lib/server/storage';
import { canActivate } from '@/lib/engine/code-lifecycle';
import { MAX_HINTS } from '@/lib/domain';
import AtmoImage from '@/components/AtmoImage';
import { InitialsAvatar } from '@/components/Initials';
import { unsplashUrl, picsumUrl } from '@/lib/ui/placeholders';
import StartTurnButton from './StartTurnButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Briefing · Turno Nocturno', referrer: 'no-referrer' as const };

export default async function BriefingPage({ params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) redirect('/login');

  const code = params.code.toUpperCase();
  const svc = createServiceClient();
  const { data: ac } = await svc.from('access_codes').select('*').eq('code', code).maybeSingle();

  if (!ac || ac.user_id !== user.id) redirect('/mi-biblioteca');
  // El turno ya arrancó → al portal de juego.
  if (['activated', 'in_progress', 'completed'].includes(ac.status)) redirect(`/s/${code}`);
  // Expirado o no canjeado → de vuelta a la biblioteca.
  if (ac.status !== 'redeemed' || !canActivate(ac)) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('Ese código no está listo para iniciar.'));
  }

  const { data: caseRow } = await svc.from('cases').select('*').eq('id', ac.case_id).maybeSingle();
  if (!caseRow) redirect('/mi-biblioteca');

  const { data: suspects } = await svc
    .from('suspects')
    .select('id, name, occupation, description, photo_path')
    .eq('case_id', ac.case_id)
    .order('sort_order', { ascending: true });

  const atmoPrimary =
    (await signedUrl(caseRow.atmosphere_image_path)) ??
    unsplashUrl(`${caseRow.city} ${caseRow.era_year} noir dark`, 1800, 1000);
  const atmoFallback = picsumUrl(`briefing-${caseRow.slug}`, 1800, 1000, true);

  const suspectPhotos = await Promise.all(
    (suspects ?? []).map(async (s) => ({ ...s, url: await signedUrl(s.photo_path) })),
  );

  const hours = Math.floor(caseRow.time_limit_min / 60);
  const mins = caseRow.time_limit_min % 60;
  const durationText = mins === 30 ? `${hours} horas y media` : mins === 0 ? `${hours} horas` : `${hours} h ${mins} min`;

  return (
    <div className="brief">
      <AtmoImage primary={atmoPrimary} fallback={atmoFallback} alt="" className="brief-bg" />
      <div className="brief-scrim" />
      <div className="brief-scan" />

      <div className="brief-inner">
        <div className="brief-head">
          <div className="brief-place">{caseRow.city} · {caseRow.era_year}</div>
          <h1 className="brief-title">{caseRow.title}</h1>
          <div className="brief-folio">Expediente reabierto · briefing de preparación</div>
        </div>

        {/* Sinopsis técnica (con gancho) */}
        <div className="brief-card">
          <h2>El caso</h2>
          <p className="brief-synopsis">{caseRow.synopsis}</p>
        </div>

        {/* Sospechosos (sin coartadas ni motivos) */}
        {suspectPhotos.length > 0 && (
          <div className="brief-card">
            <h2>Los sospechosos</h2>
            <div className="susp-grid">
              {suspectPhotos.map((s) => (
                <div className="susp-card" key={s.id}>
                  <div className="susp-photo">
                    {s.url ? <img src={s.url} alt={s.name} /> : <InitialsAvatar name={s.name} />}
                  </div>
                  <div className="susp-info">
                    <h3>{s.name}</h3>
                    {s.occupation && <div className="susp-role">{s.occupation}</div>}
                    {s.description && <p>{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reglas */}
        <div className="brief-card">
          <h2>Cómo se gana</h2>
          <p className="brief-synopsis" style={{ fontSize: 15, marginBottom: 18 }}>
            El Comandante los contactará en cuanto inicien. Tienen <b>{durationText}</b>. Encuentren
            al culpable, cómo lo hizo y por qué.
          </p>
          <div className="brief-rules">
            <div className="rule"><div className="rn mono">{durationText.split(' ')[0]}{mins === 30 ? '½' : ''} h</div><div className="rl">para resolver</div></div>
            <div className="rule"><div className="rn mono">{MAX_HINTS}</div><div className="rl">pistas disponibles</div></div>
            <div className="rule"><div className="rn mono">1</div><div className="rl">veredicto final</div></div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="brief-card">
          <h2>Antes de empezar</h2>
          <ul className="brief-recs">
            <li><span className="rec-ic">▸</span><span>Usen <b>una pantalla compartida</b> (laptop o TV) que todos puedan ver.</span></li>
            <li><span className="rec-ic">▸</span><span><b>Suban el volumen</b>: el Comandante manda notas de voz.</span></li>
            <li><span className="rec-ic">▸</span><span>Que <b>alguien tome notas</b> — las horas y contradicciones importan.</span></li>
          </ul>
        </div>

        <StartTurnButton code={code} />
        <div className="brief-warn">⚠ Al iniciar, el reloj arranca y no se detiene.</div>
        <div style={{ textAlign: 'center' }}>
          <Link className="brief-back" href="/mi-biblioteca">← Regresar a mi biblioteca (sin iniciar)</Link>
        </div>
      </div>
    </div>
  );
}
