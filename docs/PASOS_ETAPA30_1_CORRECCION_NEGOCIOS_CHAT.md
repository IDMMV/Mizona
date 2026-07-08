# Etapa 30.1 — Corrección Negocios y Chat

## Qué corrige

Cuando entrabas a **Negocios** y presionabas **Contactar por Chat** en una pollería de ejemplo, MiZona te llevaba al Chat pero no mostraba la conversación.

La causa era que esos negocios de ejemplo tienen propietario local, por ejemplo `local-maria`, pero al estar en modo **Nube** el Chat busca conversaciones reales en Supabase.

## Cómo probar

1. Sube esta versión a GitHub.
2. Espera el despliegue de Vercel.
3. Entra a MiZona en modo nube.
4. Ve a **Negocios**.
5. Abre una pollería o negocio de ejemplo.
6. Presiona **Contactar por Chat**.

Ahora verás un aviso claro si la ficha es de demostración/local.

## Para que el chat sea real

El negocio debe tener propietario real registrado en Supabase.

Flujo recomendado:

1. El dueño crea su cuenta real.
2. El dueño registra o reclama su negocio.
3. El administrador aprueba o verifica la ficha.
4. Recién ahí **Contactar por Chat** abre una conversación real.

## Botón atrás del celular

También se agregó historial interno. Al presionar atrás en Android, MiZona retrocede a la pantalla anterior dentro de la app antes de cerrar el navegador.
