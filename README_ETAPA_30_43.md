# MiZona Enterprise V8 - Etapa 30.43

## Enfoque
Núcleo real oficial de MiZona en Supabase.

Esta etapa prepara la base real para que las siguientes etapas conecten datos compartidos entre usuarios, celulares y administradores.

## Qué incluye

### SQL principal
Archivo:

```text
supabase/ETAPA_30_43_NUCLEO_REAL_SUPABASE.sql
```

Incluye:

- `create extension if not exists pgcrypto;`
- Tablas oficiales con prefijo `mz_`
- Roles oficiales
- Módulos oficiales
- Permisos por rol
- Permisos por usuario
- Comunidades
- Miembros
- Fotos de comunidad
- Chat real base
- Conversaciones
- Mensajes
- Adjuntos
- Encuestas de chat
- Eventos de chat
- Negocios
- Productos
- Pedidos
- Items de pedidos
- Historial de estados
- Reviews/calificaciones
- Reclamos
- Comité real base
- Participantes
- Cuotas
- Pagos
- Gastos
- Actas/documentos
- Eventos
- Notificaciones
- Archivos
- Firebase devices
- RLS
- Índices
- Realtime

## Tablas principales

- `mz_profiles`
- `mz_roles`
- `mz_modules`
- `mz_role_module_permissions`
- `mz_user_module_permissions`
- `mz_communities`
- `mz_community_members`
- `mz_conversations`
- `mz_conversation_members`
- `mz_messages`
- `mz_businesses`
- `mz_products`
- `mz_orders`
- `mz_order_items`
- `mz_notifications`
- `mz_files`
- `mz_firebase_devices`

## Importante

Esta etapa crea la base. Todavía no convierte todos los módulos al 100% real, pero deja el camino limpio para:

- 30.44 Chat real con Supabase
- 30.45 Marketplace y pedidos reales
- 30.46 Comité real
- 30.47 Firebase push
- 30.48 Archivos reales en Storage

## Cómo ejecutar

1. Entra a Supabase.
2. Abre SQL Editor.
3. Copia todo el contenido de:

```text
supabase/ETAPA_30_43_NUCLEO_REAL_SUPABASE.sql
```

4. Ejecuta.
5. Si aparece error por realtime porque una tabla ya estaba agregada, ejecuta el resto del script y luego seguimos. El script ya intenta evitar duplicados.

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
