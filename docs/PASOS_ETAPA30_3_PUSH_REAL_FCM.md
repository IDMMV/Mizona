# Etapa 30.3 · Push real entre celulares con Firebase FCM

Esta etapa deja MiZona preparada para recibir notificaciones reales entre celulares.

## 1. Firebase

Crea un proyecto en Firebase y entra a **Project settings**.
Copia estos datos de la app web:

- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

Luego entra a **Cloud Messaging** y genera la clave Web Push / VAPID.

## 2. Variables en Vercel

Agrega estas variables:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## 3. Service Worker

Edita `public/firebase-messaging-sw.js` y reemplaza los mismos valores `TU_FIREBASE_...`.

## 4. Supabase SQL

Ejecuta en Supabase SQL Editor:

`supabase/ETAPA30_3_PUSH_REAL_FCM.sql`

## 5. Supabase Edge Function

Despliega la función:

```bash
supabase functions deploy send-chat-push
```

Variables necesarias en Supabase Functions:

```env
FCM_PROJECT_ID=tu_project_id
FCM_CLIENT_EMAIL=client_email_del_service_account
FCM_PRIVATE_KEY=private_key_del_service_account
```

El `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` normalmente los entrega Supabase al runtime.

## 6. Prueba

1. Abre MiZona en el celular A.
2. Ingresa con tu usuario.
3. Entra a **Nube y Push > Push real FCM**.
4. Presiona **Activar notificaciones reales**.
5. Abre MiZona en otro celular con otro usuario.
6. Envía un mensaje por MiZona Chat.
7. El celular A debe recibir una notificación.

## Nota importante

La web debe estar en HTTPS. Vercel ya cumple con eso.
