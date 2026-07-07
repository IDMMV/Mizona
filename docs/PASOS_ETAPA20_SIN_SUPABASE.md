# Publicar y probar la Etapa 20 sin Supabase

## Publicación

1. Descomprime el ZIP.
2. Sube todo el contenido a la raíz del repositorio de GitHub.
3. En Vercel conserva: Vite, `npm run build` y salida `dist`.
4. Espera que el despliegue aparezca como **Ready**.
5. Abre MiZona y actualiza con `Ctrl + F5`.

## Prueba de viaje entre dos perfiles

1. En una pestaña entra como **José**.
2. Abre **MiZona Ride** y crea un viaje.
3. Abre una segunda pestaña desde **Laboratorio local**.
4. Cambia el perfil a **Carlos Mendoza**. Carlos ya es conductor verificado.
5. En MiZona Ride entra a **Panel conductor**, activa **Disponible** y acepta el viaje.
6. Vuelve a la pestaña de José: aparecerán conductor, placa y código.
7. Carlos cambia el estado a **Voy al origen**, luego **Llegué**.
8. Carlos ingresa el código que ve José para iniciar el viaje.
9. Carlos completa el viaje.
10. José lo califica desde Historial.

## Probar registro de conductor

1. Cambia a **Valery Hugo**.
2. Abre MiZona Ride. Su solicitud aparece pendiente.
3. Cambia a José o María, abre Centro de Control > MiZona Ride y aprueba a Valery.
4. Regresa a la pestaña de Valery y activa Disponible.

## Probar envío

1. José crea un envío.
2. Carlos lo acepta desde Panel conductor.
3. Carlos marca recogido, en tránsito y entregado.
4. José ve los cambios en Seguimiento.

## Importante

- No ejecutes SQL.
- No se usa Supabase.
- La ubicación y el mapa son simulados.
- Las alertas de emergencia son locales y no contactan servicios externos.
- La sincronización funciona solo entre pestañas del mismo navegador.
