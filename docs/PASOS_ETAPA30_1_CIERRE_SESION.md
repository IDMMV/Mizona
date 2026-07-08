# Etapa 30.1 · Corrección cierre de sesión

Se incorporó el cierre de sesión visible para el usuario activo.

## Cambios incluidos

- Botón superior con ícono de cerrar sesión.
- Botón de cerrar sesión dentro de Mi Cuenta > Perfil.
- Botón de cerrar sesión dentro de Mi Cuenta > Acceso.
- En modo local, cerrar sesión no borra datos: deja la app como Visitante.
- Al cerrar sesión local, se puede volver a ingresar por usuario local desde Mi Cuenta > Acceso.
- Si la sesión está cerrada, solo se muestran módulos básicos de acceso.
- En modo nube, el botón mantiene el cierre real con Supabase Auth.

## Prueba recomendada

1. Ingresar con JOSE1985.
2. Abrir Mi Cuenta.
3. Presionar Cerrar sesión.
4. Verificar que aparezca Visitante.
5. Entrar a Acceso.
6. Iniciar sesión local con JOSE1985.
