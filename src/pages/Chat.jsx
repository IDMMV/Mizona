import { useState } from 'react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { chatThreads, schoolRooms } from '../data/modules';

const tabs = [
  {id:'inbox', label:'Chats', icon:'💬'}, {id:'contacts', label:'Contactos', icon:'👤'}, {id:'groups', label:'Grupos', icon:'👥'}, {id:'classroom', label:'Aula Chat', icon:'🏫'}, {id:'rules', label:'Reglas', icon:'🛡'}
];

export default function Chat({ setPage }) {
  const [tab,setTab] = useState('inbox');
  return <div className="page"><div className="pageTitle"><div><h1>MiZona Chat</h1><p className="muted">Usuario único, invitaciones, grupos y chat escolar temporal.</p></div><button className="primary">+ Nuevo chat</button></div><Tabs tabs={tabs} active={tab} setActive={setTab}/>{tab==='inbox'&&<Inbox/>}{tab==='contacts'&&<Contacts/>}{tab==='groups'&&<Groups/>}{tab==='classroom'&&<Classroom setPage={setPage}/>} {tab==='rules'&&<Rules/>}</div>;
}
function Inbox(){return <div className="chatLayout"><section className="threadList">{chatThreads.map(t=><button key={t.id} className="thread"><b>{t.name}</b><span>{t.type} · {t.context}</span><small>{t.expires}</small></button>)}</section><section className="chatBox"><div className="chatHeader"><b>Grupo Ciencias</b><span>Archivos y mensajes vencen en 7 días</span></div><div className="messages"><p className="msg them">¿Quién tiene la parte de materiales?</p><p className="msg me">Yo lo subo por MiZona Transfer.</p><p className="msg them">Perfecto, mándanos el enlace.</p></div><div className="composer"><input placeholder="Escribe un mensaje..."/><button>📎</button><button>Enviar</button></div></section></div>}
function Contacts(){return <div className="grid2"><Card title="Buscar contacto" icon="🔎"><p className="muted">Solo búsqueda por usuario exacto. No se permite búsqueda aproximada.</p><input className="field" placeholder="Ej. PEDRO_2009"/><button className="primary">Enviar invitación</button></Card><Card title="Invitaciones" icon="📨"><ul className="list"><li>MARIA_2010 aceptó tu invitación.</li><li>LUIS_2008 pendiente de respuesta.</li></ul></Card></div>}
function Groups(){return <div className="grid2"><Card title="Crear grupo de trabajo" icon="👥"><input className="field" placeholder="Nombre del grupo"/><input className="field" placeholder="Usuarios separados por coma"/><button className="primary full">Crear grupo</button></Card><Card title="Grupos existentes" icon="📚"><ul className="list"><li>Grupo Ciencias · 5 miembros</li><li>Exposición Historia · 4 miembros</li><li>Matemática práctica · 3 miembros</li></ul></Card></div>}
function Classroom({setPage}){return <div className="grid2"><Card title="Aulas del colegio" icon="🏫"><div className="moduleMini">{schoolRooms.map(r=><div key={r.id}><b>{r.name}</b><span>{r.teacher}</span><span>{r.chats} chats · {r.files} archivos</span><button>Abrir</button></div>)}</div></Card><Card title="Archivos de tareas" icon="📤"><p>Para archivos pesados usa MiZona Transfer. Todo vence en 7 días.</p><button className="primary" onClick={()=>setPage('transfer')}>Abrir Transfer</button></Card></div>}
function Rules(){return <Card title="Reglas de seguridad del chat" icon="🛡"><ul className="list"><li>Sin chat entre colegios en la primera versión.</li><li>Alumnos solo dentro de su colegio y salón.</li><li>Adultos no buscan escolares.</li><li>Chats escolares duran máximo 7 días.</li><li>Reportar y bloquear siempre disponibles.</li></ul></Card>}
