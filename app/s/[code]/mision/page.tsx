import './mision.css';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { signedUrl, SESSION_MEDIA_TTL } from '@/lib/server/storage';
import { canActivate } from '@/lib/engine/code-lifecycle';
import { MAX_HINTS, type EvidenceType } from '@/lib/domain';
import SafeImg from '@/components/SafeImg';
import ConfidentialStamp from '@/components/noir/ConfidentialStamp';
import Reveal from '@/components/noir/Reveal';
import StartTurnModal from './StartTurnModal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hoja de misión · Turno Nocturno', referrer: 'no-referrer' as const };

const EV_LABEL: Record<EvidenceType, [string, string]> = {
  document: ['documento', 'documentos'],
  photo: ['fotografía', 'fotografías'],
  audio: ['audio', 'audios'],
  video: ['video', 'videos'],
  testimony: ['testimonio', 'testimonios'],
  record: ['registro', 'registros'],
};

export default async function MisionPage({ params }: { params: { code: string } }) {
  const user = await getAuthedUser();
  if (!user) redirect('/login');

  const code = params.code.toUpperCase();
  const svc = createServiceClient();
  const { data: ac } = await svc.from('access_codes').select('*').eq('code', code).maybeSingle();

  if (!ac || ac.user_id !== user.id) redirect('/mi-biblioteca');
  if (['activated', 'in_progress', 'completed'].includes(ac.status)) redirect(`/s/${code}`);
  if (ac.status !== 'redeemed' || !canActivate(ac)) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('Ese código no está listo para iniciar.'));
  }

  const { data: caseRow } = await svc.from('cases').select('*').eq('id', ac.case_id).maybeSingle();
  if (!caseRow) redirect('/mi-biblioteca');

  const [{ count: suspectCount }, { data: initialEv }] = await Promise.all([
    svc.from('suspects').select('id', { count: 'exact', head: true }).eq('case_id', ac.case_id).eq('is_victim', false),
    svc.from('evidence_items').select('type').eq('case_id', ac.case_id).eq('initial', true).eq('scope', 'shared'),
  ]);

  const counts = new Map<EvidenceType, number>();
  for (const e of (initialEv ?? []) as { type: EvidenceType }[]) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  const evLines = (Object.keys(EV_LABEL) as EvidenceType[])
    .map((t) => ({ t, n: counts.get(t) ?? 0 }))
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${EV_LABEL[x.t][x.n === 1 ? 0 : 1]}`);

  const atmoUrl = await signedUrl(caseRow.atmosphere_image_path);

  // Audio de briefing del Comandante (opcional por caso), enlace firmado temporal.
  const briefingUrl = caseRow.briefing_voice_path
    ? await signedUrl(caseRow.briefing_voice_path, SESSION_MEDIA_TTL)
    : null;

  const h = Math.floor(caseRow.time_limit_min / 60);
  const m = caseRow.time_limit_min % 60;
  const durationText = m === 0 ? `${h} horas` : m === 30 ? `${h} horas y media` : `${h} h ${m} min`;

  return (
    <div className="mis">
      {/* 1 · Encabezado */}
      <header className="mis-hero">
        <SafeImg src={atmoUrl} alt="" className="mis-hero-bg" />
        <div className="mis-hero-scrim" />
        <ConfidentialStamp variant="MISIÓN" rotate={-9} className="mis-hero-stamp" />
        <div className="mis-hero-inner">
          <div className="mis-place font-typewriter">{caseRow.city} · {caseRow.era_year}</div>
          <h1 className="mis-title font-editorial">{caseRow.title}</h1>
          <div className="mis-folio font-typewriter">Expediente · hoja de misión</div>
        </div>
      </header>

      <div className="mis-body">
        {/* 1.5 · Briefing en audio del Comandante (si el caso lo tiene) */}
        {briefingUrl && (
          <Reveal className="mis-card mis-briefing">
            <h2 className="mis-h font-typewriter">
              <span className="mis-brief-mic" aria-hidden="true">🎙</span> Briefing del Comandante
            </h2>
            <p className="mis-brief-lead">Escuchen el informe antes de entrar al turno.</p>
            <audio
              className="mis-audio"
              src={briefingUrl}
              controls
              controlsList="nodownload noremoteplayback"
              preload="none"
            />
          </Reveal>
        )}

        {/* 2 · La situación */}
        <Reveal className="mis-card">
          <h2 className="mis-h font-typewriter">La situación</h2>
          <div className="mis-prose">{caseRow.synopsis.split('\n').filter(Boolean).map((p: string, i: number) => <p key={i}>{p}</p>)}</div>
        </Reveal>

        {/* 3 · Su misión */}
        <Reveal className="mis-card">
          <h2 className="mis-h font-typewriter">Su misión</h2>
          <ol className="mis-goals">
            <li><span className="mis-goal-k font-editorial">QUIÉN</span> Identifiquen al culpable.</li>
            <li><span className="mis-goal-k font-editorial">CÓMO</span> Reconstruyan cómo se cometió el crimen.</li>
            <li><span className="mis-goal-k font-editorial">POR QUÉ</span> Determinen su móvil.</li>
          </ol>
          <p className="mis-note">Los tres son necesarios para cerrar el caso con éxito.</p>
        </Reveal>

        {/* 4 · Lo que van a tener */}
        <Reveal className="mis-card">
          <h2 className="mis-h font-typewriter">Lo que van a tener disponible</h2>
          <ul className="mis-have">
            <li><b>{suspectCount ?? 0}</b> sospechosos con ficha completa.</li>
            {evLines.length > 0 && (
              <li>Desde el inicio: <b>{evLines.join(', ')}</b>. Más evidencia llegará durante la investigación.</li>
            )}
            <li>Un cuaderno de <b>notas colaborativas</b>.</li>
            <li>Un <b>Comandante</b> disponible para responder <b>dudas específicas</b>.</li>
          </ul>
        </Reveal>

        {/* 5 · Cómo trabajar el caso (destacado) */}
        <Reveal className="mis-card highlight">
          <h2 className="mis-h font-typewriter">Cómo trabajar el caso</h2>
          <ul className="mis-rules">
            <li>Al entrar tendrán <b>todo el material base abierto</b>. Empiecen leyendo el reporte inicial.</li>
            <li>El Comandante <b>no entrega evidencia bajo demanda</b>. Responde dudas específicas sobre lo que ya tienen. Úsenlo con criterio.</li>
            <li>Cada <b>20–30 minutos</b> aproximadamente el Comandante los contactará con información nueva, presión o pistas si se atoran. Estén atentos.</li>
            <li>Tienen <b>{MAX_HINTS} pistas</b> si se estancan. Cada pista usada resta puntuación.</li>
            <li>Cuando estén listos para acusar, presionen <b>&ldquo;Cerrar el caso&rdquo;</b>. Necesitan responder los 3 objetivos con evidencia.</li>
          </ul>
        </Reveal>

        {/* 6 · El reloj */}
        <Reveal className="mis-card clock">
          <h2 className="mis-h font-typewriter">El reloj</h2>
          <p className="mis-prose">
            Tienen <b>{durationText}</b> desde que inicien. Cuando el reloj llegue a cero, el Comandante
            exigirá veredicto inmediato. <b>No hay pausa.</b>
          </p>
        </Reveal>

        {/* 7 · Recomendaciones */}
        <Reveal className="mis-card">
          <h2 className="mis-h font-typewriter">Antes de empezar</h2>
          <ul className="mis-recs">
            <li><span className="rec-ic">▸</span> Una <b>pantalla compartida</b> (TV o monitor grande) que todos puedan ver.</li>
            <li><span className="rec-ic">▸</span> Todos los jugadores <b>presentes desde el inicio</b>.</li>
            <li><span className="rec-ic">▸</span> Alguien <b>tomando notas activas</b> — las horas y contradicciones importan.</li>
            <li><span className="rec-ic">▸</span> Ambiente: café, whiskey, silencio… lo que vayan a necesitar por {h}+ horas.</li>
          </ul>
        </Reveal>

        {/* 8 · Botones */}
        <StartTurnModal code={code} />
        <div className="mis-warn font-typewriter">⚠ Al iniciar, el reloj arranca y no se detiene.</div>
      </div>
    </div>
  );
}
