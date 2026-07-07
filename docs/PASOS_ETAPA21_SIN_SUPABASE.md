# Publicar y probar la Etapa 21

## 1. GitHub

Descomprime el ZIP y reemplaza todo el contenido del repositorio con los archivos de esta etapa.

## 2. Vercel

Usa:

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

No necesitas variables de Supabase.

## 3. Probar IA MiZona

1. Abre MiZona con un perfil adulto o administrador.
2. Entra a **IA MiZona**.
3. Crea una conversación.
4. Selecciona Comunidad, Negocio, Aprendizaje, Mi zona o Ride.
5. Haz una pregunta y revisa los accesos directos.
6. Guarda una respuesta como plan.
7. Abre otra pestaña con otro perfil y verifica que el historial sea independiente.

## 4. Seguridad

Las cuentas estudiantiles no ven IA MiZona por defecto. El motor local bloquea consultas que contienen contraseñas, datos bancarios o información privada de menores.

## 5. Endpoint opcional

Puedes agregar en Vercel:

```text
VITE_AI_ENDPOINT=https://tu-servidor-seguro/api/mizona-ai
```

Nunca coloques una API key de un proveedor de IA dentro de variables `VITE_*`, porque esas variables llegan al navegador. La clave debe permanecer únicamente en el servidor.

## 6. Limitación actual

El asistente local no consulta Internet ni sincroniza datos entre dispositivos. Su función es permitir probar la experiencia, privacidad, historial, acciones y administración antes de conectar un backend real.
