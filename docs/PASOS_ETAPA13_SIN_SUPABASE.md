# Pasos para publicar la Etapa 13 sin Supabase

## 1. No ejecutes SQL

Esta etapa no necesita cambios en Supabase. Conserva las Etapas 10 y 11 ya instaladas y deja pendiente la verificación de la Etapa 12.

## 2. Actualiza GitHub

1. Descomprime el ZIP.
2. Abre la carpeta `MiZona_Enterprise_V8_ETAPA13_CONTINGENCIA_LOCAL`.
3. Sube **todo el contenido** a la raíz del repositorio.
4. Reemplaza los archivos anteriores cuando GitHub lo solicite.
5. Confirma que existan `src`, `public`, `dist`, `package.json`, `package-lock.json`, `vite.config.js` e `index.html`.

## 3. Vercel

Mantén:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

No es necesario borrar las variables de Supabase. La Etapa 13 inicia en modo local y no las utiliza.

## 4. Comprobación

Después de que Vercel muestre `Ready`:

1. Abre la web.
2. Presiona `Ctrl + F5`.
3. Debe aparecer la etiqueta `Local` en la parte superior.
4. Entra en MiZona Chat, envía un mensaje y actualiza la página.
5. El mensaje debe continuar visible.
6. Adjunta un archivo pequeño y comprueba que se pueda descargar.
7. Abre Notificaciones.
8. Abre Centro de Control > Contingencia y descarga un respaldo.

## 5. Límites

Los datos locales no se comparten entre celulares, navegadores ni computadoras. No borres los datos del navegador mientras se utilice esta etapa sin haber descargado antes un respaldo JSON.
