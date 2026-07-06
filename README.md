
# MiZona Enterprise V8 — Etapa 18.1

## Corrección de roles y portal para comités

Esta entrega corrige el punto detectado en pruebas: las cuentas estudiantiles no deben ver módulos de adultos, administración, negocios, ride, marketplace, IA ni comités.

## Cambios principales

- Menú filtrado por tipo de perfil.
- Ian/Dylan y otros perfiles estudiantiles solo ven comunidad escolar, chat permitido, transfer, CampusHugo, notificaciones y configuración.
- Centro de Control, Laboratorio local, Blueprint y módulos de negocio quedan ocultos para niños.
- Nueva pantalla **Comités** para adultos y administradores.
- Plataforma de comités con resumen, aportes, gastos, actas, documentos y respaldo local.
- Panel principal cambia según el perfil activo.
- Pantalla de acceso restringido explica por qué un niño no puede entrar a módulos adultos.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

No requiere SQL porque continúa en modo local.
