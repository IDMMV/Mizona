import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json', 'index.html', 'src/main.jsx', 'src/AppRoot.jsx',
  'src/context/AppContext.jsx', 'src/components/ErrorBoundary.jsx',
  'src/lib/supabase.js'
];
const failures = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`Falta ${file}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.engines?.node !== '24.x') failures.push('package.json debe usar Node 24.x');
for (const dependency of ['react','react-dom','vite','@supabase/supabase-js','framer-motion']) {
  if (!pkg.dependencies?.[dependency]) failures.push(`Falta dependencia ${dependency}`);
}
const appRoot = fs.readFileSync(path.join(root, 'src/AppRoot.jsx'), 'utf8');
if (appRoot.includes("createRoot } from 'react-dom/client'")) failures.push('AppRoot no debe crear una segunda raíz React');
const main = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
if (!main.includes('<ErrorBoundary>') || !main.includes('<AppProvider>')) failures.push('main.jsx debe envolver la app con ErrorBoundary y AppProvider');
if (failures.length) {
  console.error('\nPreflight falló:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Preflight correcto: estructura, Node, dependencias y raíz React verificadas.');
