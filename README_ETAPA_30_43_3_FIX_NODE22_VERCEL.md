# MiZona Enterprise V8 - Etapa 30.43.3 Fix Node 22 Vercel

## Problema corregido

Vercel estaba usando Node 20 y Supabase nuevo requiere Node 22 o superior:

```text
@supabase/supabase-js required node >=22.0.0
current node v20.20.2
```

## Corrección

- `package.json` ahora fuerza:
```json
"engines": {
  "node": "22.x"
}
```

- Se mantiene registry público:
```text
https://registry.npmjs.org/
```

- No incluye package-lock.json.
- Mantiene el núcleo real 30.43.

## En Vercel

Revisar:

```text
Settings → Build and Deployment → Node.js Version
```

Seleccionar:

```text
22.x
```

Si solo aparece 20.x o 24.x, usar:

```text
24.x
```

Luego:

```text
Redeploy → Clear build cache
```
