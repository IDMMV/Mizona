#!/usr/bin/env bash
set -e

echo "MiZona install 30.48: limpiando locks y caché npm..."
rm -f package-lock.json npm-shrinkwrap.json yarn.lock pnpm-lock.yaml

npm config set registry https://registry.npmjs.org/
npm config set package-lock false
npm config delete proxy || true
npm config delete https-proxy || true
npm cache clean --force || true

echo "MiZona install 30.48: instalando dependencias..."
npm install --registry=https://registry.npmjs.org/ --cache=/tmp/mizona-npm-cache --prefer-online --legacy-peer-deps --no-audit --no-fund

echo "MiZona install 30.48: dependencias listas."
