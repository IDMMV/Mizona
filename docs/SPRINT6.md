# Sprint 6 — CampusHugo integrado

## Objetivo
Integrar el centro de aprendizaje de MiZona con una experiencia visual completa para cursos, progreso, certificados, profesores y administración.

## Funciones incluidas
- Catálogo con búsqueda, categorías y filtros por nivel.
- Cursos gratuitos y de pago preparados para integración futura.
- Inscripción simulada y favoritos locales en el prototipo.
- Vista de contenido por módulos y lecciones.
- Reproductor de clase visual, recursos y acción de completar.
- Panel “Mi aprendizaje” con progreso y próximas actividades.
- Certificados con código verificable.
- Directorio de profesores revisados.
- Gestión CampusHugo dentro del Centro de Control.

## Base de datos
El archivo `supabase/schema.sql` añade cursos, módulos, lecciones, matrículas, progreso, evaluaciones, intentos y certificados con políticas RLS iniciales.

## Estado
La navegación y las interacciones visuales funcionan. Los datos mostrados son simulados; la siguiente integración conectará formularios, autenticación, storage y persistencia real con Supabase.
