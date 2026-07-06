# Etapa 17 · Negocios y Marketplace multiusuario local

La Etapa 17 permite validar los flujos comerciales sin depender temporalmente de Supabase.

## Flujos de prueba

1. Un usuario crea un negocio y queda pendiente.
2. Un administrador abre Centro de Control > Negocios y lo aprueba.
3. Un usuario reclama una ficha sin propietario.
4. El administrador aprueba el reclamo y el usuario obtiene control de la ficha.
5. El propietario cambia el estado abierto/cerrado.
6. Otros usuarios califican, guardan y contactan mediante MiZona Chat.
7. Un usuario crea una publicación de Marketplace.
8. El administrador la aprueba.
9. Otro perfil la guarda, reporta o solicita contacto.
10. El vendedor pausa la publicación o la marca como vendida.

## Persistencia

- Datos estructurados: `localStorage`.
- Actualización entre pestañas: `BroadcastChannel` y evento `storage`.
- Imágenes de Marketplace: Data URL local limitada a 1.2 MB.
- Auditoría y notificaciones: núcleo local de MiZona.

No existe sincronización real entre dispositivos hasta restaurar y configurar el backend.
