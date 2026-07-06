# MiZona Enterprise V8 · Etapa 11 Comunidad Real

Versión acumulativa de MiZona. Conserva todo lo desarrollado hasta la Etapa 10 y conecta **Mi Comunidad** con Supabase.

## Lo nuevo

- Comunidades reales: colegios, comités, clubes, urbanizaciones, empresas, iglesias y asociaciones.
- Solicitud de creación y aprobación por el administrador de MiZona.
- Comunidades públicas, privadas, escolares, abiertas, con aprobación, código o invitación.
- Membresías, roles y estados reales.
- Administración de solicitudes de ingreso.
- Comunicados y eventos guardados en Supabase.
- Aulas escolares protegidas por comunidad.
- Documentos privados de hasta 20 MB mediante Supabase Storage.
- Descargas con enlaces firmados temporales.
- Actualización en tiempo real para comunicados, eventos y membresías.
- Políticas RLS para separar el contenido de cada comunidad.
- Interfaz adaptable a celular, tablet y computadora.

## Archivos SQL

### Ya ejecutaste la Etapa 10
Ejecuta únicamente:

```text
supabase/ETAPA11_COMUNIDAD_REAL.sql
```

### Proyecto nuevo o base limpia
Ejecuta:

```text
supabase/ETAPA10_Y_11_COMPLETO.sql
```

No ejecutes ambos archivos completos en la misma instalación. El SQL está preparado para repetirse, pero el archivo acumulativo ya contiene las dos etapas.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
```

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Estado honesto

En esta etapa son reales, después de configurar Supabase, la creación de comunidades, aprobación, membresías, comunicados, eventos, aulas y documentos. El chat escolar todavía abre el módulo visual anterior; su conexión en tiempo real será la siguiente etapa técnica.
