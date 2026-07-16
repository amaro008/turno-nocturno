'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { generateAccessCode } from '@/lib/engine/code-lifecycle';
import { sendCodeEmail } from '@/lib/server/email';

async function logAdmin(adminId: string, action: string, entityId: string, payload: object) {
  const svc = createServiceClient();
  await svc.from('admin_actions').insert({
    admin_id: adminId,
    action,
    entity_type: 'access_code',
    entity_id: entityId,
    payload_json: payload,
  });
}

/** Crea un código para {usuario, caso}. Opcionalmente lo envía por email. */
export async function createCode(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const caseId = String(formData.get('case_id') ?? '');
  const note = String(formData.get('note') ?? '').trim() || null;
  const sendNow = formData.get('send') === 'now';

  if (!email || !caseId) redirect('/admin/codigos/nuevo?error=' + encodeURIComponent('Selecciona usuario y caso.'));

  const svc = createServiceClient();

  const { data: user } = await svc.from('profiles').select('id, full_name, email').eq('email', email).maybeSingle();
  if (!user) {
    redirect('/admin/codigos/nuevo?error=' + encodeURIComponent('Ese usuario no existe. Pídele que se registre primero.'));
  }

  const { data: caseRow } = await svc.from('cases').select('id, title, active').eq('id', caseId).maybeSingle();
  if (!caseRow || !caseRow.active) {
    redirect('/admin/codigos/nuevo?error=' + encodeURIComponent('Ese caso no está activo.'));
  }

  // Generar código único (reintentos)
  let code = generateAccessCode();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await svc.from('access_codes').select('id').eq('code', code).maybeSingle();
    if (!clash) break;
    code = generateAccessCode();
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error } = await svc
    .from('access_codes')
    .insert({
      code,
      user_id: user!.id,
      case_id: caseRow!.id,
      status: sendNow ? 'sent' : 'draft',
      note,
      created_at: nowIso,
      sent_at: sendNow ? nowIso : null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    redirect('/admin/codigos/nuevo?error=' + encodeURIComponent('No pudimos crear el código.'));
  }

  let emailNote = '';
  if (sendNow) {
    const r = await sendCodeEmail({ to: user!.email, fullName: user!.full_name || 'detective', caseTitle: caseRow!.title, code });
    emailNote = r.sent ? ' Email enviado.' : ' (Email no configurado: copia el código y envíalo tú).';
  }

  await logAdmin(admin.id, sendNow ? 'code_create_send' : 'code_create_draft', inserted.id, { code, email });

  revalidatePath('/admin/codigos');
  redirect(`/admin/codigos?ok=${encodeURIComponent(`Código ${code} creado.${emailNote}`)}&code=${encodeURIComponent(code)}`);
}

export async function resendCode(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const svc = createServiceClient();
  const { data: code } = await svc.from('access_codes').select('*, cases(title), profiles(full_name, email)').eq('id', id).maybeSingle();
  if (!code) redirect('/admin/codigos?error=' + encodeURIComponent('Código no encontrado.'));

  const nowIso = new Date().toISOString();
  await svc.from('access_codes').update({ status: 'sent', sent_at: nowIso }).eq('id', id);

  const rel = code as unknown as { code: string; cases: { title: string }; profiles: { full_name: string; email: string } };
  const r = await sendCodeEmail({
    to: rel.profiles.email,
    fullName: rel.profiles.full_name || 'detective',
    caseTitle: rel.cases.title,
    code: rel.code,
    resend: true,
  });
  await logAdmin(admin.id, 'code_resend', id, { sent: r.sent });

  revalidatePath('/admin/codigos');
  redirect('/admin/codigos?ok=' + encodeURIComponent(r.sent ? 'Email reenviado.' : 'Marcado como enviado (email no configurado).'));
}

export async function revokeCode(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const svc = createServiceClient();
  const { data: code } = await svc.from('access_codes').select('status').eq('id', id).maybeSingle();
  if (!code) redirect('/admin/codigos?error=' + encodeURIComponent('Código no encontrado.'));
  if (['activated', 'in_progress', 'completed'].includes(code.status)) {
    redirect('/admin/codigos?error=' + encodeURIComponent('No se puede revocar un código ya activado.'));
  }
  await svc.from('access_codes').update({ status: 'expired' }).eq('id', id);
  await logAdmin(admin.id, 'code_revoke', id, {});
  revalidatePath('/admin/codigos');
  redirect('/admin/codigos?ok=' + encodeURIComponent('Código revocado.'));
}
