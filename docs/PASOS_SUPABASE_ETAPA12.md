# Pasos para activar la Etapa 12

## 1. Confirma la base anterior

Debes haber ejecutado correctamente las Etapas 10 y 11. No vuelvas a ejecutar archivos antiguos.

## 2. Ejecuta el SQL principal

1. Entra a Supabase.
2. Abre **SQL Editor**.
3. Crea una consulta nueva.
4. Copia todo `supabase/ETAPA12_CHAT_REAL.sql`.
5. Presiona **Run**.

Al final deben aparecer en `true`:

```text
contact_requests_ok
conversations_ok
messages_ok
attachments_ok
send_message_ok
bucket_ok
```

## 3. Limpieza automática opcional

Ejecuta `supabase/ETAPA12_LIMPIEZA_AUTOMATICA_OPCIONAL.sql` solamente después del SQL principal. Si Cron no está disponible, omítelo. La app seguirá ocultando mensajes vencidos, pero deberás ejecutar periódicamente:

```sql
select public.mz_chat_cleanup_expired();
```

## 4. Publica la web

Sube todo el contenido del proyecto a la raíz de GitHub. En Vercel:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

## 5. Prueba con dos cuentas

1. Registra dos usuarios adultos.
2. Con la primera cuenta busca el usuario exacto de la segunda.
3. Envía la solicitud.
4. Acepta desde la segunda cuenta.
5. Abre la conversación y envía un mensaje.
6. Prueba una imagen o PDF menor de 25 MB.
