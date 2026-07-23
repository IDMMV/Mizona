# Corrección 30.95

- Se restauró el AppContext funcional que había sido reemplazado por una versión mínima.
- `moduleConfig`, `profile`, notificaciones, autenticación local, modo nube/local y apariencia vuelven a estar disponibles.
- Shell ahora protege `moduleConfig` con `Array.isArray` antes de ejecutar `.filter()`.
- Se añadieron valores seguros para perfil, zona y avatar.
- Se mantiene Node.js 24 y la instalación de Vercel mediante `npm install`.
