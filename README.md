# MiZona Enterprise V8 — Etapa 21

## IA MiZona multiusuario local

Versión acumulativa construida sobre las Etapas 1–20. Funciona sin Supabase y conserva los datos en el navegador.

### Incluye

- Historial de conversaciones separado para cada perfil local.
- Especialistas de Comunidad, Negocio, Aprendizaje, Zona y Ride.
- Respuestas contextuales basadas en conteos y resúmenes de los módulos locales.
- Accesos directos desde cada respuesta al módulo correspondiente.
- Planes guardados, listas de verificación y preguntas favoritas.
- Calificación de respuestas.
- Alertas por contraseñas, datos bancarios o información privada de menores.
- Panel administrativo de IA con configuración, métricas y revisión de alertas.
- Actualización entre pestañas mediante BroadcastChannel.
- Endpoint externo opcional mediante `VITE_AI_ENDPOINT`, sin exponer claves en el navegador.
- IA oculta para cuentas estudiantiles por defecto.

### Ejecutar

```bash
npm install
npm run dev
npm run build
```

### Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

### Estado honesto

El motor local es un asistente basado en reglas y datos resumidos del navegador; no es un modelo generativo completo. El endpoint externo es opcional y debe implementarse en un servidor seguro. Los datos siguen siendo locales y no se sincronizan entre equipos distintos.
