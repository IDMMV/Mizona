# Corrección de despliegue Vercel con Node.js 24

Cambios aplicados:

- `package.json`: Node.js `24.x`.
- `packageManager`: npm `11.4.2`.
- `vercel.json`: instalación con `npm install` en lugar de `npm ci`.
- `.npmrc`: registro público de npm y `package-lock=false`.
- Se retiró el `package-lock.json` que contenía URLs internas no accesibles desde Vercel.

Configuración de Vercel recomendada:

- Framework Preset: Vite
- Node.js Version: 24.x
- Install Command: usar la definida en `vercel.json`
- Build Command: usar la definida en `vercel.json`
- Output Directory: `dist`

Al volver a desplegar, usar Redeploy without cache.
