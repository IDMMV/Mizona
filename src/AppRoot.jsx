import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import './styles/theme-dark-mockup.css';
import './styles/unified-design-3052.css';
import './styles/design-system-3054.css';
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
import AndroidReadiness from './pages/AndroidReadiness';
import ReleaseQA from './pages/ReleaseQA';
import { canAccessModule } from './lib/permissions';
import MobileRuntime from './components/MobileRuntime';
import AnimatedPage from './components/AnimatedPage';

export default function AppRoot() {
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
    android: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <AndroidReadiness/>,
    releaseQA: backendConnected && !isAdmin ? <AccessDenied setPage={setPage}/> : <ReleaseQA/>,
    settings: <Account/>,
    blueprint: <Blueprint/>
  };

  if (dataMode === 'cloud' && !authLoading && !isAuthenticated) return <CloudAuthGate/>;
  const denied = !canAccessModule(profile, page);
  return <><MobileRuntime/><Shell page={denied ? 'panel' : page} setPage={setPage}><AnimatedPage pageKey={denied ? 'access-denied' : page}>{denied ? <AccessDenied setPage={setPage}/> : (pages[page] || pages.panel)}</AnimatedPage></Shell></>;
}
