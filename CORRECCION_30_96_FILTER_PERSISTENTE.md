# MiZona 30.96 — corrección persistente de `.filter()`

El error continuaba porque el navegador conservaba un estado local versión 14 incompleto.

Correcciones:
- normalización automática de todas las colecciones de `localStore`;
- restauración de `directory` cuando falta o está vacía;
- reparación y guardado automático del estado existente;
- protección adicional en `Panel.jsx` para `moduleConfig`;
- no es necesario borrar manualmente los datos del usuario.
