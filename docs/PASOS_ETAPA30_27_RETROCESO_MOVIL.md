# Etapa 30.27 - Retroceso móvil y pantallas compactas

Cambios aplicados:

1. MiZona Chat en celular mantiene historial interno.
2. Al abrir una conversación se agrega un estado `#chat/{id}`.
3. La tecla física de retroceso del celular vuelve a la lista de chats.
4. El botón `Ver chats` también vuelve a la lista sin salir a otra pestaña.
5. La lista de chats se mantiene como primera pantalla del módulo Chat.
6. Se compactaron encabezados, logos, íconos y banners móviles.
7. Las pestañas internas ocupan menos espacio y se desplazan horizontalmente.
8. La pantalla móvil usa mejor el alto disponible.

Resultado esperado:
- En Chat: lista -> conversación -> retroceso del celular -> lista de chats.
- En otras pestañas: retroceso del celular vuelve a la pantalla/pestaña anterior de MiZona.
