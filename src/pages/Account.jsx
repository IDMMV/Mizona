import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Download, KeyRound, LockKeyhole, LogOut, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { friendlyAuthError } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function Account() {
  const {
    profile,
    user,
    isAuthenticated,
    authLoading,
    backendConnected,
    backendMessage,
    clearBackendMessage,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    saveProfile
  } = useApp();

  const [tab, setTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notifications, setNotifications] = useState({ community: true, chat: true, offers: true, courses: false, ride: true });

  useEffect(() => {
    const handler = event => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const run = async action => {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
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
        displayName: form.get('displayName'),
        username: form.get('username'),
        accountType: form.get('accountType'),
        zone: form.get('zone'),
        email: form.get('email'),
        password: form.get('password'),
        termsAccepted: Boolean(form.get('terms'))
      });
      setMessage(result?.session ? 'Cuenta creada e iniciada.' : 'Cuenta creada. Revisa tu correo para confirmarla.');
    });
  };

  const submitRecovery = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      await resetPassword(form.get('email'));
      setMessage('Se envió el enlace de recuperación al correo indicado.');
    });
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
      const result = await saveProfile({
        displayName: form.get('displayName'),
        username: form.get('username'),
        zone: form.get('zone')
      });
      setMessage(result.persisted ? 'Perfil guardado en Supabase.' : 'Perfil guardado en este dispositivo.');
    });
  };

  const logout = () => run(async () => {
    await signOut();
    setMessage('Sesión cerrada.');
    setTab('access');
  });

  const install = async () => {
    if (!installPrompt) {
      setMessage('En Chrome abre el menú del navegador y selecciona Instalar MiZona o Agregar a pantalla de inicio.');
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'access', label: 'Acceso', icon: '🔐' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'security', label: 'Privacidad', icon: '🛡️' },
    { id: 'install', label: 'Instalar app', icon: '📲' }
  ];

  const initials = String(profile.displayName || 'MZ').split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();

  return <div className="page accountPage">
    <div className="pageTitle">
      <div><h1>Mi Cuenta</h1><p className="muted">Identidad, acceso, privacidad y preferencias de MiZona.</p></div>
      <span className={`connectionBadge ${backendConnected ? 'connected' : ''}`}>{backendConnected ? 'Supabase configurado' : 'Modo demostración'}</span>
    </div>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>

    {(message || backendMessage) && <div className="accountMessage">
      <CheckCircle2 size={18}/>{message || backendMessage}
      <button onClick={() => { setMessage(''); clearBackendMessage(); }}>×</button>
    </div>}

    {!backendConnected && <div className="setupWarning">
      <b>Falta conectar el proyecto con Supabase.</b>
      <span>La interfaz seguirá funcionando como demostración, pero las cuentas y cambios solo serán reales después de configurar las variables y ejecutar el SQL de la Etapa 10.</span>
    </div>}

    {tab === 'profile' && <div className="grid2">
      <Card title="Identidad MiZona" icon="👤">
        <form className="accountForm" onSubmit={submitProfile} key={`${profile.id || 'demo'}-${profile.username}`}>
          <label>Nombre visible<input name="displayName" defaultValue={profile.displayName} required/></label>
          <label>Usuario único<input name="username" defaultValue={profile.username} pattern="[A-Za-z0-9_]{4,20}" required/><small>Se usa para encontrarte por coincidencia exacta.</small></label>
          <label>Zona principal<input name="zone" defaultValue={profile.zone}/></label>
          <button className="primary" type="submit" disabled={busy}><Save size={17}/>Guardar cambios</button>
        </form>
      </Card>

      <Card title="Resumen de cuenta" icon="🪪">
        <div className="profilePreview">
          <div>{initials}</div>
          <h2>{profile.displayName}</h2>
          <b>@{profile.username}</b>
          <span>📍 {profile.zone}</span>
          <em>{isAuthenticated ? `${profile.accountType} · ${profile.role}` : 'Cuenta de demostración'}</em>
          {user?.email && <small>{user.email}</small>}
        </div>
      </Card>
    </div>}

    {tab === 'access' && <>
      {authLoading && <Card title="Verificando sesión" icon="⏳"><p className="muted">Comprobando tu acceso...</p></Card>}

      {!authLoading && isAuthenticated && <div className="grid2">
        <Card title="Sesión activa" icon="✅">
          <div className="sessionSummary">
            <b>{profile.displayName}</b>
            <span>@{profile.username}</span>
            <small>{user?.email}</small>
            <small>Rol: {profile.role}</small>
          </div>
          <button className="dangerButton" disabled={busy} onClick={logout}><LogOut size={17}/>Cerrar sesión</button>
        </Card>

        <Card title="Cambiar contraseña" icon="🔑">
          <form className="accountForm" onSubmit={submitPassword}>
            <label>Nueva contraseña<input name="password" type="password" minLength="8" required/></label>
            <label>Repetir contraseña<input name="confirmation" type="password" minLength="8" required/></label>
            <button className="primary" disabled={busy}><KeyRound size={17}/>Actualizar contraseña</button>
          </form>
        </Card>
      </div>}

      {!authLoading && !isAuthenticated && <div className="accountAuthGrid">
        <Card title="Iniciar sesión" icon="🔐">
          <form className="accountForm" onSubmit={submitLogin}>
            <label>Usuario o correo<input name="identifier" autoComplete="username" required/><small>El ingreso por usuario requiere desplegar la función incluida. El correo funciona directamente.</small></label>
            <label>Contraseña<input name="password" type="password" minLength="6" autoComplete="current-password" required/></label>
            <button className="primary" disabled={busy || !backendConnected}><KeyRound size={17}/>Ingresar</button>
          </form>
        </Card>

        <Card title="Crear cuenta" icon="✨">
          <form className="accountForm" onSubmit={submitRegister}>
            <label>Nombre visible<input name="displayName" required/></label>
            <label>Usuario único<input name="username" pattern="[A-Za-z0-9_]{4,20}" required/></label>
            <label>Tipo de cuenta<select name="accountType"><option value="adult">Adulto</option><option value="student">Estudiante por validar</option><option value="business">Negocio</option><option value="organization">Organización</option></select></label>
            <label>Zona principal<input name="zone" placeholder="Ejemplo: Ventanilla - Pachacútec"/></label>
            <label>Correo<input name="email" type="email" autoComplete="email" required/></label>
            <label>Contraseña<input name="password" type="password" minLength="8" autoComplete="new-password" required/></label>
            <label className="termsCheck"><input name="terms" type="checkbox" required/>Declaro que los datos son correctos y acepto términos, privacidad y reglas de seguridad.</label>
            <button className="primary" disabled={busy || !backendConnected}><UserRound size={17}/>Registrarme</button>
          </form>
        </Card>

        <Card title="Recuperar contraseña" icon="📧">
          <form className="accountForm" onSubmit={submitRecovery}>
            <label>Correo de recuperación<input name="email" type="email" required/></label>
            <button className="ghost" disabled={busy || !backendConnected}><Mail size={17}/>Enviar enlace</button>
          </form>
        </Card>
      </div>}
    </>}

    {tab === 'notifications' && <Card title="Qué deseas recibir" icon="🔔">
      <div className="preferenceList">
        {Object.entries({ community: 'Comunicados de mi comunidad', chat: 'Mensajes e invitaciones', offers: 'Beneficios y oportunidades', courses: 'Recordatorios de CampusHugo', ride: 'Estados de viajes y envíos' }).map(([key, label]) => <label key={key}><span><Bell size={17}/>{label}</span><input type="checkbox" checked={notifications[key]} onChange={event => setNotifications(current => ({ ...current, [key]: event.target.checked }))}/></label>)}
      </div>
      <button className="primary" onClick={() => setMessage('Preferencias guardadas en este dispositivo.')}><Save size={17}/>Guardar preferencias</button>
    </Card>}

    {tab === 'security' && <div className="grid2">
      <Card title="Privacidad por defecto" icon="🛡️"><div className="preferenceList"><label><span><LockKeyhole size={17}/>Buscarme solo por usuario exacto</span><input type="checkbox" defaultChecked/></label><label><span><ShieldCheck size={17}/>Bloquear contacto externo para estudiantes</span><input type="checkbox" defaultChecked/></label><label><span><UserRound size={17}/>Mostrar comunidad en perfil</span><input type="checkbox"/></label></div></Card>
      <Card title="Reglas importantes" icon="⚠️"><ul className="list"><li>No compartas contraseñas ni códigos.</li><li>Los estudiantes permanecen dentro de comunidades validadas.</li><li>Reporta perfiles, publicaciones o viajes sospechosos.</li><li>Las sesiones administrativas deben usar verificación adicional.</li></ul></Card>
    </div>}

    {tab === 'install' && <div className="installCard">
      <div className="installPhone"><span>MZ</span><b>MiZona</b><small>Tu comunidad en una app</small></div>
      <div><h2>Instala MiZona como aplicación</h2><p>La versión PWA puede abrirse desde la pantalla de inicio y conserva la interfaz básica en conexiones inestables.</p><ul className="list"><li>Acceso directo desde celular, tablet o PC.</li><li>Manifest, iconos y service worker incluidos.</li><li>Las funciones que requieren datos siguen necesitando internet.</li></ul><button className="primary" onClick={install}><Download size={18}/>Instalar MiZona</button></div>
    </div>}
  </div>;
}
