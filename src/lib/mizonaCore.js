// MiZona Enterprise V8 - Etapa 30.43
// Núcleo real de Supabase.
// Este archivo no rompe el modo local. Sirve para consultar si la base real ya existe.

import { supabase, hasSupabase } from './supabase';

export const CORE_TABLES_3043 = [
  'mz_profiles',
  'mz_roles',
  'mz_modules',
  'mz_role_module_permissions',
  'mz_user_module_permissions',
  'mz_communities',
  'mz_community_members',
  'mz_conversations',
  'mz_conversation_members',
  'mz_messages',
  'mz_businesses',
  'mz_products',
  'mz_orders',
  'mz_order_items',
  'mz_notifications',
  'mz_files',
  'mz_firebase_devices'
];

export const CORE_MODULES_3043 = [
  ['panel', 'Mi Panel'],
  ['community', 'Mi Comunidad'],
  ['chat', 'MiZona Chat'],
  ['committees', 'Comités'],
  ['marketplace', 'Marketplace / Mi Tienda'],
  ['business', 'MiZona Business'],
  ['ride', 'MiZona Ride'],
  ['rideDelivery', 'Zona Ride Delivery'],
  ['campus', 'CampusHugo'],
  ['benefits', 'Beneficios'],
  ['transfer', 'MiZona Transfer'],
  ['notifications', 'Notificaciones'],
  ['admin', 'Centro de Control'],
  ['architecture', 'Arquitectura'],
  ['settings', 'Configuración']
];

export async function checkMizonaCoreStatus() {
  if (!hasSupabase || !supabase) {
    return {
      connected: false,
      ready: false,
      message: 'Supabase no está configurado en variables de entorno.',
      existing: [],
      missing: CORE_TABLES_3043
    };
  }

  const existing = [];
  const missing = [];

  for (const table of CORE_TABLES_3043) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) missing.push(table);
      else existing.push(table);
    } catch {
      missing.push(table);
    }
  }

  return {
    connected: true,
    ready: missing.length === 0,
    message: missing.length === 0
      ? 'Núcleo real 30.43 listo.'
      : `Faltan ${missing.length} tablas del núcleo real.`,
    existing,
    missing
  };
}

export function getCoreNextSteps() {
  return [
    'Ejecutar supabase/ETAPA_30_43_NUCLEO_REAL_SUPABASE.sql en Supabase SQL Editor.',
    'Verificar que no existan errores de políticas RLS.',
    'Confirmar que las tablas mz_* aparecen en Table Editor.',
    'Probar perfiles, comunidades y notificaciones.',
    'Luego conectar Chat real en la Etapa 30.44.'
  ];
}
