import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import './styles/theme-dark-mockup.css';
import './styles/unified-design-3052.css';
import './styles/web-global-3053.css';
import './styles/design-system-3054.css';
import './styles/color-unification-3058.css';
import './styles/precision-layout-3059.css';
import './styles/qa-final-3060.css';
import './styles/palette-unified-3061.css';
import './styles/chat-desktop-web-3063.css';
import './styles/chat-finetune-3064.css';
import './styles/chat-contrast-fix-3065.css';
import './styles/location-picker-3066.css';
import './styles/android-readiness-3068.css';
import './styles/mobile-performance-3082.css';
import './styles/android-center-3069.css';
import './styles/commerce-cloud-3072.css';
import './styles/business-operations-3073.css';
import './styles/ride-cloud-3074.css';
import './styles/light-unified-3088.css';
import { APP_VERSION } from './version.js';

const rootElement = document.getElementById('root');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showBootError(error, title = 'MiZona no pudo iniciar') {
  console.error('MiZona boot error', error);
  window.__MIZONA_BOOT_ERROR__ = error;
  if (!rootElement) return;

  const message = error?.message || error?.reason?.message || error || 'Error desconocido';
  const stack = error?.stack || error?.reason?.stack || '';
  rootElement.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#f6fbf9;color:#0f2534;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;padding:24px;text-align:center">
      <div style="max-width:680px;background:white;border:1px solid #dbe9e3;border-radius:28px;padding:28px;box-shadow:0 16px 40px rgba(15,23,42,.08)">
        <div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#0f766e,#14b8a6);display:grid;place-items:center;color:white;font-weight:900;font-size:26px;margin:0 auto 18px">MZ</div>
        <p style="margin:0 0 8px;color:#0f766e;font-weight:900;letter-spacing:.12em">ETAPA ${APP_VERSION}</p>
        <h1 style="margin:0 0 10px;font-size:26px">${escapeHtml(title)}</h1>
        <p style="color:#64748b;margin:0 0 14px">Ahora la app muestra el error real en vez de quedarse congelada.</p>
        <pre style="white-space:pre-wrap;text-align:left;background:#0f172a;color:#e2e8f0;border-radius:16px;padding:14px;max-height:260px;overflow:auto">${escapeHtml(message + (stack ? '\n\n' + stack : ''))}</pre>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
          <button onclick="location.reload()" style="border:0;background:#0f766e;color:white;border-radius:16px;padding:12px 18px;font-weight:900">Volver a cargar</button>
          <button onclick="localStorage.clear();sessionStorage.clear();location.href='/?v=304800&t='+Date.now()" style="border:1px solid #dbe9e3;background:white;color:#0f2534;border-radius:16px;padding:12px 18px;font-weight:900">Limpiar datos y abrir</button>
        </div>
      </div>
    </div>
  `;
}

window.addEventListener('error', event => {
  showBootError(event.error || event.message, 'Error de JavaScript en MiZona');
});

window.addEventListener('unhandledrejection', event => {
  showBootError(event.reason || event, 'Error de carga en MiZona');
});

async function resetLegacyMizonaCache() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs
        .filter(reg => !String(reg.active?.scriptURL || '').includes('firebase-messaging-sw.js'))
        .map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter(key => String(key).toLowerCase().includes('mizona'))
        .map(key => caches.delete(key)));
    }
    console.info(`MiZona ${APP_VERSION}: caché legacy limpiado.`);
  } catch (error) {
    console.warn(`MiZona ${APP_VERSION}: no se pudo limpiar caché legacy`, error);
  }
}

async function startMizona() {
  window.__MIZONA_BOOT_STARTED__ = true;
  try {
    if (!rootElement) throw new Error('No se encontró el contenedor principal #root.');

    await resetLegacyMizonaCache();

    const [{ default: ErrorBoundary }, { AppProvider }, { default: AppRoot }] = await Promise.all([
      import('./components/ErrorBoundary.jsx'),
      import('./context/AppContext.jsx'),
      import('./AppRoot.jsx')
    ]);

    createRoot(rootElement).render(
      <ErrorBoundary>
        <AppProvider>
          <AppRoot />
        </AppProvider>
      </ErrorBoundary>
    );

    window.__MIZONA_APP_READY__ = true;
  } catch (error) {
    showBootError(error, 'MiZona no pudo cargar los módulos');
  }
}

startMizona();
