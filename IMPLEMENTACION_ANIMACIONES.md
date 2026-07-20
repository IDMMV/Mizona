# Implementación de animaciones

Cambios realizados:

- Se agregó `framer-motion` a las dependencias.
- Se corrigió `AnimatedPage.jsx` para usar una clave de página propia de MiZona, sin depender de React Router.
- Se mejoró `AnimatedCard.jsx` con reducción de movimiento, clic opcional y clases reutilizables.
- Se creó `AnimatedTab.jsx` y se integró en `Tabs.jsx`.
- Se creó `src/styles/animations.css` evitando conflictos entre `transform` de CSS y Framer Motion.
- Se integró `ThemeProvider` en el arranque principal.
- Se envolvió el contenido de cada página con `AnimatedPage` desde `AppRoot.jsx`.
- Se ejecutó `npm run build` correctamente.

## Observación importante

El archivo `src/context/AppContext.jsx` incluido en el ZIP solo expone `theme`, `toggleTheme`, `user` y `setUser`. Sin embargo, el resto de MiZona todavía solicita varias propiedades y funciones antiguas del contexto (perfil, autenticación, módulos, notificaciones, modo de datos, etc.). La compilación finaliza, pero esas funciones deben recuperarse del AppContext anterior antes de considerar esta versión totalmente funcional.
