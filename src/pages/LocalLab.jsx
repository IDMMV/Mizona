import { useState } from 'react';
import { Building2, CheckCircle2, Copy, ExternalLink, FlaskConical, GraduationCap, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react';
import Card from '../components/Card';
import { getLocalStats } from '../lib/localStore';
import { useApp } from '../context/AppContext';
import { listLocalCommunities, listLocalMemberships } from '../lib/localCommunity';

const typeLabel = {
  adult: 'Adulto',
  student: 'Estudiante',
  business: 'Negocio',
  organization: 'Organización'
};

const roleLabel = {
  user: 'Usuario',
  admin: 'Administrador',
  super_admin: 'Superadministrador'
};

function initials(value) {
  return String(value || 'MZ').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export default function LocalLab({ setPage }) {
  const { profile, localProfiles, activateLocalProfile, addLocalProfile, removeLocalProfile } = useApp();
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const stats = getLocalStats();
  const communities = listLocalCommunities();
  const memberships = listLocalMemberships(profile.id);

  const switchProfile = item => {
    try {
      activateLocalProfile(item.id);
      setMessage(`Perfil activo: @${item.username}. Ahora abre Chat o Notificaciones.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createProfile = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const accountType = form.get('accountType');
      const schoolEnabled = accountType === 'student' || Boolean(form.get('schoolEnabled'));
      const created = addLocalProfile({
        displayName: form.get('displayName'),
        username: form.get('username'),
        accountType,
        zone: form.get('zone'),
        role: form.get('role'),
        schoolId: schoolEnabled ? 'san-martin' : null,
        schoolRole: accountType === 'student' ? 'student' : schoolEnabled ? form.get('schoolRole') || 'parent' : null
      });
      setMessage(`Perfil @${created.username} creado y activado.`);
      setShowCreate(false);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const remove = item => {
    if (!window.confirm(`¿Eliminar el perfil local @${item.username}?`)) return;
    try {
      removeLocalProfile(item.id);
      setMessage(`Perfil @${item.username} eliminado.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const openSecondTab = () => {
    const url = window.location.href;
    window.open(url, '_blank', 'noopener');
    setMessage('Se abrió otra pestaña. Allí selecciona un perfil diferente para probar el chat entre dos usuarios.');
  };

  const copyUsername = async username => {
    try {
      await navigator.clipboard.writeText(username);
      setMessage(`Usuario @${username} copiado.`);
    } catch {
      setMessage(`Usuario de prueba: ${username}`);
    }
  };

  return <div className="page localLabPage">
    <section className="labHero">
      <div>
        <span>ETAPA 15 · SIN SUPABASE</span>
        <h1>Laboratorio multiusuario y comunidades</h1>
        <p>Prueba perfiles, Chat y comunidades completas usando varias pestañas del mismo navegador.</p>
      </div>
      <div className="labHeroActions">
        <button className="secondary" onClick={openSecondTab}><ExternalLink size={18}/> Abrir segunda sesión</button>
        <button onClick={() => setShowCreate(value => !value)}><UserPlus size={18}/> Crear perfil de prueba</button>
      </div>
    </section>

    <div className="labWarning"><ShieldCheck size={19}/><div><b>Esto es un laboratorio, no autenticación real.</b><span>Cada pestaña conserva su propio perfil activo mediante sessionStorage; todos comparten los datos de prueba guardados en este navegador.</span></div></div>
    {message && <div className="labMessage"><CheckCircle2 size={18}/>{message}<button onClick={() => setMessage('')}>×</button></div>}

    <div className="labStats">
      <article><b>{localProfiles.length}</b><span>perfiles locales</span></article>
      <article><b>{stats.contacts}</b><span>contactos del perfil</span></article>
      <article><b>{stats.conversations}</b><span>conversaciones visibles</span></article>
      <article><b>{stats.notificationsUnread}</b><span>notificaciones sin leer</span></article>
      <article><b>{communities.length}</b><span>comunidades visibles</span></article>
      <article><b>{memberships.filter(item => item.status === 'active').length}</b><span>membresías activas</span></article>
    </div>

    {showCreate && <Card title="Crear perfil de prueba" icon="🧪">
      <form className="labCreateForm" onSubmit={createProfile}>
        <label>Nombre visible<input name="displayName" required minLength="2" placeholder="Ejemplo: Rosa Mendoza"/></label>
        <label>Usuario único<input name="username" required pattern="[A-Za-z0-9_]{4,20}" placeholder="ROSA_2026"/></label>
        <label>Tipo de cuenta<select name="accountType" defaultValue="adult"><option value="adult">Adulto</option><option value="student">Estudiante</option><option value="business">Negocio</option><option value="organization">Organización</option></select></label>
        <label>Rol local<select name="role" defaultValue="user"><option value="user">Usuario</option><option value="admin">Administrador</option><option value="super_admin">Superadministrador</option></select></label>
        <label>Zona<input name="zone" placeholder="Ventanilla, Pachacútec..."/></label>
        <label className="labCheck"><input type="checkbox" name="schoolEnabled"/> Vincular al Colegio San Martín</label>
        <label>Relación escolar<select name="schoolRole" defaultValue="parent"><option value="parent">Padre o madre</option><option value="teacher">Profesor</option><option value="assistant">Asistente</option></select></label>
        <div className="formActions"><button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancelar</button><button><UserPlus size={17}/> Crear y activar</button></div>
      </form>
    </Card>}

    <div className="labSectionTitle"><div><UsersRound/><span><b>Perfiles disponibles</b><small>El perfil seleccionado afecta solo esta pestaña.</small></span></div><em>Activo: @{profile.username}</em></div>
    <div className="localProfileGrid">
      {localProfiles.map(item => {
        const active = item.id === profile.id;
        return <article key={item.id} className={active ? 'active' : ''}>
          <div className="localProfileAvatar">{initials(item.display_name)}</div>
          <div className="localProfileInfo">
            <span>{active ? 'PERFIL ACTIVO' : item.builtin ? 'DEMOSTRACIÓN' : 'CREADO EN ESTE EQUIPO'}</span>
            <h3>{item.display_name}</h3>
            <button className="usernameCopy" onClick={() => copyUsername(item.username)}>@{item.username}<Copy size={14}/></button>
            <p>{typeLabel[item.account_type] || item.account_type} · {roleLabel[item.role] || item.role}</p>
            <small>📍 {item.zone || 'Sin zona'}{item.school_id ? ' · 🏫 Colegio San Martín' : ''}</small>
          </div>
          <div className="localProfileActions">
            <button disabled={active} onClick={() => switchProfile(item)}>{active ? 'Usando ahora' : 'Usar perfil'}</button>
            {!item.builtin && <button className="danger" title="Eliminar" onClick={() => remove(item)}><Trash2 size={16}/></button>}
          </div>
        </article>;
      })}
    </div>

    <div className="grid2 labGuide">
      <Card title="Prueba completa en dos pestañas" icon="🧭">
        <ol className="labSteps">
          <li><b>Pestaña 1:</b> usa José o crea un perfil adulto.</li>
          <li><b>Pestaña 2:</b> abre otra sesión y selecciona Carlos, María, Ian u otro perfil.</li>
          <li>En Chat, busca el usuario exacto de la otra pestaña.</li>
          <li>Envía la solicitud y acéptala desde la otra sesión.</li>
          <li>Inicia una conversación y comprueba que los mensajes aparecen en ambas pestañas.</li>
        </ol>
        <button onClick={() => setPage('chat')}><FlaskConical size={17}/> Ir a MiZona Chat</button>
      </Card>

      <Card title="Prueba comunidades en dos perfiles" icon="🏘️">
        <ol className="labSteps">
          <li>En una pestaña usa José, María o un perfil administrador.</li>
          <li>En otra pestaña selecciona Carlos, Ian, Dylan u otro perfil.</li>
          <li>Abre Mi Comunidad y solicita ingreso o crea una comunidad.</li>
          <li>Desde el perfil propietario aprueba integrantes y cambia sus roles.</li>
          <li>Publica comunicados, eventos, aulas y documentos; comprueba la actualización en la otra pestaña.</li>
        </ol>
        <button onClick={() => setPage('community')}><Building2 size={17}/> Ir a Mi Comunidad</button>
      </Card>
      <Card title="Pruebas de seguridad escolar" icon="🏫">
        <ul className="list">
          <li><GraduationCap size={16}/> Ian y Dylan pueden encontrarse porque pertenecen al mismo colegio.</li>
          <li>José puede encontrarlos porque figura como padre del mismo colegio.</li>
          <li>Un adulto externo sin vínculo escolar no puede encontrar una cuenta estudiantil.</li>
          <li>Los grupos escolares verifican que los integrantes pertenezcan al mismo colegio.</li>
          <li>Los reportes aparecen únicamente a perfiles administradores.</li>
        </ul>
      </Card>
    </div>
  </div>;
}
