import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Download, KeyRound, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { hasSupabase, supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function Account() {
  const { profile, setProfile } = useApp();
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

  const submitAuth = async (event, mode) => {
    event.preventDefault();
    if (!hasSupabase) return setMessage('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar la autenticación real.');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    setBusy(true); setMessage('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Sesión iniciada correctamente.');
      } else if (mode === 'register') {
        const username = String(form.get('username') || '').trim().toUpperCase();
        const displayName = String(form.get('displayName') || '').trim();
        if (!form.get('terms')) throw new Error('Debes aceptar los términos y la declaración de uso.');
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username, display_name: displayName, account_type: form.get('accountType') } } });
        if (error) throw error;
        setMessage('Cuenta creada. Revisa tu correo si la confirmación está activada.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setMessage('Se envió el enlace de recuperación.');
      }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const saveProfile = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfile({ displayName: form.get('displayName'), username: String(form.get('username')).toUpperCase(), zone: form.get('zone') });
    setMessage('Perfil guardado en este dispositivo.');
  };
  const install = async () => {
    if (!installPrompt) return setMessage('En Chrome, abre el menú del navegador y selecciona Instalar MiZona o Agregar a pantalla de inicio.');
    await installPrompt.prompt(); setInstallPrompt(null);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'access', label: 'Acceso', icon: '🔐' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'security', label: 'Privacidad', icon: '🛡️' },
    { id: 'install', label: 'Instalar app', icon: '📲' }
  ];

  return <div className="page accountPage">
    <div className="pageTitle"><div><h1>Mi Cuenta</h1><p className="muted">Identidad, acceso, privacidad y preferencias de MiZona.</p></div><span className={`connectionBadge ${hasSupabase ? 'connected' : ''}`}>{hasSupabase ? 'Supabase conectado' : 'Modo demostración'}</span></div>
    <Tabs tabs={tabs} active={tab} setActive={setTab}/>
    {message && <div className="accountMessage"><CheckCircle2 size={18}/>{message}<button onClick={() => setMessage('')}>×</button></div>}

    {tab === 'profile' && <div className="grid2"><Card title="Identidad MiZona" icon="👤"><form className="accountForm" onSubmit={saveProfile}><label>Nombre visible<input name="displayName" defaultValue={profile.displayName}/></label><label>Usuario único<input name="username" defaultValue={profile.username}/><small>Se usa para encontrarte por coincidencia exacta.</small></label><label>Zona principal<input name="zone" defaultValue={profile.zone}/></label><button className="primary" type="submit"><Save size={17}/>Guardar cambios</button></form></Card><Card title="Resumen de cuenta" icon="🪪"><div className="profilePreview"><div>JH</div><h2>{profile.displayName}</h2><b>@{profile.username}</b><span>📍 {profile.zone}</span><em>Cuenta personal · Demostración</em></div></Card></div>}

    {tab === 'access' && <div className="accountAuthGrid">
      <Card title="Iniciar sesión" icon="🔐"><form className="accountForm" onSubmit={event => submitAuth(event, 'login')}><label>Correo<input name="email" type="email" required/></label><label>Contraseña<input name="password" type="password" minLength="6" required/></label><button className="primary" disabled={busy}><KeyRound size={17}/>Ingresar</button></form></Card>
      <Card title="Crear cuenta" icon="✨"><form className="accountForm" onSubmit={event => submitAuth(event, 'register')}><label>Nombre<input name="displayName" required/></label><label>Usuario único<input name="username" pattern="[A-Za-z0-9_]{4,20}" required/></label><label>Tipo de cuenta<select name="accountType"><option value="adult">Adulto</option><option value="student">Estudiante validado</option><option value="business">Negocio</option><option value="organization">Organización</option></select></label><label>Correo<input name="email" type="email" required/></label><label>Contraseña<input name="password" type="password" minLength="6" required/></label><label className="termsCheck"><input name="terms" type="checkbox"/>Declaro que los datos son correctos y acepto términos, privacidad y reglas de seguridad.</label><button className="primary" disabled={busy}><UserRound size={17}/>Registrarme</button></form></Card>
      <Card title="Recuperar contraseña" icon="📧"><form className="accountForm" onSubmit={event => submitAuth(event, 'recover')}><label>Correo de recuperación<input name="email" type="email" required/></label><button className="ghost" disabled={busy}><Mail size={17}/>Enviar enlace</button></form></Card>
    </div>}

    {tab === 'notifications' && <Card title="Qué deseas recibir" icon="🔔"><div className="preferenceList">{Object.entries({ community: 'Comunicados de mi comunidad', chat: 'Mensajes e invitaciones', offers: 'Beneficios y oportunidades', courses: 'Recordatorios de CampusHugo', ride: 'Estados de viajes y envíos' }).map(([key,label]) => <label key={key}><span><Bell size={17}/>{label}</span><input type="checkbox" checked={notifications[key]} onChange={event => setNotifications(current => ({ ...current, [key]: event.target.checked }))}/></label>)}</div><button className="primary" onClick={() => setMessage('Preferencias guardadas en este dispositivo.')}><Save size={17}/>Guardar preferencias</button></Card>}

    {tab === 'security' && <div className="grid2"><Card title="Privacidad por defecto" icon="🛡️"><div className="preferenceList"><label><span><LockKeyhole size={17}/>Buscarme solo por usuario exacto</span><input type="checkbox" defaultChecked/></label><label><span><ShieldCheck size={17}/>Bloquear contacto externo para estudiantes</span><input type="checkbox" defaultChecked/></label><label><span><UserRound size={17}/>Mostrar comunidad en perfil</span><input type="checkbox"/></label></div></Card><Card title="Reglas importantes" icon="⚠️"><ul className="list"><li>No compartas contraseñas ni códigos.</li><li>Los estudiantes permanecen dentro de comunidades validadas.</li><li>Reporta perfiles, publicaciones o viajes sospechosos.</li><li>Las sesiones administrativas deben usar verificación adicional.</li></ul></Card></div>}

    {tab === 'install' && <div className="installCard"><div className="installPhone"><span>MZ</span><b>MiZona</b><small>Tu comunidad en una app</small></div><div><h2>Instala MiZona como aplicación</h2><p>La versión PWA puede abrirse desde la pantalla de inicio y conserva la interfaz básica en conexiones inestables.</p><ul className="list"><li>Acceso directo desde celular, tablet o PC.</li><li>Manifest, iconos y service worker incluidos.</li><li>Las funciones que requieren datos siguen necesitando internet.</li></ul><button className="primary" onClick={install}><Download size={18}/>Instalar MiZona</button></div></div>}
  </div>;
}
