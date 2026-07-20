# Corrección Vercel - Animaciones

Se corrigió la compilación de producción causada por incompatibilidad entre Vite/Rolldown y Framer Motion/Motion DOM.

Cambios principales:
- Node fijado en 20.x para Vercel.
- Vite fijado en 7.3.1.
- @vitejs/plugin-react fijado en 5.1.2.
- Framer Motion fijado en 12.42.2.
- React y React DOM fijados en 19.2.0.
- package-lock.json regenerado.
- Vercel usa `npm ci` y `npm run build`.
- Se eliminó el instalador que borraba el lockfile en cada despliegue.

Prueba realizada:
`npm ci --no-audit --no-fund && npm run build`
Resultado: compilación exitosa.
