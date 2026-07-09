# Etapa 30.21 · Chat alumno navegable

## Objetivo
Corregir el chat en modo alumno para que no quede encerrado dentro de una sola conversación.

## Cambios aplicados
- Vista principal del chat con buscador.
- Pestañas separadas: Chats, Grupos, Contactos y Solicitudes.
- El alumno puede volver desde una conversación a la lista de chats.
- Botón visible `Ver chats` dentro de la conversación.
- En celular se muestra primero la lista y luego la conversación.
- En PC/tablet se mantiene la vista dividida lista/conversación.
- Los alumnos solo ven contactos y grupos permitidos.
- Se ocultó la creación de grupos para alumnos.
- Se mejoró la apariencia móvil del chat.

## Prueba recomendada
1. Iniciar sesión como alumno.
2. Entrar a MiZona Chat.
3. Verificar que primero aparezca lista de Chats/Grupos/Contactos/Solicitudes.
4. Entrar a una conversación.
5. Tocar `Volver` o `Ver chats`.
6. Confirmar que regresa a la lista y permite elegir otro chat.

## Build
Probado con `npm run build`.
