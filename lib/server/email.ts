// ============================================================================
// EMAIL — Envío transaccional de códigos vía Resend (OPCIONAL en MVP).
// Si no hay RESEND_API_KEY, `sendCodeEmail` devuelve { sent: false } sin error,
// para que el admin copie el código y lo envíe a mano por WhatsApp.
// ============================================================================

import { Resend } from 'resend';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const FROM = process.env.EMAIL_FROM ?? 'Turno Nocturno <no-reply@turnonocturno.app>';

export interface CodeEmailInput {
  to: string;
  fullName: string;
  caseTitle: string;
  code: string;
  resend?: boolean;
}

export async function sendCodeEmail(
  input: CodeEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY no configurada' };

  const resend = new Resend(apiKey);
  const redeemUrl = `${SITE}/mi-biblioteca/canjear?code=${encodeURIComponent(input.code)}`;

  const subject = input.resend
    ? `Reenvío · Tu código para ${input.caseTitle}`
    : `Tu código para ${input.caseTitle}`;

  const html = `
  <div style="background:#0B0E12;color:#E7EBF0;font-family:system-ui,Segoe UI,Roboto,sans-serif;padding:32px;border-radius:12px;max-width:520px;margin:auto">
    <div style="font-family:monospace;letter-spacing:.2em;color:#E9A63C;font-size:12px;text-transform:uppercase">Turno Nocturno · Expediente reabierto</div>
    <h1 style="font-size:22px;margin:12px 0 4px">Hola, ${escapeHtml(input.fullName)}</h1>
    <p style="color:#A7B0BC;line-height:1.5">Tu código de acceso para <b style="color:#E7EBF0">${escapeHtml(
      input.caseTitle,
    )}</b> está listo. Cánjéalo en tu biblioteca; recuerda que expira pronto.</p>
    <div style="font-family:monospace;font-size:26px;letter-spacing:.1em;color:#F2C173;background:#131820;border:1px solid #29323E;border-radius:10px;padding:16px;text-align:center;margin:20px 0">${escapeHtml(
      input.code,
    )}</div>
    <a href="${redeemUrl}" style="display:inline-block;background:#E9A63C;color:#1a1205;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">Canjear ahora</a>
    <p style="color:#6E7887;font-size:12px;margin-top:24px">Tienes 24 h para canjearlo. Una vez activada la sesión, 24 h para completarla. El código muere a los 5 días.</p>
  </div>`;

  const text = `Hola ${input.fullName}, tu código para ${input.caseTitle} es: ${input.code}. Canjéalo en ${redeemUrl}`;

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
