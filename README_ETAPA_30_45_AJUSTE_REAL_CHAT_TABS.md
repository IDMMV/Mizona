# MiZona Enterprise V8 - Etapa 30.46.1 ajuste real chat y pestañas

## Correcciones aplicadas

### Chat
- el botón **Salir** ahora sí sale del módulo Chat y vuelve a **Mi Panel**
- ya no se usa el botón Salir para solo cambiar pantalla completa
- se añade botón **Nuevo** para crear grupo
- el chat arranca en modo menos invasivo para evitar sensación de bloqueo

### Comités
- la barra superior principal se reduce a solo 7 pestañas:
  - Inicio
  - Participantes e Integrantes
  - Finanzas
  - Calendario y Agenda
  - Comunicados
  - Reportes
  - Actas y Documentos
- Cuotas, pagos, gastos, actas y documentos siguen existiendo, pero entran como vistas internas o accesos rápidos
- se mejora el estilo de pestañas para acercarlo al mockup aprobado

## Vercel

Seguir usando:

```
Install Command:
bash scripts/vercel-install.sh

Build Command:
npx vite build

Output Directory:
dist
```

Abrir después de publicar:

```
/?v=304601
```
