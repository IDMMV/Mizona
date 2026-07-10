# MiZona Enterprise V8 - Etapa 30.37

## Enfoque
Preparar la arquitectura real Supabase + Firebase sin mezclar funciones.

## Decisión técnica
- Supabase será la base principal:
  - usuarios
  - roles
  - permisos
  - pedidos
  - marketplace
  - business
  - chat
  - encuestas
  - eventos
  - reclamos
  - verificación de proveedores
- Firebase queda preparado para:
  - notificaciones push
  - analytics
  - crash/error tracking
  - remote config
  - storage alternativo si se decide usar

## Cambios incluidos

### Nueva página
- Arquitectura
- Visible para administración
- Muestra:
  - estado de Supabase
  - estado de Firebase
  - qué va en Supabase
  - qué va en Firebase
  - tablas recomendadas
  - variables Firebase pendientes
  - orden de próximas etapas

### Firebase
- Nuevo archivo:
  - src/lib/firebaseConfig.js
- No rompe la web si no hay claves.
- Queda listo para activarse cuando se agreguen variables en Vercel.

### Supabase
- Nuevo script SQL:
  - supabase/ETAPA_30_37_PEDIDOS_REALES.sql
- Tablas recomendadas:
  - market_orders
  - market_order_items
  - market_order_status_logs
  - provider_reviews
  - provider_claims
  - provider_verifications
  - firebase_devices

### Variables .env.example
Se agregaron variables Firebase opcionales:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

## Próximas etapas recomendadas
- 30.38 Encuestas reales en chat
- 30.39 Eventos y recordatorios reales
- 30.40 Reclamos y moderación
- 30.41 Verificación de proveedores
- 30.42 Notificaciones internas + Firebase Push
- 30.43 Ubicación en tiempo real

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
