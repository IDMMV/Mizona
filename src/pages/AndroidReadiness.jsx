import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Camera, CheckCircle2, Cloud, Download, FileUp, MapPin,
  Mic, RefreshCw, Share2, ShieldCheck, Smartphone, Wifi, WifiOff, XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { canUseSecureDeviceApis, getRuntimeKind, isAndroidLike, isCapacitorRuntime, isStandalone, shareContent, vibrate } from '../lib/platform';
import { getCloudSyncStatus, syncLocalQueue } from '../lib/cloudSync';

const stateLabel = value => value === true ? 'Disponible' : value === false ? 'No disponible' : 'Por verificar';

function Capability({ icon: Icon, title, description, value, action, actionLabel }) {
  const ok = value === true;
  return <article className={`androidCapability ${ok ? 'ok' : value === false ? 'fail' : 'pending'}`}>
    <span className="androidCapabilityIcon"><Icon size={22}/></span>
    <div><b>{title}</b><p>{description}</p><small>{stateLabel(value)}</small></div>
    {action && <button type="button" onClick={action}>{actionLabel || 'Probar'}</button>}
    {!action && (ok ? <CheckCircle2 size={21}/> : <XCircle size={21}/>)}
  </article>;
}

export default function AndroidReadiness() {
  const { backendConnected, online, dataMode, syncQueueCount } = useApp();
  const [permissionState, setPermissionState] = useState({ camera: null, microphone: null, geolocation: null });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notice, setNotice] = useState('');
  const [syncStatus, setSyncStatus] = useState(getCloudSyncStatus);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handler = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const runtime = getRuntimeKind();
  const secure = canUseSecureDeviceApis();
  const capabilities = useMemo(() => ({
    secure,
    geolocation: Boolean(navigator.geolocation),
    camera: Boolean(navigator.mediaDevices?.getUserMedia),
    microphone: Boolean(navigator.mediaDevices?.getUserMedia),
    files: Boolean(window.File && window.FileReader && window.Blob),
    share: Boolean(navigator.share),
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pwa: isStandalone(),
    android: isAndroidLike(),
    capacitor: isCapacitorRuntime()
  }), [secure]);

  const askMedia = async kind => {
    setNotice('');
    if (!secure) return setNotice('Cámara y micrófono requieren HTTPS o ejecución nativa.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'camera' ? { video: true } : { audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState(prev => ({ ...prev, [kind]: true }));
      vibrate(40);
      setNotice(`${kind === 'camera' ? 'Cámara' : 'Micrófono'} autorizado correctamente.`);
    } catch (error) {
      setPermissionState(prev => ({ ...prev, [kind]: false }));
      setNotice(error?.name === 'NotAllowedError' ? 'Permiso rechazado por el usuario.' : (error?.message || 'No se pudo abrir el dispositivo.'));
    }
  };

  const askLocation = () => {
    setNotice('');
    if (!secure) return setNotice('La ubicación requiere HTTPS o ejecución nativa.');
    if (!navigator.geolocation) return setNotice('Este dispositivo no ofrece geolocalización.');
    navigator.geolocation.getCurrentPosition(
      position => {
        setPermissionState(prev => ({ ...prev, geolocation: true }));
        setNotice(`Ubicación recibida con precisión aproximada de ${Math.round(position.coords.accuracy || 0)} m.`);
        vibrate(40);
      },
      error => {
        setPermissionState(prev => ({ ...prev, geolocation: false }));
        setNotice(error.code === 1 ? 'Permiso de ubicación rechazado.' : 'No se pudo obtener la ubicación.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const installPwa = async () => {
    if (!installPrompt) return setNotice('La instalación no está disponible todavía. Abre MiZona desde Chrome y revisa “Instalar aplicación”.');
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setNotice(result.outcome === 'accepted' ? 'Instalación aceptada.' : 'Instalación cancelada.');
    setInstallPrompt(null);
  };

  const runCloudSync = async () => {
    setSyncing(true);
    setNotice('');
    const result = await syncLocalQueue();
    setSyncStatus(getCloudSyncStatus());
    setSyncing(false);
    if (result.ok) setNotice(result.uploaded ? `${result.uploaded} acciones sincronizadas con Supabase.` : 'No hay acciones pendientes por sincronizar.');
    else if (result.reason === 'backend_not_configured') setNotice('Configura Supabase y ejecuta la migración 30.70 antes de sincronizar.');
    else if (result.reason === 'offline') setNotice('No hay conexión. Las acciones seguirán en cola.');
    else setNotice(result.error || 'No se pudo completar la sincronización.');
  };

  const testShare = async () => {
    try {
      const result = await shareContent({ title: 'MiZona', text: 'Prueba de compartir desde MiZona', url: location.origin });
      setNotice(result.shared ? 'Menú de compartir abierto correctamente.' : result.fallback ? 'Contenido copiado al portapapeles.' : 'El dispositivo no permite compartir desde el navegador.');
    } catch (error) {
      setNotice(error?.name === 'AbortError' ? 'Compartir cancelado.' : (error?.message || 'No se pudo compartir.'));
    }
  };

  const scoreItems = [secure, online, backendConnected, capabilities.geolocation, capabilities.camera, capabilities.microphone, capabilities.files, capabilities.serviceWorker];
  const score = Math.round(scoreItems.filter(Boolean).length / scoreItems.length * 100);

  return <div className="androidReadinessPage">
    <section className="androidHero">
      <div>
        <span>ETAPA DE PREPARACIÓN MÓVIL</span>
        <h1>Centro Android y APK</h1>
        <p>Comprueba desde un teléfono qué funciones de MiZona están listas para funcionar como PWA y cuáles necesitarán integración nativa mediante Capacitor.</p>
        <div className="androidHeroActions">
          <button type="button" onClick={() => location.reload()}><RefreshCw size={17}/> Volver a comprobar</button>
          <button type="button" className="secondary" onClick={installPwa}><Download size={17}/> Instalar como PWA</button>
          <button type="button" className="secondary" disabled={syncing} onClick={runCloudSync}><Cloud size={17}/> {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}</button>
        </div>
      </div>
      <div className="androidScore">
        <Smartphone size={34}/><b>{score}%</b><span>Preparación detectada</span>
        <small>{runtime === 'android-native' ? 'Capacitor nativo' : runtime === 'pwa' ? 'PWA instalada' : 'Navegador web'}</small>
      </div>
    </section>

    {notice && <div className="androidNotice"><AlertTriangle size={18}/><span>{notice}</span><button onClick={() => setNotice('')}><XCircle size={17}/></button></div>}

    <section className="androidSummaryGrid">
      <article><span>{online ? <Wifi/> : <WifiOff/>}</span><div><b>{online ? 'Con conexión' : 'Sin conexión'}</b><small>{syncQueueCount} acciones pendientes</small></div></article>
      <article><span><Cloud/></span><div><b>{backendConnected ? 'Supabase activo' : 'Backend no conectado'}</b><small>{syncStatus.pending} pendientes · {syncStatus.synced} sincronizadas</small></div></article>
      <article><span><ShieldCheck/></span><div><b>{secure ? 'Contexto seguro' : 'Falta HTTPS'}</b><small>{secure ? 'Permisos habilitables' : 'GPS, cámara y audio limitados'}</small></div></article>
      <article><span><Smartphone/></span><div><b>{isAndroidLike() ? 'Android detectado' : 'Otro dispositivo'}</b><small>{isStandalone() ? 'PWA instalada' : 'No instalada'}</small></div></article>
    </section>

    <section className="androidSection">
      <div className="androidSectionHead"><div><span>PRUEBAS DEL DISPOSITIVO</span><h2>Permisos y capacidades</h2></div><p>Los permisos solo se solicitan al presionar cada prueba.</p></div>
      <div className="androidCapabilityGrid">
        <Capability icon={MapPin} title="Ubicación" description="GPS, ubicación actual y futura ubicación en vivo." value={permissionState.geolocation ?? capabilities.geolocation} action={askLocation} actionLabel="Probar GPS"/>
        <Capability icon={Camera} title="Cámara" description="Tomar fotografías y adjuntar imágenes desde el teléfono." value={permissionState.camera ?? capabilities.camera} action={() => askMedia('camera')} actionLabel="Probar cámara"/>
        <Capability icon={Mic} title="Micrófono" description="Grabar notas de voz y audios dentro del chat." value={permissionState.microphone ?? capabilities.microphone} action={() => askMedia('microphone')} actionLabel="Probar audio"/>
        <Capability icon={FileUp} title="Archivos" description="Seleccionar documentos, fotos, videos y comprobantes." value={capabilities.files}/>
        <Capability icon={Share2} title="Compartir" description="Enviar contenido a WhatsApp y otras aplicaciones." value={capabilities.share} action={testShare} actionLabel="Probar compartir"/>
        <Capability icon={ShieldCheck} title="HTTPS" description="Requisito para permisos sensibles en la versión web." value={secure}/>
      </div>
    </section>

    <section className="androidSection androidRoadmap">
      <div className="androidSectionHead"><div><span>AUDITORÍA FUNCIONAL</span><h2>Estado para el futuro APK</h2></div></div>
      <div className="androidRoadmapGrid">
        <article className="done"><CheckCircle2/><div><b>Web responsive y PWA</b><p>Navegación interna, áreas seguras, modo sin conexión y controles táctiles.</p></div></article>
        <article className="done"><CheckCircle2/><div><b>Chat y permisos bajo demanda</b><p>Ubicación, audio, archivos y compartir se activan solamente cuando el usuario los solicita.</p></div></article>
        <article className={syncStatus.configured ? 'done' : ''}>{syncStatus.configured ? <CheckCircle2/> : <AlertTriangle/>}<div><b>Cola híbrida local + Supabase</b><p>{syncStatus.configured ? 'Las acciones de Marketplace, Business, Ride, pagos y otros módulos pueden sincronizarse por lotes.' : 'Ejecuta la migración SQL 30.70 y configura las variables de Supabase.'}</p></div></article>
        <article><AlertTriangle/><div><b>Plugins nativos</b><p>Agregar Capacitor para cámara, archivos, GPS, notificaciones y botón Atrás cuando la web quede cerrada.</p></div></article>
        <article><AlertTriangle/><div><b>Privacidad y Play Store</b><p>Eliminación de cuenta, política de privacidad, seguridad de datos y acceso de revisión.</p></div></article>
        <article><AlertTriangle/><div><b>APK de prueba</b><p>Generar e instalar el primer paquete Android antes de preparar el AAB público.</p></div></article>
      </div>
    </section>
  </div>;
}
