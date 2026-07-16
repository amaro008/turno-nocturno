'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient, createServiceClient } from '@/lib/server/supabase';
import { canRedeem, canActivate, computeCodeTiming } from '@/lib/engine/code-lifecycle';
import { sortitionVariant } from '@/lib/engine/variant-sortition';
import { SESSION_WINDOW_HOURS } from '@/lib/domain';

async function requireUser() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

/** Canjea un código: valida propiedad + ventanas y lo pasa a `redeemed`. */
export async function redeemCode(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase();
  if (!raw) redirect('/mi-biblioteca?error=' + encodeURIComponent('Ingresa un código.'));

  const svc = createServiceClient();
  const { data: code } = await svc.from('access_codes').select('*').eq('code', raw).maybeSingle();

  if (!code) redirect('/mi-biblioteca?error=' + encodeURIComponent('Ese código no existe.'));
  if (code.user_id !== user.id) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('Ese código no está asignado a tu cuenta.'));
  }
  if (code.status === 'redeemed' || code.status === 'activated' || code.status === 'completed') {
    redirect('/mi-biblioteca?ok=' + encodeURIComponent('Ese código ya estaba en tu biblioteca.'));
  }
  if (!canRedeem(code)) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('Ese código expiró o no está disponible.'));
  }

  await svc
    .from('access_codes')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('id', code.id);

  revalidatePath('/mi-biblioteca');
  redirect('/mi-biblioteca?ok=' + encodeURIComponent('¡Código canjeado! Ya puedes activar tu sesión.'));
}

/** Activa la sesión: sortea variante, crea `sessions`, marca el código y entra. */
export async function activateSession(formData: FormData) {
  const user = await requireUser();
  const codeId = String(formData.get('code_id') ?? '');
  if (!codeId) redirect('/mi-biblioteca?error=' + encodeURIComponent('Código inválido.'));

  const svc = createServiceClient();
  const { data: code } = await svc.from('access_codes').select('*').eq('id', codeId).maybeSingle();

  if (!code || code.user_id !== user.id) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('No encontramos ese código.'));
  }

  // Si ya estaba activado, solo entra a la sesión.
  if (code.status === 'activated' || code.status === 'in_progress') {
    redirect(`/s/${code.code}`);
  }
  if (!canActivate(code)) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('No se puede activar: el código expiró.'));
  }

  // Sorteo de variante activa
  const { data: variants } = await svc
    .from('variants')
    .select('id, active')
    .eq('case_id', code.case_id);
  if (!variants || variants.length === 0) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('El caso no tiene variantes disponibles.'));
  }
  const variantId = sortitionVariant(variants);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_WINDOW_HOURS * 60 * 60 * 1000);

  const { data: session, error: sErr } = await svc
    .from('sessions')
    .insert({
      access_code_id: code.id,
      user_id: user.id,
      case_id: code.case_id,
      variant_id: variantId,
      status: 'activated',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (sErr || !session) {
    redirect('/mi-biblioteca?error=' + encodeURIComponent('No pudimos crear la sesión. Intenta de nuevo.'));
  }

  await svc
    .from('access_codes')
    .update({ status: 'activated', activated_at: now.toISOString(), session_id: session.id })
    .eq('id', code.id);

  redirect(`/s/${code.code}`);
}

// Reexport para la UI (evita import cruzado directo del engine en cliente)
export async function codeTimingLabel(code: {
  created_at: string;
  sent_at: string | null;
  activated_at: string | null;
  status: string;
}) {
  return computeCodeTiming(code as never);
}
