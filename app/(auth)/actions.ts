'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/server/supabase';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/mi-biblioteca');

  if (!email || !password) fail('/login', 'Ingresa correo y contraseña.');

  const supabase = createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail('/login', 'Correo o contraseña incorrectos.');

  redirect(next || '/mi-biblioteca');
}

export async function registerAction(formData: FormData) {
  const full_name = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const birth_year = String(formData.get('birth_year') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const accepted = formData.get('accepted') === 'on';

  if (!full_name || !email || !password) fail('/registro', 'Completa nombre, correo y contraseña.');
  if (password.length < 8) fail('/registro', 'La contraseña debe tener al menos 8 caracteres.');
  if (!accepted) fail('/registro', 'Debes aceptar los términos y el aviso de privacidad.');

  const yearNum = Number(birth_year);
  if (!birth_year || Number.isNaN(yearNum) || yearNum < 1920 || yearNum > 2012) {
    fail('/registro', 'Ingresa un año de nacimiento válido.');
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${SITE}/auth/callback`,
      data: {
        full_name,
        birth_year,
        country,
        city,
        accepted_terms: 'true',
        accepted_privacy: 'true',
      },
    },
  });

  if (error) {
    fail('/registro', error.message.includes('registered') ? 'Ese correo ya está registrado.' : 'No pudimos crear tu cuenta.');
  }

  // Si el proyecto tiene verificación por email activada, no habrá sesión aún.
  if (!data.session) {
    redirect('/registro?ok=' + encodeURIComponent('Te enviamos un correo para verificar tu cuenta. Revisa tu bandeja.'));
  }

  redirect('/mi-biblioteca');
}

export async function logoutAction() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
