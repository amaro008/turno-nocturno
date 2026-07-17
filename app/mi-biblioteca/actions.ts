'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient, createServiceClient } from '@/lib/server/supabase';
import { canRedeem } from '@/lib/engine/code-lifecycle';

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

// La activación de la sesión (creación + sorteo + arranque del reloj) ahora vive
// en `POST /api/sessions/activate`, invocada desde la pantalla de briefing tras
// la confirmación explícita del anfitrión. Ya NO ocurre desde la biblioteca.
