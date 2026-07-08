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
import { canAccessModule } from './lib/permissions';

function App() {
  const initialPage = (() => {
    const fromState = window.history.state?.mzPage;
    const fromHash = window.location.hash?.replace('#', '').split('/')[0];
    return fromState || fromHash || 'panel';
  })();
  const [page, setPageState] = useState(initialPage);
  const isPoppingRef = useRef(false);
  useEffect(() => {
    if (!window.history.state?.mzPage) {
      window.history.replaceState({ mzPage: page }, '', `#${page}`);
    }
    const onPopState = event => {
      isPoppingRef.current = true;
      setPageState(event.state?.mzPage || 'panel');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const setPage = useCallback(next => {
    setPageState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (!value) return prev;
      if (value !== prev && !isPoppingRef.current) {
        window.history.pushState({ mzPage: value }, '', `#${value}`);
      }
      isPoppingRef.current = false;
      return value;
    });
  }, []);
  const { backendConnected, isAdmin, profile, dataMode, isAuthenticated, authLoading } = useApp();
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
    ai: <AiAssistant setPage={setPage}/>,
    verification: <Verification/>,
    payments: <Payments/>,
    gateway: <GatewayCenter/>,
    sync: <SyncCenter/>,
    cloudCenter: <CloudCenter/>,
    cloudLaunch: <CloudLaunch setPage={setPage}/>,
    quality: <QualityCenter/>,
    admin: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <Admin/>,
    settings: <Account/>,
    blueprint: <Blueprint/>
  };

  if (dataMode === 'cloud' && !authLoading && !isAuthenticated) return <CloudAuthGate/>;
  const denied = !canAccessModule(profile, page);
  return <Shell page={denied ? 'panel' : page} setPage={setPage}>{denied ? <AccessDenied setPage={setPage}/> : (pages[page] || pages.panel)}</Shell>;
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AppProvider><App/></AppProvider>
  </ErrorBoundary>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Service worker no registrado', error)));
}
