import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { getRuntimeKind } from '../lib/platform';

export default function MobileRuntime() {
  const [online, setOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.documentElement.dataset.runtime = getRuntimeKind();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online || dismissed) return null;

  return (
    <div className="mzOfflineBanner" role="status" aria-live="polite">
      <WifiOff size={18}/>
      <span><b>Sin conexión</b><small>MiZona conservará la pantalla actual y volverá a sincronizar cuando recuperes Internet.</small></span>
      <button type="button" aria-label="Cerrar aviso" onClick={() => setDismissed(true)}><X size={17}/></button>
    </div>
  );
}
