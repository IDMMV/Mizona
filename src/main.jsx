import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import Shell from './components/Shell';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import Panel from './pages/Panel';
import Community, { SchoolPage } from './pages/Community';
import Chat from './pages/Chat';
import Transfer from './pages/Transfer';
import Admin from './pages/Admin';
import Benefits from './pages/Benefits';
import Businesses from './pages/Businesses';
import Marketplace from './pages/Marketplace';
import Campus from './pages/Campus';
import BusinessSuite from './pages/BusinessSuite';
import Ride from './pages/Ride';
import RideDelivery from './pages/RideDelivery';
import AiAssistant from './pages/AiAssistant';
import Payments from './pages/Payments';
import GatewayCenter from './pages/GatewayCenter';
import Verification from './pages/Verification';
import SyncCenter from './pages/SyncCenter';
import CloudCenter from './pages/CloudCenter';
import QualityCenter from './pages/QualityCenter';
import Account from './pages/Account';
import Notifications from './pages/Notifications';
import LocalLab from './pages/LocalLab';
import AccessDenied from './pages/AccessDenied';
import { Blueprint } from './pages/Placeholders';
import Committees from './pages/Committees';
import CloudLaunch from './pages/CloudLaunch';
import CloudAuthGate from './pages/CloudAuthGate';
import PersonalFinance from './pages/PersonalFinance';
import ArchitectureCenter from './pages/ArchitectureCenter';
import { canAccessModule } from './lib/permissions';

function App() {
  const initialPage = (() => {
    const fromState = window.history.state?.mizonaPage || window.history.state?.mzPage;
    const fromHash = window.location.hash?.replace('#', '').split('/')[0];
    return fromState || fromHash || 'panel';
  })();
  const [page, setPageState] = useState(initialPage);
  const isPoppingRef = useRef(false);
  const firstAuthRedirectRef = useRef(false);

  useEffect(() => {
    if (!window.history.state?.mizonaPage) {
      window.history.replaceState({ mizonaPage: page, mzPage: page }, '', `#${page}`);
    }
    const onPopState = event => {
      isPoppingRef.current = true;
      setPageState(event.state?.mizonaPage || event.state?.mzPage || 'panel');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setPage = useCallback(next => {
    setPageState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (!value) return prev;
      if (value !== prev && !isPoppingRef.current) {
        window.history.pushState({ mizonaPage: value, mzPage: value }, '', `#${value}`);
      }
      isPoppingRef.current = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return value;
    });
  }, []);
  const { backendConnected, isAdmin, profile, dataMode, isAuthenticated, authLoading } = useApp();

  const replacePage = useCallback(value => {
    if (!value) return;
    setPageState(value);
    window.history.replaceState({ mizonaPage: value, mzPage: value }, '', `#${value}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      firstAuthRedirectRef.current = false;
      if (page !== 'settings') replacePage('settings');
      return;
    }

    if (!firstAuthRedirectRef.current) {
      firstAuthRedirectRef.current = true;
      const hashPage = window.location.hash?.replace('#', '').split('/')[0];
      if (!hashPage || hashPage === 'settings' || page === 'settings') replacePage('panel');
    }
  }, [authLoading, isAuthenticated, page, replacePage]);

  const pages = {
    panel: <Panel setPage={setPage}/>,
    community: <Community setPage={setPage}/>,
    committees: <Committees setPage={setPage}/>,
    school: <SchoolPage setPage={setPage}/>,
    chat: <Chat setPage={setPage}/>,
    notifications: <Notifications setPage={setPage}/>,
    personalFinance: <PersonalFinance/>,
    localLab: <LocalLab setPage={setPage}/>,
    transfer: <Transfer/>,
    benefits: <Benefits/>,
    businesses: <Businesses setPage={setPage}/>,
    marketplace: <Marketplace setPage={setPage}/>,
    business: <BusinessSuite/>,
    campus: <Campus/>,
    ride: <Ride/>,
    rideDelivery: <RideDelivery setPage={setPage}/>,
    ai: <AiAssistant setPage={setPage}/>,
    verification: <Verification/>,
    payments: <Payments/>,
    gateway: <GatewayCenter/>,
    sync: <SyncCenter/>,
    cloudCenter: <CloudCenter/>,
    cloudLaunch: <CloudLaunch setPage={setPage}/>,
    quality: <QualityCenter/>,
    admin: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <Admin/>,
    architecture: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <ArchitectureCenter setPage={setPage}/>,
    settings: <Account/>,
    blueprint: <Blueprint/>
  };

  if (dataMode === 'cloud' && !authLoading && !isAuthenticated) return <CloudAuthGate/>;
  const denied = !canAccessModule(profile, page);
  return <Shell page={denied ? 'panel' : page} setPage={setPage}>{denied ? <AccessDenied setPage={setPage}/> : (pages[page] || pages.panel)}</Shell>;
}

const rootElement = document.getElementById('root');

function showBootError(error) {
  console.error('MiZona boot error', error);
  if (!rootElement) return;
  rootElement.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#f6fbf9;color:#0f2534;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;padding:24px;text-align:center">
      <div style="max-width:560px;background:white;border:1px solid #dbe9e3;border-radius:28px;padding:28px;box-shadow:0 16px 40px rgba(15,23,42,.08)">
        <div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#0f766e,#14b8a6);display:grid;place-items:center;color:white;font-weight:900;font-size:26px;margin:0 auto 18px">MZ</div>
        <h1 style="margin:0 0 10px;font-size:26px">MiZona no pudo iniciar</h1>
        <p style="color:#64748b;margin:0 0 14px">Se detectó un error al cargar la aplicación. Esto evita que la pantalla quede en blanco.</p>
        <pre style="white-space:pre-wrap;text-align:left;background:#0f172a;color:#e2e8f0;border-radius:16px;padding:14px;max-height:180px;overflow:auto">${String(error?.message || error || 'Error desconocido')}</pre>
        <button onclick="location.reload()" style="margin-top:14px;border:0;background:#0f766e;color:white;border-radius:16px;padding:12px 18px;font-weight:900">Volver a cargar</button>
      </div>
    </div>
  `;
}

try {
  if (!rootElement) throw new Error('No se encontró el contenedor principal #root.');
  createRoot(rootElement).render(
    <ErrorBoundary>
      <AppProvider><App/></AppProvider>
    </ErrorBoundary>
  );
} catch (error) {
  showBootError(error);
}

// Etapa 30.43.9:
// Se desactiva el Service Worker de la app principal para eliminar cachés antiguos
// que pueden dejar pantalla blanca o mezclar versiones. Firebase Messaging conserva
// su propio service worker cuando se active desde el módulo de notificaciones.
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
    console.info('MiZona 30.43.9: caché legacy limpiado.');
  } catch (error) {
    console.warn('MiZona 30.43.9: no se pudo limpiar caché legacy', error);
  }
}

if (import.meta.env.PROD) {
  window.addEventListener('load', resetLegacyMizonaCache);
}
