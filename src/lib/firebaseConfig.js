// ETAPA 30.37
// Firebase queda preparado para Push Notifications, Analytics, Crash/Error tracking,
// Remote Config y Storage alternativo.
// No reemplaza a Supabase: Supabase sigue siendo la base principal de datos.

const firebaseKeys = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const firebaseEnabled = Boolean(firebaseKeys.apiKey && firebaseKeys.projectId && firebaseKeys.appId);

export function getFirebasePlan() {
  return [
    { area: 'Push Notifications', status: firebaseEnabled ? 'configurable' : 'pendiente', use: 'Avisar pedidos, mensajes, encuestas, reclamos y delivery.' },
    { area: 'Analytics', status: firebaseEnabled ? 'configurable' : 'pendiente', use: 'Medir uso de módulos, retención y rutas de usuario.' },
    { area: 'Crash / errores', status: firebaseEnabled ? 'configurable' : 'pendiente', use: 'Detectar pantallas que fallan en celular o PC.' },
    { area: 'Remote Config', status: firebaseEnabled ? 'configurable' : 'pendiente', use: 'Activar/desactivar funciones sin tocar código.' },
    { area: 'Storage alternativo', status: firebaseEnabled ? 'opcional' : 'pendiente', use: 'Guardar archivos pesados si se decide no usar Supabase Storage.' }
  ];
}

export function getFirebasePublicConfig() {
  return { ...firebaseKeys, enabled: firebaseEnabled };
}
