# MiZona Enterprise V8 — Etapa 18

## CampusHugo multiusuario local

Versión acumulativa construida sobre las Etapas 10–17. Continúa funcionando sin Supabase y convierte **CampusHugo** en un módulo educativo interactivo compartido entre perfiles y pestañas del mismo navegador.

## Funciones para estudiantes

- Catálogo de cursos con búsqueda, categorías y niveles.
- Favoritos independientes por perfil.
- Inscripción local a cursos gratuitos o de pago simulado.
- Progreso por lección y por usuario.
- Lecciones de video, práctica y evaluación simuladas.
- Evaluaciones con calificación automática y mínimo de 70%.
- Tareas, entregas y retroalimentación del profesor.
- Certificados con código único local.
- Notificaciones de inscripción, tareas, notas y certificados.

## Funciones para profesores

- Perfil profesor habilitado desde el Laboratorio local.
- Creación de cursos con estado pendiente para moderación.
- Creación de tareas por curso.
- Revisión y calificación de entregas.
- Panel con cursos, estudiantes y entregas pendientes.

## Centro de Control

- Aprobar, verificar, pausar o rechazar cursos.
- Revisar reportes de contenido.
- Métricas de cursos, inscripciones y certificados.
- Auditoría y cola de sincronización futura.

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

## Estado honesto

Los datos se comparten entre perfiles y pestañas del mismo navegador mediante almacenamiento local. No se sincronizan entre celulares o computadoras diferentes. Los videos, pagos, archivos educativos reales y verificación pública de certificados requieren un backend y servicios externos. No es necesario ejecutar SQL para esta etapa.
