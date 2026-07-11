import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { APP_VERSION } from './src/version.js';

// Inyecta la versión real (src/version.js) en index.html en cada build,
// para que el título de la pestaña y la pantalla de arranque nunca
// queden desactualizados respecto al código publicado.
function injectVersionPlugin() {
  return {
    name: 'mizona-inject-version',
    transformIndexHtml(html) {
      return html.replaceAll('__APP_VERSION__', APP_VERSION);
    }
  };
}

export default defineConfig({
  plugins: [react(), injectVersionPlugin()],
  server: { port: 5173 },
  build: { outDir: 'dist' }
});
