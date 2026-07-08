# MiZona Enterprise V8 · Etapa 30

## 1. Publicar web

Descomprime el ZIP y reemplaza el contenido del repositorio en GitHub.

En Vercel usa:

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

## 2. Ejecutar SQL adicional

Como esta etapa agrega una función nueva que no estaba en el SQL completo anterior, ejecuta en Supabase:

```text
supabase/ETAPA30_FINANZAS_PERSONALES.sql
```

Este archivo crea tablas privadas con `owner_id = auth.uid()` para que cada usuario vea solamente sus propios gastos.

## 3. Probar

1. Ingresa con un usuario adulto o estudiante.
2. Abre **Mis gastos**.
3. Registra un ingreso.
4. Registra un gasto, por ejemplo cuota del aula, mercado o pasaje.
5. Crea una meta de ahorro.
6. Descarga CSV para Excel.
7. Cambia a otro usuario y confirma que no ve los movimientos del usuario anterior.

## 4. Estado actual

La pantalla ya trabaja en modo local por perfil y queda preparada para Supabase. Para sincronización completa con la nube se requiere conectar los formularios directamente a las tablas creadas por el SQL de esta etapa.
