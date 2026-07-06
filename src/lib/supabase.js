import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const hasSupabase = Boolean(url && anon);

export const supabase = hasSupabase
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function friendlyAuthError(error) {
  const message = String(error?.message || error || 'Ocurrió un error inesperado.');
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) return 'Usuario, correo o contraseña incorrectos.';
  if (lower.includes('email not confirmed')) return 'Confirma tu correo antes de ingresar.';
  if (lower.includes('user already registered')) return 'Ese correo ya está registrado.';
  if (lower.includes('password')) return message;
  if (lower.includes('username')) return message;
  if (lower.includes('failed to fetch')) return 'No se pudo conectar con Supabase. Revisa internet y las variables de Vercel.';
  return message;
}
