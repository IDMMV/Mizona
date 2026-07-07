import React, { useState } from 'react';
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
import Verification from './pages/Verification';
import SyncCenter from './pages/SyncCenter';
import Account from './pages/Account';
import Notifications from './pages/Notifications';
import LocalLab from './pages/LocalLab';
import AccessDenied from './pages/AccessDenied';
import { Blueprint } from './pages/Placeholders';
import Committees from './pages/Committees';
import { canAccessModule } from './lib/permissions';

function App() {
  const [page, setPage] = useState('panel');
  const { backendConnected, isAdmin, profile } = useApp();
  const pages = {
    panel: <Panel setPage={setPage}/>,
    community: <Community setPage={setPage}/>,
    committees: <Committees setPage={setPage}/>,
    school: <SchoolPage setPage={setPage}/>,
    chat: <Chat setPage={setPage}/>,
    notifications: <Notifications setPage={setPage}/>,
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
    sync: <SyncCenter/>,
    admin: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <Admin/>,
    settings: <Account/>,
    blueprint: <Blueprint/>
  };

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
