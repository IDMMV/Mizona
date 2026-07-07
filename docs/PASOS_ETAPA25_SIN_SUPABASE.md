# Publicar y probar la Etapa 25

## 1. GitHub

Descomprime el ZIP y reemplaza todo el contenido del repositorio con los archivos de esta etapa.

## 2. Vercel

Usa:

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

No necesitas variables de Supabase.

## 3. Probar Nube y Push

1. Ingresa con José o María administradora.
2. Abre **Nube y Push**.
3. Revisa el estado general.
4. Entra a **Push y avisos**.
5. Selecciona una plantilla.
6. Presiona **Enviar prueba local**.
7. Abre Notificaciones y valida que el aviso aparece por perfil.

## 4. Probar permiso de navegador

1. En Nube y Push presiona **Pedir permiso del navegador**.
2. Acepta o rechaza el permiso.
3. Envía una prueba local.
4. Si el navegador permite, aparecerá también una notificación del sistema.

## 5. Probar archivos

1. Entra a **Archivos**.
2. Selecciona módulo y retención.
3. Carga un archivo normal como PDF, imagen o DOCX.
4. Valida que quede con estado limpio y listo para nube.
5. Prueba un archivo peligroso con extensión `.exe`, `.bat`, `.js` o similar; debe quedar bloqueado o en cuarentena.

## 6. Probar buckets

1. Entra a **Buckets**.
2. Cambia los días de retención de cada bucket.
3. Verifica que la configuración quede guardada al recargar.

## 7. Descargar reporte

1. En Estado presiona **Reporte JSON**.
2. Guarda el archivo.
3. Este reporte sirve para revisar plantillas, archivos, colas y configuración.

## 8. Limitación actual

La etapa 25 aún no sube archivos a una nube real ni envía notificaciones desde servidor. Para producción se necesita backend, storage privado, service worker con VAPID, proveedor de correo/WhatsApp/SMS y reglas de seguridad del servidor.
