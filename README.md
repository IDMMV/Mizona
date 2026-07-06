# MiZona Enterprise V8 — Versión final consolidada

Proyecto React + Vite acumulativo con:

- Mi Panel
- Mi Comunidad y colegio modelo
- MiZona Chat y Transfer
- Beneficios y oportunidades
- Negocios y lugares
- Marketplace local
- CampusHugo
- MiZona Business
- MiZona Ride
- IA MiZona
- Centro de Control
- Cuenta, privacidad y PWA

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

## Supabase
Copia `.env.example` a `.env`, coloca URL y clave anónima, y ejecuta `supabase/schema.sql` en un proyecto de prueba antes de producción.

## Estado honesto
La navegación, formularios y simulaciones principales funcionan en modo demostración. La persistencia real, autenticación multiusuario, archivos, pagos, mapas, comprobantes fiscales y proveedor de IA requieren configurar servicios externos y conectar cada operación al backend.
