// ============================================================================
// EMAIL — Envío transaccional de códigos vía Resend (OPCIONAL en MVP).
// Si no hay RESEND_API_KEY, `sendCodeEmail` devuelve { sent: false } sin error,
// para que el admin copie el código y lo envíe a mano por WhatsApp.
//
// Diseño: maqueta tipo "citación / expediente" segura para clientes de correo
// (tablas + estilos inline, sin flexbox/grid, botón a prueba de Outlook).
// Nada de lenguaje de "reabrir" — son casos de una época que hay que resolver.
// ============================================================================

import { Resend } from 'resend';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const FROM = process.env.EMAIL_FROM ?? 'Turno Nocturno <no-reply@turnonocturno.app>';

export interface CodeEmailInput {
  to: string;
  fullName: string;
  caseTitle: string;
  code: string;
  /** Ciudad del caso (opcional) — se muestra como sello del expediente. */
  city?: string | null;
  /** Año/época del caso (opcional) — se muestra como sello del expediente. */
  eraYear?: number | null;
  resend?: boolean;
}

// Paleta noir (consistente con la marca).
const C = {
  ink: '#0B0E12', // fondo profundo
  panel: '#12171F', // panel/tarjeta
  panelSoft: '#161C25',
  line: '#2A333F', // bordes
  text: '#E7EBF0',
  muted: '#A7B0BC',
  faint: '#6E7887',
  gold: '#E9A63C',
  goldSoft: '#F2C173',
  red: '#C0392B', // tinta roja de expediente
  redSoft: '#E05646',
};

export async function sendCodeEmail(
  input: CodeEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY no configurada' };

  const resend = new Resend(apiKey);
  const html = buildHtml(input);
  const text = buildText(input);

  const subject = input.resend
    ? `Reenvío · Citación para «${input.caseTitle}»`
    : `Citación · Tienes un caso: «${input.caseTitle}»`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject,
      html,
      text,
    });
    if (error) return { sent: false, error: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : 'error desconocido' };
  }
}

