# Limpieza segura del repositorio

Tu repositorio anterior tenía archivos HTML/CSS/JS antiguos mezclados con React/Vite.

## Conserva en la raíz
- `src/`
- `public/`
- `supabase/`
- `docs/`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `vercel.json`
- `.env.example`
- `.gitignore`
- `README.md`

## Elimina solo después de guardar una copia
- Carpetas antiguas `css/`, `js/` y `assets/` que no pertenecen a `public/`.
- HTML antiguos como `admin.html`, `beneficios.html`, `business.html`, `campushugo.html`, etc.
- Una carpeta `dist/` vieja puede eliminarse: Vercel la genera nuevamente.

Sube el contenido del ZIP final directamente a la raíz, no una carpeta contenedora adicional.
