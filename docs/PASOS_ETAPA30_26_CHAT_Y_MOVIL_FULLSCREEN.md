# Etapa 30.26 · Chat navegable y pantallas móviles compactas

## Correcciones

- El módulo MiZona Chat en celular ahora inicia en lista de conversaciones, no en una conversación anterior.
- Se ignora la conversación pendiente en `sessionStorage` para móvil, evitando que el chat se abra pegado.
- El botón **Ver chats** y la flecha atrás limpian la conversación activa y regresan a la lista real.
- La conversación elegida entra en pantalla completa tipo WhatsApp.
- En pantalla completa se ocultan topbar, menú inferior, aviso local y textos globales.
- Los encabezados/hero de módulos móviles se hicieron más compactos.
- Los logos e íconos grandes se redujeron para que no ocupen toda la pantalla.
- Pestañas internas quedan más pequeñas, deslizables y aprovechan mejor la pantalla.

## Prueba recomendada

1. Abrir MiZona en celular.
2. Entrar a MiZona Chat desde la barra inferior.
3. Verificar que aparece la lista de chats.
4. Tocar una conversación.
5. Confirmar que abre en pantalla completa.
6. Tocar **Ver chats** o flecha atrás.
7. Confirmar que regresa a la lista y permite abrir otra conversación.
