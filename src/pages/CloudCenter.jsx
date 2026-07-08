import { useEffect, useMemo, useState } from 'react';
import { BellRing, Cloud, Database, Download, FileUp, CloudUpload, Lock, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import { downloadCloudReport, expireFile, getCloudSummary, getCloudState, registerLocalFile, requestBrowserPermission, simulateSend, subscribeCloud, toggleTemplate, updateCloudSettings, upsertBucket } from '../lib/localCloud';

const fmtBytes = value => {
  const n = Number(value || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};
const statusLabel = { clean: 'Limpio', quarantined: 'Cuarentena', too_large: 'Muy grande', ready_for_cloud: 'Listo nube', local_only: 'Local', blocked: 'Bloqueado', expired: 'Vencido', queued_local: 'Cola local', planned: 'Planeado', simulated: 'Simulado' };

export default function CloudCenter() {
  const { localProfiles, online, syncQueueCount } = useApp();
  const [cloud, setCloud] = useState(getCloudState);
  const [tab, setTab] = useState('dashboard');
  const [msg, setMsg] = useState('');
  const [upload, setUpload] = useState({ module: 'Transfer', retentionDays: 7, sharedWith: [] });
  const [selectedTemplate, setSelectedTemplate] = useState('tpl-chat');
  const [channel, setChannel] = useState('browser');

  useEffect(() => subscribeCloud(setCloud), []);

  const summary = useMemo(() => getCloudSummary(), [cloud, syncQueueCount]);
  const settings = cloud.settings || {};
  const adultProfiles = localProfiles.filter(item => item.accountType !== 'student');
  const studentProfiles = localProfiles.filter(item => item.accountType === 'student');

  const saveSettings = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateCloudSettings({
      pushEnabled: form.get('pushEnabled') === 'on',
      allowStudentPush: form.get('allowStudentPush') === 'on',
      allowMarketingPush: form.get('allowMarketingPush') === 'on',
      digestFrequency: form.get('digestFrequency'),
      emailFallback: form.get('emailFallback') === 'on',
      whatsappFallback: form.get('whatsappFallback') === 'on',
      smsFallback: form.get('smsFallback') === 'on',
      requireFileScan: form.get('requireFileScan') === 'on',
      defaultRetentionDays: Number(form.get('defaultRetentionDays') || 7),
      maxFileMb: Number(form.get('maxFileMb') || 25),
      quarantineDangerousFiles: form.get('quarantineDangerousFiles') === 'on',
      storageProvider: form.get('storageProvider'),
      pushProvider: form.get('pushProvider')
    });
    setMsg('Reglas de notificación y archivos guardadas.');
  };

  const fileSelected = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const record = await registerLocalFile(file, upload);
      setMsg(`Archivo registrado: ${record.name} · ${record.scanStatus}.`);
      setTab('files');
    } catch (error) {
      setMsg(error.message || 'No se pudo registrar el archivo.');
    } finally {
      event.target.value = '';
    }
  };

  const sendTest = () => {
    const recipients = [...adultProfiles.slice(0,2), ...studentProfiles.slice(0, settings.allowStudentPush ? 1 : 0)].map(item => item.id);
    const sent = simulateSend({ templateId: selectedTemplate, userIds: recipients, channel });
    setMsg(`Notificación simulada enviada a ${sent.recipients.length} perfil(es).`);
  };

  const askPermission = async () => {
    const permission = await requestBrowserPermission();
    if (permission === 'granted') setMsg('Permiso de notificaciones concedido. Push interno activado.');
    else if (permission === 'denied') setMsg('El navegador tiene las notificaciones bloqueadas. Actívalas desde el candado de la barra de dirección y vuelve a probar.');
    else setMsg(`Permiso del navegador: ${permission}.`);
  };

  return <div className="page cloudPage">
    <div className="hero compact">
      <div><span className="eyebrow">Etapa 25</span><h1>Notificaciones y archivos en nube</h1><p>Centro para preparar push real, correos, archivos, vencimientos, escaneo y almacenamiento futuro.</p></div>
      <div className="heroIcon"><CloudUpload/></div>
    </div>

    <div className="paymentWarning">
      <Lock/><div><b>Preparado para nube, sin mover datos reales todavía</b><span>Esta versión registra archivos y avisos localmente. La subida real requiere backend, storage y proveedor push.</span></div>
    </div>

    <Tabs value={tab} onChange={setTab} items={[{id:'dashboard',label:'Estado'},{id:'push',label:'Push y avisos'},{id:'files',label:'Archivos'},{id:'storage',label:'Buckets'},{id:'settings',label:'Reglas'}]}/>
    {msg && <p className="accountMessage">{msg}</p>}

    {tab === 'dashboard' && <>
      <div className="paymentKpis">
        <span><b>{summary.notifications}</b>Notificaciones</span>
        <span><b>{summary.files}</b>Archivos</span>
        <span><b>{summary.queuedUploads}</b>En cola</span>
        <span><b>{fmtBytes(summary.bytes)}</b>Uso local</span>
      </div>
      <div className="grid2">
        <Card title="Estado de canales" icon={<BellRing/>}>
          <div className="syncStatus">
            <span><b>Internet</b>{online ? 'Conectado' : 'Sin conexión'}</span>
            <span><b>Permiso navegador</b>{settings.browserPermission || 'desconocido'}</span>
            <span><b>Push interno</b>{settings.pushEnabled ? 'Activo' : 'Apagado'}</span>
            <span><b>Digest</b>{settings.digestFrequency}</span>
          </div>
          <div className="payActions"><button onClick={askPermission}>Pedir permiso del navegador</button><button onClick={sendTest}>Enviar prueba local</button></div>
          <p className="muted">Las pruebas crean avisos en MiZona y, si el navegador permite, muestran una notificación local.</p>
        </Card>
        <Card title="Estado de archivos" icon={<FileUp/>}>
          <div className="syncStatus">
            <span><b>Listos para nube</b>{summary.readyFiles}</span>
            <span><b>Bloqueados</b>{summary.blockedFiles}</span>
            <span><b>Retención base</b>{settings.defaultRetentionDays} días</span>
            <span><b>Escaneo</b>{settings.requireFileScan ? 'Requerido' : 'Opcional'}</span>
          </div>
          <div className="payActions"><button onClick={()=>setTab('files')}>Subir archivo local</button><button onClick={downloadCloudReport}><Download size={16}/> Reporte JSON</button></div>
        </Card>
      </div>
      <Card title="Checklist antes de nube real" icon={<ShieldCheck/>}>
        <div className="syncPlanGrid">
          <article><b>Backend</b><span>API segura para archivos y push</span><em className="payStatus pending">pendiente</em></article>
          <article><b>Storage</b><span>Bucket privado, reglas y vencimiento</span><em className="payStatus pending">pendiente</em></article>
          <article><b>Push</b><span>VAPID, service worker y tokens</span><em className="payStatus pending">pendiente</em></article>
          <article><b>Correos</b><span>Plantillas y proveedor transaccional</span><em className="payStatus pending">pendiente</em></article>
          <article><b>Menores</b><span>Reglas especiales para estudiantes</span><em className="payStatus ok">configurado</em></article>
          <article><b>Retención</b><span>Archivos temporales y eliminación</span><em className="payStatus ok">simulado</em></article>
        </div>
      </Card>
    </>}

    {tab === 'push' && <>
      <Card title="Permiso del navegador" icon={<BellRing/>}>
        <div className="pushPermissionHero">
          <div>
            <b>Estado: {settings.browserPermission || 'default'}</b>
            <span>Presiona este botón para que Chrome muestre la ventana de permiso de notificaciones.</span>
          </div>
          <button type="button" className="pushPermissionMainButton" onClick={askPermission}>🔔 Solicitar permiso</button>
        </div>
      </Card>
      <div className="grid2">
        <Card title="Enviar notificación de prueba" icon={<BellRing/>}>
          <div className="pushPermissionBox">
            <div><b>Permiso del navegador</b><span>{settings.browserPermission || 'default'}</span></div>
            <button type="button" onClick={askPermission}>Solicitar permiso</button>
          </div>
          <div className="paymentForm">
            <label>Plantilla<select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>{cloud.templates.map(t => <option key={t.id} value={t.id}>{t.title} · {t.type}</option>)}</select></label>
            <label>Canal<select value={channel} onChange={e => setChannel(e.target.value)}><option value="browser">Navegador</option><option value="email_future">Correo futuro</option><option value="whatsapp_future">WhatsApp futuro</option><option value="sms_future">SMS futuro</option></select></label>
            <button type="button" onClick={sendTest}>Enviar prueba local</button>
          </div>
          <p className="muted">Primero presiona Solicitar permiso. Luego usa Enviar prueba local para revisar si aparece el aviso.</p>
        </Card>
        <Card title="Segmentos protegidos" icon="👥">
          <ul className="list"><li><b>{adultProfiles.length}</b> adultos o administradores.</li><li><b>{studentProfiles.length}</b> estudiantes protegidos.</li><li>Marketing para estudiantes: <b>bloqueado</b>.</li><li>Push estudiantil: <b>{settings.allowStudentPush ? 'solo avisos necesarios' : 'apagado'}</b>.</li></ul>
        </Card>
      </div>
      <Card title="Plantillas de avisos" icon="🧩"><div className="paymentTable compactTable">{cloud.templates.map(t => <article key={t.id}><div><b>{t.title}</b><span>{t.body} · {t.audience}</span></div><em className={`payStatus ${t.enabled ? 'ok':'blocked'}`}>{t.enabled ? 'activa':'apagada'}</em><div className="payActions"><button onClick={() => toggleTemplate(t.id)}>{t.enabled ? 'Apagar' : 'Activar'}</button></div></article>)}</div></Card>
      <Card title="Historial de envíos simulados" icon="📨"><div className="paymentTable compactTable">{cloud.sends.length ? cloud.sends.map(s => <article key={s.id}><div><b>{s.title}</b><span>{s.channel} · {s.recipients.length} receptor(es) · {new Date(s.createdAt).toLocaleString('es-PE')}</span></div><em className="payStatus ok">{statusLabel[s.status] || s.status}</em></article>) : <p className="muted">Aún no hay envíos.</p>}</div></Card>
    </>}

    {tab === 'files' && <>
      <div className="grid2">
        <Card title="Registrar archivo local" icon={<FileUp/>}>
          <div className="paymentForm">
            <label>Módulo<select value={upload.module} onChange={e => setUpload({...upload, module:e.target.value})}><option>Transfer</option><option>Chat</option><option>Comités</option><option>CampusHugo</option><option>Business</option><option>Verificación</option><option>Marketplace</option></select></label>
            <label>Retención<select value={upload.retentionDays} onChange={e => setUpload({...upload, retentionDays:Number(e.target.value)})}><option value="7">7 días</option><option value="30">30 días</option><option value="180">180 días</option><option value="365">365 días</option></select></label>
            <label className="fileButton">Seleccionar archivo<input type="file" onChange={fileSelected}/></label>
          </div>
          <p className="muted">No se sube a Internet. Se registra el nombre, tamaño, tipo, vencimiento y estado de revisión.</p>
        </Card>
        <Card title="Reglas de seguridad" icon={<ShieldCheck/>}>
          <ul className="list"><li>Bloqueo de ejecutables y scripts peligrosos.</li><li>Vencimiento automático según módulo.</li><li>Documentos de verificación con mayor retención.</li><li>Archivos de chat preparados para 7 días.</li><li>La nube real necesitará escaneo antivirus del servidor.</li></ul>
        </Card>
      </div>
      <Card title="Archivos preparados" icon={<CloudUpload/>}><div className="paymentTable compactTable">{cloud.files.map(f => <article key={f.id}><div><b>{f.name}</b><span>{f.module} · {fmtBytes(f.sizeBytes)} · vence {new Date(f.expiresAt).toLocaleDateString('es-PE')}</span></div><em className={`payStatus ${f.scanStatus === 'clean' ? 'ok' : 'blocked'}`}>{statusLabel[f.scanStatus] || f.scanStatus}</em><em className={`payStatus ${f.cloudStatus === 'ready_for_cloud' ? 'pending':'blocked'}`}>{statusLabel[f.cloudStatus] || f.cloudStatus}</em><div className="payActions"><button onClick={() => expireFile(f.id)}><Trash2 size={15}/> Vencer</button></div></article>)}</div></Card>
      <Card title="Cola de subida futura" icon={<Cloud/>}><div className="paymentTable compactTable">{cloud.uploadQueue.length ? cloud.uploadQueue.map(q => <article key={q.id}><div><b>{q.name}</b><span>{q.fileId} · {new Date(q.createdAt).toLocaleString('es-PE')}</span></div><em className={`payStatus ${q.status === 'queued_local' ? 'pending':'blocked'}`}>{statusLabel[q.status] || q.status}</em></article>) : <p className="muted">No hay archivos en cola.</p>}</div></Card>
    </>}

    {tab === 'storage' && <Card title="Buckets y políticas futuras" icon={<Database/>}>
      <div className="paymentTable compactTable">{cloud.buckets.map(bucket => <article key={bucket.id}><div><b>{bucket.name}</b><span>{bucket.module} · {bucket.public ? 'público controlado' : 'privado'} · {bucket.encrypted ? 'cifrado requerido' : 'sin cifrado'}</span></div><label>Retención<input type="number" min="1" value={bucket.retentionDays} onChange={e => upsertBucket(bucket.id, { retentionDays: Number(e.target.value) })}/></label><em className="payStatus pending">{statusLabel[bucket.status] || bucket.status}</em></article>)}</div>
    </Card>}

    {tab === 'settings' && <Card title="Reglas generales" icon="⚙️"><form className="paymentForm" onSubmit={saveSettings}>
      <label>Proveedor push futuro<input name="pushProvider" defaultValue={settings.pushProvider}/></label>
      <label>Proveedor storage futuro<input name="storageProvider" defaultValue={settings.storageProvider}/></label>
      <label>Digest<select name="digestFrequency" defaultValue={settings.digestFrequency}><option value="instant">Instantáneo</option><option value="daily">Diario</option><option value="weekly">Semanal</option></select></label>
      <label>Retención base<input name="defaultRetentionDays" type="number" min="1" defaultValue={settings.defaultRetentionDays}/></label>
      <label>Tamaño máximo local MB<input name="maxFileMb" type="number" min="1" defaultValue={settings.maxFileMb}/></label>
      <label className="checkLabel"><input name="pushEnabled" type="checkbox" defaultChecked={settings.pushEnabled}/> Activar push cuando el navegador lo permita</label>
      <label className="checkLabel"><input name="allowStudentPush" type="checkbox" defaultChecked={settings.allowStudentPush}/> Permitir avisos necesarios a estudiantes</label>
      <label className="checkLabel"><input name="allowMarketingPush" type="checkbox" defaultChecked={settings.allowMarketingPush}/> Permitir avisos comerciales</label>
      <label className="checkLabel"><input name="emailFallback" type="checkbox" defaultChecked={settings.emailFallback}/> Usar correo como respaldo futuro</label>
      <label className="checkLabel"><input name="whatsappFallback" type="checkbox" defaultChecked={settings.whatsappFallback}/> Preparar WhatsApp futuro</label>
      <label className="checkLabel"><input name="smsFallback" type="checkbox" defaultChecked={settings.smsFallback}/> Preparar SMS futuro</label>
      <label className="checkLabel"><input name="requireFileScan" type="checkbox" defaultChecked={settings.requireFileScan}/> Exigir escaneo antes de publicar archivo</label>
      <label className="checkLabel"><input name="quarantineDangerousFiles" type="checkbox" defaultChecked={settings.quarantineDangerousFiles}/> Enviar archivos peligrosos a cuarentena</label>
      <button>Guardar reglas</button>
    </form></Card>}
  </div>;
}
