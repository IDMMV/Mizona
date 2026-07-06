# Despliegue en Vercel

1. Framework Preset: `Vite`.
2. Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Variables opcionales:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_ENDPOINT` (endpoint de servidor, no clave secreta)
5. Despliega y confirma que el commit nuevo aparece como `Ready`.
6. Usa `Ctrl + F5` si el navegador conserva archivos anteriores.

No es necesario subir `node_modules`. Vercel ejecuta `npm install` automáticamente.
