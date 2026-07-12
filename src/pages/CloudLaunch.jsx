import { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, Database, RefreshCw, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';
import Card from '../components/Card';
import { runCloudHealthCheck } from '../lib/cloudBackend';
import { useApp } from '../context/AppContext';

export default function CloudLaunch({ setPage }) {
  const { backendConfigured, backendConnected, dataMode, setDataMode, user, profile, refreshProfile, refreshModules } = useApp();
  const [checks, setChecks] = useState([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try { setChecks(await runCloudHealthCheck()); } finally { setBusy(false); }
  };

  useEffect(() => { run(); }, []);

  const errors = checks.filter(item => !item.ok && item.severity !== 'warning').length;
  return <div className="pageStack">
    <div className="hero compactHero">
      <div><span className="eyebrow"><Cloud size={16}/> Etapa 29</span><h1>Supabase y usuarios reales</h1><p>Activa la nube, inicia sesión y verifica que las tablas creadas estén listas para recibir usuarios reales.</p></div>
      <div className={`heroStatus ${backendConnected ? 'success' : 'warning'}`}><b>{backendConnected ? 'Nube activa' : 'Modo local'}</b><span>{backendConfigured ? 'Supabase configurado' : 'Faltan variables'}</span></div>
    </div>

    <div className="grid3">
      <Card title="Configuración" icon={<Database size={18}/>}><p><b>Variables:</b> {backendConfigured ? 'detectadas' : 'pendientes'}</p><p><b>Modo:</b> {dataMode}</p><button className="primary" onClick={() => setDataMode('cloud')} disabled={!backendConfigured}>Activar nube</button></Card>
      <Card title="Sesión" icon={<UserRound size={18}/>}><p><b>Usuario:</b> {user?.email || profile.username || 'Sin sesión'}</p><p><b>Rol:</b> {profile.role}</p><button onClick={() => setPage('settings')}>Abrir acceso</button></Card>
      <Card title="Actualización" icon={<RefreshCw size={18}/>}><p>Recarga el perfil y los módulos desde Supabase después de iniciar sesión.</p><button onClick={async () => { await refreshProfile(); await refreshModules(); await run(); }}>Actualizar nube</button></Card>
    </div>

    <Card title="Diagnóstico de conexión" icon={<ShieldCheck size={18}/>} actions={<button onClick={run} disabled={busy}><RefreshCw size={16}/>{busy ? 'Revisando...' : 'Revisar otra vez'}</button>}>
      <div className="healthGrid">{checks.map(item => <div key={item.id} className={`healthItem ${item.ok ? 'ok' : item.severity}`}>
        {item.ok ? <CheckCircle2 size={20}/> : <TriangleAlert size={20}/>}<div><b>{item.label}</b><span>{item.detail}</span></div>
      </div>)}</div>
      {checks.length > 0 && <div className={`resultBanner ${errors ? 'danger' : 'success'}`}>{errors ? `${errors} comprobaciones requieren atención.` : 'La base principal está preparada para comenzar las pruebas con usuarios reales.'}</div>}
    </Card>

    <Card title="Orden de prueba recomendado" icon="🧭"><ol className="numberedList"><li>Activa el modo nube.</li><li>Crea una cuenta adulta con correo real.</li><li>Confirma el correo desde tu bandeja de entrada.</li><li>Inicia sesión y revisa el perfil.</li><li>En otra ventana crea una segunda cuenta para probar comunicación real.</li><li>No migres todavía pagos ni documentos sensibles hasta validar permisos.</li></ol></Card>
  </div>;
}
