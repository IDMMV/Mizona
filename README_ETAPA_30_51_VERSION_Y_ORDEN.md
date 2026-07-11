# Etapa 30.51 · Control de versión real + orden del menú

## 1) Por qué salía "30.48" aunque ya estabas en otra versión

El "30.48" estaba escrito a mano en 6 lugares distintos (título de la
pestaña, pantalla de carga, mensajes de error de arranque, `manifest.webmanifest`,
el panel de ajustes del chat y el recuadro "Etapa actual" del sidebar). Cada
etapa nueva había que buscarlos uno por uno y muchas veces se quedaba alguno
sin actualizar — por eso seguía viéndose "30.48" aunque el código ya fuera
más nuevo.

**Solución:** ahora existe un solo archivo, `src/version.js`:

```js
export const APP_VERSION = '30.51';
```

Todo lo demás lo lee de ahí automáticamente:
- El título de la pestaña y la pantalla de arranque (`index.html`), inyectado
  en cada build por un pequeño plugin en `vite.config.js`.
- El recuadro "Versión publicada" en el sidebar (antes decía fijo "Etapa 30 ·
  Finanzas personales privadas", sin importar la etapa real).
- El nombre "MiZona Enterprise V8 · v30.51" junto al logo, arriba del todo del
  menú — para que puedas verificar la versión de un vistazo.
- El panel de ajustes del chat.

**De ahora en adelante, para publicar una nueva versión solo cambias el
número en `src/version.js`.** También conviene subir el número en
`package.json` (`"version"`) para que coincida, aunque ya no es obligatorio
para que la app funcione.

Además, quité el número de versión de `manifest.webmanifest` y de los
mensajes del script `scripts/vercel-install.sh` — esos no necesitan
cambiar en cada etapa, así que ya no vas a tener que tocarlos nunca más.

## 2) Reordené el menú lateral por categorías

Antes el orden era básicamente el orden en que fuiste agregando módulos con
el tiempo (por ejemplo "Comités" aparecía primero y "Mi Panel", que debería
ser el inicio, aparecía a la mitad). Ahora está agrupado así, sin eliminar
ningún módulo:

- **Principal** — Mi Panel, Mi Comunidad, Comités, MiZona Chat, Notificaciones
- **Comercio y servicios** — Negocios, Marketplace, MiZona Business, CampusHugo,
  MiZona Ride, Zona Ride Delivery, Beneficios, MiZona Transfer
- **Finanzas** — Pagos MiZona, Mis gastos, Pasarela y liquidaciones
- **Inteligencia** — IA MiZona
- **Administración y sistema** — Centro de Control, Verificación, Usuarios y
  Sync, Supabase real, Nube y Push, Calidad y piloto, Arquitectura,
  Laboratorio local, Blueprint
- **Cuenta** — Configuración

Cada grupo tiene un pequeño encabezado en mayúsculas dentro del sidebar, para
que sea evidente por qué están agrupados así.

Este cambio está en `src/data/modules.js` (cada módulo ahora tiene un campo
`section`) y en `src/components/Shell.jsx` (agrupa y pinta por sección).

## Publicación en Vercel

Igual que siempre:
- Install Command: `bash scripts/vercel-install.sh`
- Build Command: `npx vite build`
- Output Directory: `dist`
