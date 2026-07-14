# MiZona 30.68 — Preparación para Android

Esta etapa mantiene MiZona como web, pero corrige puntos que suelen fallar al envolverla después con Capacitor.

## Incorporado
- Áreas seguras de Android y dispositivos con recorte de pantalla.
- Compatibilidad con modo PWA y futura ejecución dentro de Capacitor.
- Aviso global cuando se pierde Internet.
- Conservación de la pantalla actual mientras vuelve la conexión.
- Controles táctiles optimizados.
- Inputs móviles con tamaño mínimo para evitar zoom involuntario.
- Ajustes para teclado, modales y barra de escritura del chat.
- Utilidad central para compartir, vibración y detección de plataforma.
- Navegación interna compatible con el botón Atrás.

## Reglas para las siguientes fases
1. Toda nueva función debe guardar datos reales.
2. No depender de nuevas pestañas para acciones esenciales.
3. Cámara, ubicación, audio y archivos deben pasar por una capa común.
4. Cada formulario debe manejar pérdida de conexión y errores.
5. No solicitar permisos al iniciar; pedirlos al usar la función.
6. Mantener un solo identificador cuando se agregue Capacitor.

## Pendiente antes del APK
- Auditoría de todos los módulos para detectar datos simulados.
- Integración nativa de cámara, ubicación, audio y documentos.
- Firebase Push en Android.
- Eliminación de cuenta y datos.
- Política de privacidad pública.
- Proyecto Capacitor y firma de prueba.
