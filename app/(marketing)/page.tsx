import Link from 'next/link';
import HeroTeaser from './_components/HeroTeaser';

export default function LandingPage() {
  return (
    <>
      {/* ===== NAV ===== */}
      <header className="nav">
        <div className="wrap nav-inner">
          <Link className="logo" href="/">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
                <path d="M9 12.5 11 14.5 15.5 9.5" />
              </svg>
            </span>
            <span>
              <b>Turno Nocturno</b>
              <small>Expediente reabierto</small>
            </span>
          </Link>
          <nav className="nav-links">
            <a href="#casos">Casos</a>
            <a href="#como">Cómo funciona</a>
            <a href="#distinto">Por qué es distinto</a>
          </nav>
          <div className="nav-cta">
            <Link className="btn ghost" href="/login">
              Iniciar sesión
            </Link>
            <Link className="btn primary" href="/registro">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" id="top">
        <div className="wrap hero-inner">
          <div>
            <span className="kicker">Juego de misterio conducido por IA</span>
            <h1>
              Reabran el caso.
              <br />
              Tienen <span className="amberword">una noche.</span>
            </h1>
            <p className="lede">
              Reúne a tu mesa —de 2 a 6 detectives— y reabran un caso criminal archivado. Un{' '}
              <b>Comandante</b> los conduce por chat y notas de voz, dosifica la evidencia y aprieta
              el reloj. <b>El culpable cambia en cada partida.</b>
            </p>
            <div className="hero-cta">
              <Link className="btn primary lg" href="/registro">
                Crear cuenta gratis
              </Link>
              <a className="btn ghost lg" href="#como">
                Ver cómo funciona
              </a>
            </div>
            <div className="hero-note">
              <span className="pulse-dot" />
              Piloto privado · acceso por código · español · sin descargas
            </div>
          </div>
          <HeroTeaser />
        </div>
      </section>

      {/* ===== STRIP ===== */}
      <div className="strip">
        <div className="wrap strip-inner">
          <div className="fact">
            <span className="n mono">2–6</span>
            <span className="l">
              <b>Detectives</b>una mesa, una pantalla
            </span>
          </div>
          <div className="fact">
            <span className="n mono">2–3 h</span>
            <span className="l">
              <b>Por sesión</b>abandona y retoma
            </span>
          </div>
          <div className="fact">
            <span className="n mono">×2</span>
            <span className="l">
              <b>Desenlaces</b>culpable sorteado
            </span>
          </div>
          <div className="fact">
            <span className="n mono">100%</span>
            <span className="l">
              <b>De época</b>evidencia fiel al año
            </span>
          </div>
        </div>
      </div>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="block" id="como">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Cómo funciona</span>
            <h2>De crear tu cuenta a resolver el crimen, en cuatro pasos.</h2>
            <p>Sin descargas ni manuales. Si sabes usar una app de mensajería, ya sabes jugar.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="num">01</span>
              <h3>Crea tu cuenta</h3>
              <p>Nombre, correo y tu ciudad. Menos de un minuto y quedas listo.</p>
            </div>
            <div className="step">
              <span className="num">02</span>
              <h3>Recibe tu código</h3>
              <p>Te llega por correo un código de acceso para el caso que elegiste. Aparece en tu biblioteca.</p>
            </div>
            <div className="step">
              <span className="num">03</span>
              <h3>Reúne a tu mesa</h3>
              <p>De 2 a 6 personas frente a una pantalla compartida. Activan la sesión y el reloj arranca.</p>
            </div>
            <div className="step">
              <span className="num">04</span>
              <h3>Cierren el caso</h3>
              <p>Interroguen al Comandante, abran el expediente y entreguen su veredicto antes del cero.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIADORES ===== */}
      <section className="block" id="distinto">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Por qué es distinto</span>
            <h2>No es un juego de mesa con app. Es un caso que responde.</h2>
          </div>
          <div className="feats">
            <div className="feat">
              <div className="fic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </div>
              <div>
                <h3>Un Comandante que responde</h3>
                <p>IA en vivo por chat y notas de voz. Presiona, dosifica pistas y sostiene el personaje. Nunca resuelve el caso por ustedes.</p>
              </div>
            </div>
            <div className="feat">
              <div className="fic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="8" cy="12" r="2" />
                  <circle cx="16" cy="12" r="2" />
                </svg>
              </div>
              <div>
                <h3>Evidencia de época</h3>
                <p>Cintas VHS, casetes, registros telefónicos en papel. Cada caso, fiel a su ciudad y su año. Sin anacronismos.</p>
              </div>
            </div>
            <div className="feat">
              <div className="fic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
                  <circle cx="12" cy="12" r="2.2" />
                </svg>
              </div>
              <div>
                <h3>Nadie juega el mismo caso</h3>
                <p>El culpable se sortea al activar. Dos mesas, dos verdades. Imposible spoilear, perfecto para rejugar.</p>
              </div>
            </div>
            <div className="feat">
              <div className="fic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5M9 2h6" />
                </svg>
              </div>
              <div>
                <h3>El caso está vivo</h3>
                <p>Peritajes que llegan solos, presión del ministerio público, un ultimátum. Un reloj real que no perdona.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATÁLOGO ===== */}
      <section className="block" id="casos">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Catálogo de casos</span>
            <h2>Ciudades icónicas de LATAM. Cada una, su crimen y su época.</h2>
            <p>Arrancamos en Monterrey, 1989. Los siguientes casos ya están en el tablero.</p>
          </div>
          <div className="cases">
            <article className="case live">
              <div className="cover">
                <span className="badge-state on bstate">Disponible</span>
                <span className="cts">27·10·89</span>
                <span className="cno mono">001</span>
                <span className="cstamp">La Última Transmisión</span>
                <span className="cfile mono">FOLIO 89-1027-H</span>
              </div>
              <div className="cbody">
                <span className="cplace">Monterrey · 1989</span>
                <h3>La Última Transmisión</h3>
                <p className="csyn">
                  Un locutor nocturno silenciado a mitad de programa. Veintiún minutos sin testigos entre el corte y el hallazgo.
                </p>
                <div className="cmeta">
                  <span>2–3 h</span>
                  <span>2–6 jugadores</span>
                  <span>2 desenlaces</span>
                </div>
                <Link className="btn primary cbtn" href="/registro">
                  Jugar este caso
                </Link>
              </div>
            </article>

            <CaseSoon num="002" ts="·· ·· 58" stamp="En producción" file="CDMX · 1958" place="Ciudad de México · 1958" syn="Cabarets, prensa amarilla y un cadáver en la colonia Roma. La ciudad de oro escondía sus deudas." tags={['Época de oro', 'Sin ADN']} />
            <CaseSoon num="003" ts="·· ·· 04" stamp="En diseño" file="GDL · 2004" place="Guadalajara · 2004" syn="Primeros celulares, cámaras borrosas y un secreto que alguien creyó enterrado en un cibercafé." tags={['Era digital', 'SMS']} />
            <CaseSoon num="004" ts="·· ·· 72" stamp="En diseño" file="MID · 1972" place="Mérida · 1972" syn="Calor, haciendas henequeneras en decadencia y una herencia que valía más que una vida." tags={['Telegramas', 'Radio AM']} />
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="block" id="registro-cta">
        <div className="wrap">
          <div className="final-card">
            <span className="kicker" style={{ justifyContent: 'center' }}>
              El turno de esta noche
            </span>
            <h2>
              El expediente 89-1027-H lleva 36 años cerrado.
              <br />
              Ustedes lo reabren hoy.
            </h2>
            <p>
              Crea tu cuenta, recibe tu código y reúne a tu mesa. El Comandante ya está en línea,
              esperando a alguien que se atreva a leer el archivo completo.
            </p>
            <div className="final-cta">
              <Link className="btn primary lg" href="/registro">
                Crear cuenta gratis
              </Link>
              <Link className="btn ghost lg" href="/login">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="foot">
            <span className="fbrand">Turno Nocturno © 1989 / 2026</span>
            <div className="flinks">
              <a href="#casos">Casos</a>
              <a href="#como">Cómo funciona</a>
              <Link href="/login">Iniciar sesión</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/privacidad">Privacidad</Link>
            </div>
          </div>
          <p className="foot-legal">
            Piloto privado en español · acceso por código de invitación. Turno Nocturno es una
            experiencia de ficción; personajes, casos y evidencias son inventados. Al registrarte
            aceptas los Términos y el Aviso de Privacidad (LFPDPPP).
          </p>
        </div>
      </footer>
    </>
  );
}

function CaseSoon(props: {
  num: string;
  ts: string;
  stamp: string;
  file: string;
  place: string;
  syn: string;
  tags: string[];
}) {
  return (
    <article className="case soon">
      <div className="cover">
        <span className="badge-state soon bstate">Próximamente</span>
        <span className="cts">{props.ts}</span>
        <span className="cno mono">{props.num}</span>
        <span className="cstamp">{props.stamp}</span>
        <span className="cfile mono">{props.file}</span>
      </div>
      <div className="cbody">
        <span className="cplace">{props.place}</span>
        <h3>Título reservado</h3>
        <p className="csyn">{props.syn}</p>
        <div className="cmeta">
          {props.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <Link className="btn ghost cbtn" href="/registro">
          Avísame
        </Link>
      </div>
    </article>
  );
}
