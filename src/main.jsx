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
import Account from './pages/Account';
import Notifications from './pages/Notifications';
import AccessDenied from './pages/AccessDenied';
import { Blueprint } from './pages/Placeholders';

function App() {
  const [page, setPage] = useState('panel');
  const { backendConnected, isAdmin } = useApp();
  const pages = {
    panel: <Panel setPage={setPage}/>,
    community: <Community setPage={setPage}/>,
    school: <SchoolPage setPage={setPage}/>,
    chat: <Chat setPage={setPage}/>,
    notifications: <Notifications setPage={setPage}/>,
    transfer: <Transfer/>,
    benefits: <Benefits/>,
    businesses: <Businesses/>,
    marketplace: <Marketplace/>,
    business: <BusinessSuite/>,
    campus: <Campus/>,
    ride: <Ride/>,
    ai: <AiAssistant setPage={setPage}/>,
    admin: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <Admin/>,
    settings: <Account/>,
    blueprint: <Blueprint/>
  };

  return <Shell page={page} setPage={setPage}>{pages[page] || pages.panel}</Shell>;
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AppProvider><App/></AppProvider>
  </ErrorBoundary>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Service worker no registrado', error)));
}
