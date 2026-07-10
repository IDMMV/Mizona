-- MiZona Enterprise V8 - Etapa 30.38
-- Corrige error: function gen_salt(unknown) does not exist
-- Ejecuta esto una sola vez en Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Si tu función create_community_request usa crypt/gen_salt, esta extensión es obligatoria.
