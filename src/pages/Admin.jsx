import { useMemo, useState } from 'react';
import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import Tabs from '../components/Tabs';
import { modules } from '../data/modules';

const campaigns=[
 {id:1,title:'Combo familiar de pollo',owner:'Pollería El Buen Sabor',type:'Oferta',status:'active',views:1260,actions:184},
 {id:2,title:'Campaña médica gratuita',owner:'Centro de Salud Pachacútec',type:'Campaña',status:'active',views:840,actions:92},
 {id:3,title:'Auxiliar de caja',owner:'Mercado Central',type:'Empleo',status:'beta',views:610,actions:47},
 {id:4,title:'2x1 entradas infantiles',owner:'Cine Plaza Ventanilla',type:'Cupón',status:'maintenance',views:430,actions:68}
];

export default function Admin(){
 const [local,setLocal]=useState(modules);
 const [tab,setTab]=useState('modules');
 const [campaignState,setCampaignState]=useState(campaigns);
 const counts=useMemo(()=>local.reduce((a,m)=>({...a,[m.status]:(a[m.status]||0)+1}),{}),[local]);
 const cycle=s=>s==='active'?'beta':s==='beta'?'maintenance':s==='maintenance'?'soon':'active';
 const toggleCampaign=id=>setCampaignState(arr=>arr.map(x=>x.id===id?{...x,status:x.status==='active'?'maintenance':'active'}:x));
 const tabs=[{id:'modules',label:'Módulos',icon:'🧩'},{id:'benefits',label:'Beneficios',icon:'🎁'},{id:'security',label:'Seguridad',icon:'🛡️'},{id:'storage',label:'Storage',icon:'🧹'}];
 return <div className="page"><h1>Centro de Control Enterprise</h1><p className="muted">Controla módulos, permisos, comunidades, chat, beneficios, storage y evolución de MiZona.</p><div className="stats"><span>🟢 Activos: {counts.active||0}</span><span>🟡 Beta: {counts.beta||0}</span><span>🔴 Mant.: {counts.maintenance||0}</span><span>⚪ Próx.: {counts.soon||0}</span></div><Tabs tabs={tabs} active={tab} setActive={setTab}/>
 {tab==='modules'&&<div className="grid2"><Card title="Control de módulos" icon="🧩"><div className="adminTable">{local.map((m,i)=><div key={m.id}><b>{m.label}</b><span>{m.audience}</span><StatusPill status={m.status}/><button onClick={()=>setLocal(arr=>arr.map((x,idx)=>idx===i?{...x,status:cycle(x.status)}:x))}>Cambiar</button></div>)}</div></Card><Card title="Políticas activas" icon="🛡"><ul className="list"><li>No chat entre colegios.</li><li>Aula Chat solo con alumnos validados.</li><li>Chats y archivos vencen en 7 días.</li><li>Usuario único y nombres no vulgares.</li><li>Adultos no buscan escolares.</li><li>Beneficios requieren fecha de vigencia y responsable.</li></ul></Card></div>}
 {tab==='benefits'&&<><div className="adminKpis"><span><b>3,140</b> vistas</span><span><b>391</b> acciones</span><span><b>12.5%</b> conversión</span><span><b>4</b> campañas</span></div><Card title="Moderación de oportunidades" icon="🎁"><div className="campaignTable"><div className="campaignRow campaignHead"><b>Campaña</b><b>Responsable</b><b>Tipo</b><b>Resultados</b><b>Estado</b><b>Acción</b></div>{campaignState.map(c=><div className="campaignRow" key={c.id}><b>{c.title}</b><span>{c.owner}</span><span>{c.type}</span><span>{c.views} vistas · {c.actions} acciones</span><StatusPill status={c.status}/><button onClick={()=>toggleCampaign(c.id)}>{c.status==='active'?'Pausar':'Activar'}</button></div>)}</div></Card></>}
 {tab==='security'&&<div className="grid2"><Card title="Reglas escolares" icon="🏫"><ul className="list"><li>Alumnos solo interactúan dentro de su colegio.</li><li>Búsqueda por usuario exacto.</li><li>Sin videollamadas escolares en esta fase.</li><li>Grupos de trabajo permitidos y moderables.</li></ul></Card><Card title="Control antifraude" icon="🔎"><ul className="list"><li>Alerta por creación masiva de cuentas.</li><li>Revisión de campañas engañosas.</li><li>Registro de reportes, bloqueos y suspensiones.</li><li>Validación adicional para administradores y negocios.</li></ul></Card></div>}
 {tab==='storage'&&<Card title="Storage y mantenimiento" icon="🧹"><div className="progressRows"><label>Storage usado <b>21%</b><i><span style={{width:'21%'}}/></i></label><label>Chats por vencer <b>126</b><i><span style={{width:'40%'}}/></i></label><label>Archivos temporales <b>62</b><i><span style={{width:'30%'}}/></i></label><label>Imágenes de beneficios <b>38</b><i><span style={{width:'24%'}}/></i></label></div></Card>}
 </div>;
}
