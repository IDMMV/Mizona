import { useEffect, useMemo, useState } from 'react';
import { CloudUpload, Database, Download, RefreshCcw, ShieldCheck, Smartphone, Users, WifiOff } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import { addPendingDevice, buildMigrationPreview, createMigrationRun, downloadMigrationPreview, exportLocalBackup, getSyncState, importLocalBackup, markCloudPlan, runReadinessChecks, subscribeSync, trustDevice, updateSyncSettings } from '../lib/localSync';

const statusText = { ok: 'Correcto', warning: 'Advertencia', fail: 'Falla', pending: 'Pendiente', done: 'Listo', blocked_until_legal: 'Bloqueado legal', ready_for_manual_execution: 'Listo para ejecutar', blocked_no_backend: 'Sin backend' };
const planLabels = { profiles: 'Perfiles y roles', modules: 'Módulos', community: 'Comunidad y comités', chat: 'Chat y grupos', files: 'Archivos', payments: 'Pagos', verification: 'Verificación' };

export default function SyncCenter() {
  const { backendConfigured, backendConnected, dataMode, setDataMode, online, syncQueueCount } = useApp();
  const [state, setState] = useState(getSyncState);
  const [tab, setTab] = useState('dashboard');
  const [preview, setPreview] = useState(buildMigrationPreview);
  const [msg, setMsg] = useState('');
  const [device, setDevice] = useState({ name: 'Nuevo celular', type: 'Android' });

  useEffect(() => subscribeSync(setState), []);
  useEffect(() => setPreview(buildMigrationPreview()), [state, syncQueueCount]);

  const progress = useMemo(() => {
    const values = Object.values(state.cloudPlan || {});
    const done = values.filter(v => v === 'done').length;
    return Math.round((done / Math.max(1, values.length)) * 100);
  }, [state.cloudPlan]);

  const saveSettings = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateSyncSettings({
      targetBackend: form.get('targetBackend'),
      allowCloudLogin: form.get('allowCloudLogin') === 'on',
      allowUsernameLogin: form.get('allowUsernameLogin') === 'on',
      requireEmailVerification: form.get('requireEmailVerification') === 'on',
      requirePhoneVerification: form.get('requirePhoneVerification') === 'on',
      migrationMode: form.get('migrationMode'),
      conflictPolicy: form.get('conflictPolicy'),
      keepLocalBackupBeforeSync: form.get('keepLocalBackupBeforeSync') === 'on',
      syncChatRetentionDays: Number(form.get('syncChatRetentionDays') || 7),
      protectMinors: form.get('protectMinors') === 'on',
      adultModulesRequireAdultAccount: form.get('adultModulesRequireAdultAccount') === 'on',
      syncPaymentsOnlyVerified: form.get('syncPaymentsOnlyVerified') === 'on'
    });
    setMsg('Configuración de sincronización guardada.');
  };

  const createRun = () => {
    const run = createMigrationRun();
    setMsg(run.status === 'blocked_no_backend' ? 'Plan creado, pero todavía no hay backend real configurado.' : 'Plan de migración creado para revisión manual.');
    setTab('migration');
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importLocalBackup(file);
      setPreview(buildMigrationPreview());
      setMsg('Respaldo importado correctamente. Revisa los perfiles antes de sincronizar.');
    } catch (error) {
      setMsg(error.message || 'No se pudo importar el respaldo.');
    } finally {
      event.target.value = '';
    }
  };

  return <div className="page syncPage">
    <div className="hero compact">
      <div><span className="eyebrow">Etapa 24</span><h1>Usuarios reales y sincronización</h1><p>Centro para preparar el paso de la simulación local a cuentas reales, respaldo, dispositivos y backend.</p></div>
      <div className="heroIcon"><CloudUpload/></div>
    </div>

    <div className="paymentWarning">
      <WifiOff/><div><b>Preparación sin mover datos a Internet</b><span>Esta etapa todavía no sube información a un servidor. Organiza usuarios, respaldo y reglas para una migración segura cuando el backend esté estable.</span></div>
    </div>

    <Tabs value={tab} onChange={setTab} items={[{id:'dashboard',label:'Estado'},{id:'users',label:'Usuarios'},{id:'devices',label:'Dispositivos'},{id:'migration',label:'Migración'},{id:'settings',label:'Reglas'}]}/>
    {msg && <p className="accountMessage">{msg}</p>}

    {tab === 'dashboard' && <>
      <div className="paymentKpis">
        <span><b>{preview.summary.profiles}</b>Perfiles locales</span>
        <span><b>{preview.summary.students}</b>Cuentas estudiantiles</span>
        <span><b>{preview.summary.messages}</b>Mensajes</span>
        <span><b>{syncQueueCount}</b>Acciones pendientes</span>
      </div>
      <div className="grid2">
        <Card title="Estado del backend" icon={<Database/>}>
          <div className="syncStatus">
            <span><b>Modo actual</b>{dataMode === 'local' ? 'Local' : 'Nube / contingencia'}</span>
            <span><b>Internet</b>{online ? 'Conectado' : 'Sin conexión'}</span>
            <span><b>Supabase configurado</b>{backendConfigured ? 'Sí' : 'No'}</span>
            <span><b>Backend conectado</b>{backendConnected ? 'Sí' : 'No'}</span>
          </div>
          <div className="payActions"><button onClick={() => setDataMode('local')}>Mantener local</button><button onClick={() => setDataMode('cloud')}>Probar nube</button></div>
          <p className="muted">Al probar nube, si Supabase no responde, MiZona conserva el modo local como respaldo.</p>
        </Card>
        <Card title="Revisión automática" icon={<ShieldCheck/>}>
          <div className="paymentTable compactTable">{(state.testResults || []).length ? state.testResults.map(item => <article key={item.id}><div><b>{item.label}</b><span>{item.detail}</span></div><em className={`payStatus ${item.status}`}>{statusText[item.status] || item.status}</em></article>) : <p className="muted">Ejecuta una revisión para detectar pendientes antes de migrar.</p>}</div>
          <button onClick={() => { runReadinessChecks(); setMsg('Revisión completada.'); }}><RefreshCcw size={16}/> Ejecutar revisión</button>
        </Card>
      </div>
      <Card title="Progreso de preparación" icon="☁️">
        <div className="syncProgress"><div><i style={{width:`${progress}%`}}/></div><b>{progress}%</b></div>
        <div className="syncPlanGrid">{Object.entries(state.cloudPlan || {}).map(([key, value]) => <article key={key}><b>{planLabels[key]}</b><span>{statusText[value] || value}</span><select value={value} onChange={e => markCloudPlan(key, e.target.value)}><option value="pending">Pendiente</option><option value="done">Listo</option><option value="blocked_until_legal">Bloqueado legal</option></select></article>)}</div>
      </Card>
    </>}

    {tab === 'users' && <>
      <div className="grid2">
        <Card title="Resumen de usuarios" icon={<Users/>}>
          <ul className="list"><li><b>{preview.summary.profiles}</b> perfiles activos.</li><li><b>{preview.summary.admins}</b> administradores.</li><li><b>{preview.summary.students}</b> estudiantes protegidos.</li><li><b>{preview.summary.notifications}</b> notificaciones locales.</li></ul>
        </Card>
        <Card title="Reglas para usuarios reales" icon="🔐"><ul className="list"><li>Usuario único obligatorio.</li><li>Correo para recuperación de contraseña.</li><li>Teléfono opcional o requerido según configuración.</li><li>Niños y estudiantes siempre con módulos restringidos.</li><li>Adultos, negocios y administradores separados por rol.</li></ul></Card>
      </div>
      <Card title="Perfiles listos para migración" icon="👥"><div className="paymentTable">{preview.profiles.map(profile => <article key={profile.id}><div><b>@{profile.username} · {profile.displayName}</b><span>{profile.accountType} · {profile.role} · {profile.zone}</span></div><em className="payStatus ok">{profile.status}</em></article>)}</div></Card>
    </>}

    {tab === 'devices' && <div className="grid2">
      <Card title="Dispositivos autorizados" icon={<Smartphone/>}>
        <div className="paymentTable compactTable">{state.devices.map(item => <article key={item.id}><div><b>{item.name}</b><span>{item.type} · {item.id}{item.pairingCode ? ` · código ${item.pairingCode}` : ''}</span></div><em className={`payStatus ${item.status}`}>{item.trusted ? 'confiable' : item.status}</em><div className="payActions"><button onClick={() => trustDevice(item.id, !item.trusted)}>{item.trusted ? 'Quitar confianza' : 'Confiar'}</button></div></article>)}</div>
      </Card>
      <Card title="Agregar dispositivo de prueba" icon="📱"><form className="paymentForm" onSubmit={e => { e.preventDefault(); const next = addPendingDevice(device); setMsg(`Dispositivo creado con código ${next.pairingCode}.`); }}><label>Nombre<input value={device.name} onChange={e => setDevice({...device, name:e.target.value})}/></label><label>Tipo<select value={device.type} onChange={e => setDevice({...device, type:e.target.value})}><option>Android</option><option>iPhone</option><option>PC / Navegador</option><option>Tablet</option></select></label><button>Crear código de vinculación</button></form><p className="muted">El código es local. En producción servirá para autorizar celulares o computadoras nuevas.</p></Card>
    </div>}

    {tab === 'migration' && <>
      <div className="grid2">
        <Card title="Respaldo local" icon={<Download/>}><p>Antes de sincronizar, descarga una copia completa de la información local.</p><div className="payActions"><button onClick={exportLocalBackup}>Descargar respaldo</button><label className="fileButton">Importar respaldo<input type="file" accept="application/json" onChange={importFile}/></label></div></Card>
        <Card title="Plan de migración" icon="🧭"><p>Genera un plan local con conteos, advertencias y pasos recomendados.</p><div className="payActions"><button onClick={createRun}>Crear plan</button><button onClick={downloadMigrationPreview}>Descargar plan JSON</button></div></Card>
      </div>
      <Card title="Advertencias actuales" icon="⚠️">{preview.warnings.length ? <ul className="list">{preview.warnings.map(w => <li key={w}>{w}</li>)}</ul> : <p className="muted">No hay advertencias críticas en la vista previa.</p>}</Card>
      <Card title="Ejecuciones de migración" icon="📦"><div className="paymentTable compactTable">{state.migrationRuns?.length ? state.migrationRuns.map(run => <article key={run.id}><div><b>{run.id}</b><span>{run.createdAt} · perfiles {run.summary.profiles} · mensajes {run.summary.messages}</span></div><em className={`payStatus ${run.status}`}>{statusText[run.status] || run.status}</em></article>) : <p className="muted">Todavía no hay planes creados.</p>}</div></Card>
    </>}

    {tab === 'settings' && <Card title="Reglas de sincronización" icon="⚙️"><form className="paymentForm" onSubmit={saveSettings}>
      <label>Backend objetivo<input name="targetBackend" defaultValue={state.settings.targetBackend}/></label>
      <label>Modo de migración<select name="migrationMode" defaultValue={state.settings.migrationMode}><option value="manual_review">Revisión manual</option><option value="staged">Por etapas</option><option value="full">Completa</option></select></label>
      <label>Conflictos<select name="conflictPolicy" defaultValue={state.settings.conflictPolicy}><option value="keep_newest">Conservar más reciente</option><option value="prefer_cloud">Preferir nube</option><option value="prefer_local">Preferir local</option><option value="manual">Resolver manual</option></select></label>
      <label>Días de retención de chat<input name="syncChatRetentionDays" type="number" min="1" defaultValue={state.settings.syncChatRetentionDays}/></label>
      <label className="checkLabel"><input name="allowCloudLogin" type="checkbox" defaultChecked={state.settings.allowCloudLogin}/> Permitir login real cuando backend esté disponible</label>
      <label className="checkLabel"><input name="allowUsernameLogin" type="checkbox" defaultChecked={state.settings.allowUsernameLogin}/> Permitir ingreso por usuario único</label>
      <label className="checkLabel"><input name="requireEmailVerification" type="checkbox" defaultChecked={state.settings.requireEmailVerification}/> Exigir correo verificado</label>
      <label className="checkLabel"><input name="requirePhoneVerification" type="checkbox" defaultChecked={state.settings.requirePhoneVerification}/> Exigir teléfono verificado</label>
      <label className="checkLabel"><input name="keepLocalBackupBeforeSync" type="checkbox" defaultChecked={state.settings.keepLocalBackupBeforeSync}/> Crear respaldo antes de sincronizar</label>
      <label className="checkLabel"><input name="protectMinors" type="checkbox" defaultChecked={state.settings.protectMinors}/> Mantener protección de menores</label>
      <label className="checkLabel"><input name="adultModulesRequireAdultAccount" type="checkbox" defaultChecked={state.settings.adultModulesRequireAdultAccount}/> Módulos de adultos solo para cuentas adultas</label>
      <label className="checkLabel"><input name="syncPaymentsOnlyVerified" type="checkbox" defaultChecked={state.settings.syncPaymentsOnlyVerified}/> Pagos protegidos solo con vendedor verificado</label>
      <button>Guardar reglas</button>
    </form></Card>}
  </div>;
}
