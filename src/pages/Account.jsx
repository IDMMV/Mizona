import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Cloud, CloudOff, Database, Download, KeyRound, LockKeyhole, LogOut, Mail, Save, ShieldCheck, Upload, UserRound, Wifi } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { friendlyAuthError } from '../lib/supabase';
import { exportLocalBackup, getLocalPreferences, importLocalBackup, resetLocalData, saveLocalPreferences } from '../lib/localStore';
import { useApp } from '../context/AppContext';

export default function Account({ initialTab = 'profile', cloudOnly = false }) {
  const {
    profile, user, isAuthenticated, authLoading, backendConnected, backendConfigured,
    backendMessage, clearBackendMessage, dataMode, setDataMode, online, syncQueueCount,
    signIn, signUp, signOut, resetPassword, updatePassword, saveProfile, refreshLocalIndicators
  } = useApp();

  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notifications, setNotifications] = useState(getLocalPreferences);
  const importInput = useRef(null);

  useEffect(() => {
    const handler = event => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const run = async action => {
    setBusy(true);
    setMessage('');
    try { await action(); } catch (error) { setMessage(friendlyAuthError(error)); } finally { setBusy(false); }
  };

  const submitLogin = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      await signIn({ identifier: form.get('identifier'), password: form.get('password') });
      setMessage('Sesión iniciada correctamente.');
      setTab('profile');
    });
  };

  const submitRegister = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      const result = await signUp({
        displayName: form.get('displayName'), username: form.get('username'), accountType: form.get('accountType'),
        zone: form.get('zone'), email: form.get('email'), password: form.get('password'), termsAccepted: Boolean(form.get('terms'))
      });
      setMessage(result?.local ? 'Perfil local creado en este dispositivo.' : result?.session ? 'Cuenta creada e iniciada.' : 'Cuenta creada. Revisa tu correo para confirmarla.');
    });
  };

  const submitRecovery = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => { await resetPassword(form.get('email')); setMessage('Se envió el enlace de recuperación.'); });
  };

  const submitPassword = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    run(async () => {
      if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
      if (password.length < 8) throw new Error('La contraseña debe tener como mínimo 8 caracteres.');
      await updatePassword(password);
      event.currentTarget.reset();
      setMessage('Contraseña actualizada correctamente.');
    });
  };

  const submitProfile = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      const result = await saveProfile({ displayName: form.get('displayName'), username: form.get('username'), zone: form.get('zone') });
      setMessage(result.persisted ? 'Perfil guardado en Supabase.' : 'Perfil guardado en este dispositivo.');
    });
  };

  const logout = () => run(async () => { await signOut(); setMessage('Sesión cerrada.'); setTab('access'); });

  const install = async () => {
    if (!installPrompt) {
      setMessage('En Chrome abre el menú del navegador y selecciona Instalar MiZona o Agregar a pantalla de inicio.');
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const savePreferences = () => {
    saveLocalPreferences(notifications);
    refreshLocalIndicators();
    setMessage('Preferencias guardadas en este dispositivo.');
  };

  const importBackup = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    run(async () => {
      await importLocalBackup(file);
      refreshLocalIndicators();
      setMessage('Respaldo local importado correctamente.');
    });
  };

  const resetData = () => {
    if (!window.confirm('¿Restablecer los datos locales de este dispositivo? Esta acción reemplaza chats, notificaciones y reportes locales.')) return;
    resetLocalData();
    refreshLocalIndicators();
    setMessage('Datos locales restablecidos.');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'access', label: 'Acceso', icon: '🔐' },
    { id: 'local', label: 'Datos locales', icon: '💾' },
    { id: 'notifications', label: 'Preferencias', icon: '🔔' },
    { id: 'security', label: 'Privacidad', icon: '🛡️' },
    { id: 'install', label: 'Instalar app', icon: '📲' }
  ];

  const initials = String(profile.displayName || 'MZ').split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();

  return <div className="page accountPage">
    <div className="pageTitle">
      <div><h1>Mi Cuenta</h1><p className="muted">Identidad, modo de datos, privacidad y respaldo de MiZona.</p></div>
      <span className={`connectionBadge ${backendConnected ? 'connected' : 'localConnected'}`}>{backendConnected ? 'Supabase conectado' : 'Modo local operativo'}</span>
    </div>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>

    {(message || backendMessage) && <div className="accountMessage"><CheckCircle2 size={18}/>{message || backendMessage}<button onClick={() => { setMessage(''); clearBackendMessage(); }}>×</button></div>}

    <div className="localOperationBanner"><CloudOff size={20}/><div><b>Continuamos sin Supabase · Etapa 14</b><span>MiZona usa almacenamiento local e IndexedDB. Los datos permanecen en este navegador y pueden exportarse como respaldo.</span></div><em>{online ? 'Internet disponible' : 'Sin internet'}</em></div>

    {tab === 'profile' && <div className="grid2">
      <Card title="Identidad MiZona" icon="👤">
        <form className="accountForm" onSubmit={submitProfile} key={`${profile.id || 'local'}-${profile.username}`}>
          <label>Nombre visible<input name="displayName" defaultValue={profile.displayName} required/></label>
          <label>Usuario único<input name="username" defaultValue={profile.username} pattern="[A-Za-z0-9_]{4,20}" required/><small>Se utiliza para encontrarte por coincidencia exacta.</small></label>
          <label>Zona principal<input name="zone" defaultValue={profile.zone}/></label>
          <button className="primary" type="submit" disabled={busy}><Save size={17}/>Guardar en este dispositivo</button>
        </form>
      </Card>
      <Card title="Resumen de perfil local" icon="🪪"><div className="profilePreview"><div>{initials}</div><h2>{profile.displayName}</h2><b>@{profile.username}</b><span>📍 {profile.zone}</span><em>Perfil local · {profile.role}</em>{user?.email && <small>{user.email}</small>}</div></Card>
    </div>}

    {tab === 'access' && <>
      {dataMode === 'local' ? <div className="grid2">
        <Card title="Sesión local activa" icon="✅"><div className="sessionSummary"><b>{profile.displayName}</b><span>@{profile.username}</span><small>Identificador: {profile.id}</small><small>Rol local: {profile.role}</small></div><p className="muted">El laboratorio local no guarda contraseñas ni reemplaza la autenticación real. Usa perfiles de prueba independientes por pestaña.</p></Card>
        <Card title="Conexión futura" icon="☁️"><p className="muted">Cuando Supabase vuelva a estar estable podremos cambiar a modo nube y verificar las Etapas 10, 11 y 12.</p><button className="ghost" disabled={!backendConfigured} onClick={() => { setDataMode('cloud'); setMessage(backendConfigured ? 'Modo nube solicitado. Recarga la página para verificar la sesión.' : 'Las variables de Supabase no están configuradas.'); }}><Cloud size={17}/>Intentar modo nube después</button>{!backendConfigured && <small className="muted">VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas.</small>}</Card>
      </div> : <>
        {authLoading && <Card title="Verificando sesión" icon="⏳"><p className="muted">Comprobando tu acceso...</p></Card>}
        {!authLoading && isAuthenticated && <div className="grid2"><Card title="Sesión de nube activa" icon="✅"><div className="sessionSummary"><b>{profile.displayName}</b><span>@{profile.username}</span><small>{user?.email}</small><small>Rol: {profile.role}</small></div><button className="dangerButton" disabled={busy} onClick={logout}><LogOut size={17}/>Cerrar sesión</button></Card><Card title="Cambiar contraseña" icon="🔑"><form className="accountForm" onSubmit={submitPassword}><label>Nueva contraseña<input name="password" type="password" minLength="8" required/></label><label>Repetir contraseña<input name="confirmation" type="password" minLength="8" required/></label><button className="primary" disabled={busy}><KeyRound size={17}/>Actualizar contraseña</button></form></Card></div>}
        {!authLoading && !isAuthenticated && <div className="accountAuthGrid"><Card title="Iniciar sesión" icon="🔐"><form className="accountForm" onSubmit={submitLogin}><label>Usuario o correo<input name="identifier" autoComplete="username" required/></label><label>Contraseña<input name="password" type="password" minLength="6" required/></label><button className="primary" disabled={busy || !backendConnected}><KeyRound size={17}/>Ingresar</button></form></Card><Card title="Crear cuenta" icon="✨"><form className="accountForm" onSubmit={submitRegister}><label>Nombre visible<input name="displayName" required/></label><label>Usuario único<input name="username" pattern="[A-Za-z0-9_]{4,20}" required/></label><label>Tipo de cuenta<select name="accountType"><option value="adult">Adulto</option><option value="student">Estudiante</option><option value="business">Negocio</option><option value="organization">Organización</option></select></label><label>Zona principal<input name="zone"/></label><label>Correo<input name="email" type="email" required/></label><label>Contraseña<input name="password" type="password" minLength="8" required/></label><label className="termsCheck"><input name="terms" type="checkbox" required/>Acepto términos, privacidad y reglas de seguridad.</label><button className="primary" disabled={busy || !backendConnected}><UserRound size={17}/>Registrarme</button></form></Card><Card title="Recuperar contraseña" icon="📧"><form className="accountForm" onSubmit={submitRecovery}><label>Correo<input name="email" type="email" required/></label><button className="ghost" disabled={busy || !backendConnected}><Mail size={17}/>Enviar enlace</button></form></Card></div>}
        <button className="ghost" onClick={() => setDataMode('local')}><CloudOff size={17}/>Volver al modo local</button>
      </>}
    </>}

    {tab === 'local' && <div className="grid2">
      <Card title="Respaldo del dispositivo" icon="💾"><p className="muted">Descarga chats, contactos, notificaciones, reportes y configuración local en un archivo JSON.</p><div className="localDataActions"><button className="primary" onClick={exportLocalBackup}><Download size={17}/>Descargar respaldo</button><button className="ghost" onClick={() => importInput.current?.click()}><Upload size={17}/>Importar respaldo</button><input ref={importInput} type="file" accept="application/json,.json" hidden onChange={importBackup}/></div></Card>
      <Card title="Estado del almacenamiento" icon="📊"><div className="contingencyStatus"><span><b>Modo</b><em>Local</em></span><span><b>Acciones locales</b><em>{syncQueueCount}</em></span><span><b>Conexión</b><em>{online ? 'Disponible' : 'Sin internet'}</em></span><span><b>Archivos</b><em>IndexedDB</em></span></div><button className="dangerButton" onClick={resetData}><Database size={17}/>Restablecer datos locales</button></Card>
    </div>}

    {tab === 'notifications' && <Card title="Qué deseas recibir" icon="🔔"><div className="preferenceList">{Object.entries({ community: 'Comunicados de mi comunidad', chat: 'Mensajes e invitaciones', offers: 'Beneficios y oportunidades', courses: 'Recordatorios de CampusHugo', ride: 'Estados de viajes y envíos' }).map(([key, label]) => <label key={key}><span><Bell size={17}/>{label}</span><input type="checkbox" checked={Boolean(notifications[key])} onChange={event => setNotifications(current => ({ ...current, [key]: event.target.checked }))}/></label>)}</div><button className="primary" onClick={savePreferences}><Save size={17}/>Guardar preferencias</button></Card>}

    {tab === 'security' && <div className="grid2"><Card title="Privacidad por defecto" icon="🛡️"><div className="preferenceList"><label><span><LockKeyhole size={17}/>Buscarme solo por usuario exacto</span><input type="checkbox" defaultChecked/></label><label><span><ShieldCheck size={17}/>Bloquear contacto externo para estudiantes</span><input type="checkbox" defaultChecked/></label><label><span><UserRound size={17}/>Mostrar comunidad en perfil</span><input type="checkbox"/></label></div></Card><Card title="Límites del modo local" icon="⚠️"><ul className="list"><li>Los datos solo existen en este navegador y dispositivo.</li><li>Un respaldo JSON no incluye el contenido binario de archivos adjuntos.</li><li>No hay verificación real de identidad ni contraseña.</li><li>No se sincroniza todavía con otros usuarios o equipos.</li><li>La seguridad multiusuario se activará al recuperar el backend.</li></ul></Card></div>}

    {tab === 'install' && <div className="installCard"><div className="installPhone"><span>MZ</span><b>MiZona</b><small>Tu comunidad en una app</small></div><div><h2>Instala MiZona como aplicación</h2><p>La PWA conserva la interfaz y los datos locales en conexiones inestables.</p><ul className="list"><li>Acceso directo desde celular, tablet o PC.</li><li>Chat local y notificaciones disponibles en el dispositivo.</li><li>Los servicios externos seguirán necesitando internet.</li></ul><button className="primary" onClick={install}><Download size={18}/>Instalar MiZona</button></div></div>}
  </div>;
}