// ----------------------------------------------------------------------------
// Plantilla HTML — tablas anidadas, estilos inline, ancho máx. 600px.
// ----------------------------------------------------------------------------
export function buildHtml(input: CodeEmailInput): string {
  const redeemUrl = `${SITE}/mi-biblioteca/canjear?code=${encodeURIComponent(input.code)}`;
  const name = escapeHtml(input.fullName || 'detective');
  const title = escapeHtml(input.caseTitle);
  const kicker = input.resend ? 'REENVÍO · CITACIÓN CONFIDENCIAL' : 'CITACIÓN CONFIDENCIAL';

  // Sellos del expediente (ciudad / época), sólo los que existan.
  const stamps: string[] = [];
  if (input.city) stamps.push(escapeHtml(input.city.toUpperCase()));
  if (input.eraYear) stamps.push(String(input.eraYear));
  const stampsRow =
    stamps.length > 0
      ? `<tr><td style="padding:2px 0 0">
           ${stamps
             .map(
               (s) =>
                 `<span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.14em;color:${C.goldSoft};border:1px solid ${C.line};border-radius:4px;padding:5px 9px;margin:6px 8px 0 0">${s}</span>`,
             )
             .join('')}
         </td></tr>`
      : '';

  const preheader = `Tu código para «${input.caseTitle}» está listo. El turno empieza cuando tú lo actives.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="https://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.ink};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all">${escapeHtml(
    preheader,
  )}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Marca -->
          <tr>
            <td style="padding:0 4px 14px;">
              <span style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:.34em;color:${C.gold};text-transform:uppercase;">Turno&nbsp;Nocturno</span>
            </td>
          </tr>

          <!-- Expediente -->
          <tr>
            <td style="background:${C.panel};border:1px solid ${C.line};border-radius:14px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Cabecera del expediente -->
                <tr>
                  <td style="padding:26px 30px 4px;border-bottom:1px dashed ${C.line};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.22em;color:${C.redSoft};text-transform:uppercase;">${kicker}</span>
                        </td>
                        <td align="right">
                          <span style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.14em;color:${C.faint};">EXP.&nbsp;${escapeHtml(
                            input.code,
                          )}</span>
                        </td>
                      </tr>
                    </table>
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${C.text};font-weight:700;margin:12px 0 2px;">${title}</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">${stampsRow}</table>
                    <div style="height:16px;line-height:16px;">&nbsp;</div>
                  </td>
                </tr>

                <!-- Cuerpo -->
                <tr>
                  <td style="padding:22px 30px 4px;">
                    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${C.text};">Detective ${name},</p>
                    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:${C.muted};">
                      Se te ha asignado un caso. Un Comandante te guiará por radio mientras tú y tu equipo repasáis pruebas, escucháis testimonios y apuntáis quién miente. Tenéis el tiempo de un turno para dar con la verdad.
                    </p>
                    <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:${C.muted};">
                      El reloj no corre todavía: empieza en el momento en que actives tu código. Reúne a quien vaya a jugar contigo antes de entrar.
                    </p>
                  </td>
                </tr>

                <!-- Código de acceso -->
                <tr>
                  <td style="padding:0 30px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panelSoft};border:1px solid ${C.line};border-radius:10px;">
                      <tr>
                        <td align="center" style="padding:18px 20px;">
                          <div style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.24em;color:${C.faint};text-transform:uppercase;margin-bottom:8px;">Tu código de acceso</div>
                          <div style="font-family:'Courier New',Courier,monospace;font-size:28px;letter-spacing:.12em;color:${C.goldSoft};font-weight:700;">${escapeHtml(
                            input.code,
                          )}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA (a prueba de Outlook) -->
                <tr>
                  <td align="center" style="padding:22px 30px 8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background:${C.gold};border-radius:10px;">
                          <a href="${redeemUrl}" target="_blank" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1a1205;text-decoration:none;border-radius:10px;">Canjear mi código &rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.faint};">o pega este enlace: <span style="color:${C.muted};word-break:break-all;">${escapeHtml(
                      redeemUrl,
                    )}</span></div>
                  </td>
                </tr>

                <!-- Nota de tiempos -->
                <tr>
                  <td style="padding:16px 30px 26px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px dashed ${C.line};">
                      <tr>
                        <td style="padding-top:16px;">
                          <div style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.2em;color:${C.redSoft};text-transform:uppercase;margin-bottom:8px;">Reglas del turno</div>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${C.muted};">
                            Tienes <b style="color:${C.text};">24&nbsp;h</b> para canjear el código. Una vez que actives la sesión, empieza tu <b style="color:${C.text};">turno de resolución</b>. El código caduca a los <b style="color:${C.text};">5&nbsp;días</b> de emitirse.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="padding:20px 8px 0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${C.faint};">
                Departamento de Investigación Criminal · Turno Nocturno<br />
                Si no esperabas esta citación, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// Versión de texto plano (fallback + deliverability).
// ----------------------------------------------------------------------------
function buildText(input: CodeEmailInput): string {
  const redeemUrl = `${SITE}/mi-biblioteca/canjear?code=${encodeURIComponent(input.code)}`;
  const loc = [input.city, input.eraYear].filter(Boolean).join(' · ');
  return [
    'TURNO NOCTURNO — CITACIÓN CONFIDENCIAL',
    '',
    `Detective ${input.fullName || 'detective'},`,
    '',
    `Se te ha asignado un caso: «${input.caseTitle}»${loc ? ` (${loc})` : ''}.`,
    'Un Comandante te guiará por radio mientras tú y tu equipo repasáis pruebas y descubrís quién miente.',
    'El reloj empieza cuando actives tu código: reúne a tu equipo antes de entrar.',
    '',
    `TU CÓDIGO DE ACCESO: ${input.code}`,
    '',
    `Canjéalo aquí: ${redeemUrl}`,
    '',
    'Reglas del turno: 24 h para canjear · el turno empieza al activar · el código caduca a los 5 días.',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
