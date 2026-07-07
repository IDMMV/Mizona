# MiZona Enterprise V8 · Etapa 20

Versión acumulativa con **MiZona Ride multiusuario local**.

## Novedades

- Solicitudes de viaje entre perfiles de diferentes pestañas.
- Conductores registrados, verificados, suspendidos o rechazados.
- Estado disponible/fuera de línea.
- Asignación de conductor y código de seguridad de 4 dígitos.
- Estados: búsqueda, asignado, en camino, esperando, en curso y completado.
- Envíos y delivery con recojo, traslado y entrega.
- Historial, calificaciones y ganancias del conductor.
- Alertas, reportes, moderación y auditoría local.
- Restricción total para perfiles infantiles y estudiantiles.
- Sincronización inmediata entre pestañas mediante BroadcastChannel y localStorage.

## Limitaciones de esta etapa

- No utiliza GPS ni mapas reales.
- No procesa pagos reales.
- El botón de emergencia genera una alerta local para demostración; no llama a policía, bomberos ni contactos externos.
- Los datos no se comparten entre computadoras o celulares distintos.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Vercel

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Consulta `docs/PASOS_ETAPA20_SIN_SUPABASE.md`.
