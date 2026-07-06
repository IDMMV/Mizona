import { useMemo, useState } from 'react';
import {
  Award, BadgeCheck, BookOpen, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, FileText, GraduationCap, Heart, LockKeyhole, PlayCircle,
  Search, Sparkles, Star, Trophy, UserRound, UsersRound, X
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';

const categories = [
  { id:'all', label:'Todos', icon:'✨' },
  { id:'excel', label:'Excel', icon:'📊' },
  { id:'powerbi', label:'Power BI', icon:'📈' },
  { id:'ia', label:'Inteligencia Artificial', icon:'🤖' },
  { id:'school', label:'Apoyo escolar', icon:'🎒' },
  { id:'business', label:'Negocios', icon:'🏪' }
];

const coursesSeed = [
  {
    id:'excel-zero', category:'excel', title:'Excel desde cero', emoji:'📊', level:'Básico',
    instructor:'Prof. Daniela Ramos', duration:'8 h 30 min', students:1284, rating:4.9,
    price:0, progress:38, enrolled:true, verified:true,
    summary:'Aprende fórmulas, tablas, filtros y gráficos con ejercicios prácticos.',
    modules:[
      { title:'Conociendo Excel', lessons:['Interfaz y libros','Filas, columnas y celdas','Guardar y compartir'] },
      { title:'Fórmulas esenciales', lessons:['SUMA y PROMEDIO','SI y condiciones','Referencias absolutas'] },
      { title:'Trabajar con datos', lessons:['Ordenar y filtrar','Tablas','Gráficos básicos'] }
    ]
  },
  {
    id:'powerbi-intro', category:'powerbi', title:'Power BI para principiantes', emoji:'📈', level:'Básico',
    instructor:'Ing. Marco Salazar', duration:'10 h', students:716, rating:4.8,
    price:29, progress:0, enrolled:false, verified:true,
    summary:'Transforma información en reportes visuales y dashboards claros.',
    modules:[
      { title:'Primer reporte', lessons:['Conocer Power BI','Importar Excel','Visualizaciones'] },
      { title:'Power Query', lessons:['Limpiar datos','Cambiar tipos','Combinar consultas'] },
      { title:'Dashboard final', lessons:['Medidas iniciales','Diseño del panel','Publicación'] }
    ]
  },
  {
    id:'ai-daily', category:'ia', title:'IA útil para la vida diaria', emoji:'🤖', level:'Inicial',
    instructor:'CampusHugo IA', duration:'4 h 20 min', students:2053, rating:4.9,
    price:0, progress:72, enrolled:true, verified:true,
    summary:'Aprende a pedir mejores respuestas, resumir, crear ideas y trabajar con seguridad.',
    modules:[
      { title:'Empezar con IA', lessons:['Qué puede hacer','Cómo escribir instrucciones','Verificar respuestas'] },
      { title:'Productividad', lessons:['Correos y documentos','Estudio','Ideas y planificación'] },
      { title:'Uso responsable', lessons:['Privacidad','Errores comunes','Buenas prácticas'] }
    ]
  },
  {
    id:'math-school', category:'school', title:'Matemática práctica secundaria', emoji:'🧮', level:'Secundaria',
    instructor:'Prof. Luis Medina', duration:'7 h', students:493, rating:4.7,
    price:15, progress:0, enrolled:false, verified:true,
    summary:'Refuerzo con ejemplos cotidianos, ejercicios guiados y evaluaciones cortas.',
    modules:[
      { title:'Números y operaciones', lessons:['Fracciones','Porcentajes','Proporciones'] },
      { title:'Álgebra', lessons:['Expresiones','Ecuaciones','Problemas'] },
      { title:'Geometría', lessons:['Áreas','Volúmenes','Aplicaciones'] }
    ]
  },
  {
    id:'sales-local', category:'business', title:'Vende más en tu zona', emoji:'🏪', level:'Emprendedor',
    instructor:'Lic. Carla Torres', duration:'5 h 10 min', students:362, rating:4.8,
    price:19, progress:0, enrolled:false, verified:true,
    summary:'Promociones, atención al cliente, precios y campañas locales medibles.',
    modules:[
      { title:'Conoce a tu cliente', lessons:['Necesidades de la zona','Perfil del cliente','Competencia'] },
      { title:'Oferta atractiva', lessons:['Precio y valor','Promoción útil','Fotografía sencilla'] },
      { title:'Medir resultados', lessons:['Cupones','QR','Clientes confirmados'] }
    ]
  },
  {
    id:'excel-advanced', category:'excel', title:'Excel intermedio y dashboards', emoji:'⚙️', level:'Intermedio',
    instructor:'Prof. Daniela Ramos', duration:'12 h', students:874, rating:4.9,
    price:39, progress:0, enrolled:false, verified:true,
    summary:'Funciones avanzadas, tablas dinámicas, limpieza de datos y paneles.',
    modules:[
      { title:'Funciones de búsqueda', lessons:['BUSCARX','ÍNDICE y COINCIDIR','Manejo de errores'] },
      { title:'Tablas dinámicas', lessons:['Crear','Agrupar','Segmentadores'] },
      { title:'Dashboard', lessons:['Indicadores','Diseño','Actualización'] }
    ]
  }
];

const certificatesSeed = [
  { id:1, title:'Introducción a la IA', issued:'12 de junio de 2026', code:'MZ-IA-2048', status:'Disponible' },
  { id:2, title:'Seguridad digital básica', issued:'28 de mayo de 2026', code:'MZ-SD-1831', status:'Disponible' }
];

function CourseCard({ course, favorite, onFavorite, onOpen }) {
  return <article className="courseCard">
    <div className="courseVisual"><span>{course.emoji}</span><b>{course.level}</b>{course.price===0&&<em>Gratis</em>}</div>
    <div className="courseBody">
      <div className="courseTitleRow"><div><h3>{course.title}</h3><p>{course.summary}</p></div><button className={`heartBtn ${favorite?'saved':''}`} onClick={()=>onFavorite(course.id)}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
      <div className="courseInstructor"><UserRound size={15}/><span>{course.instructor}</span>{course.verified&&<BadgeCheck size={16}/>}</div>
      <div className="courseMeta"><span><Clock3 size={14}/>{course.duration}</span><span><UsersRound size={14}/>{course.students.toLocaleString('es-PE')}</span><span className="stars"><Star size={14} fill="currentColor"/>{course.rating}</span></div>
      {course.enrolled&&<div className="courseProgress"><div><span>Tu progreso</span><b>{course.progress}%</b></div><div className="progressTrack"><i style={{width:`${course.progress}%`}}/></div></div>}
      <div className="courseActions"><button className="secondary" onClick={()=>onOpen(course)}>Ver contenido</button><button className="primary" onClick={()=>onOpen(course)}>{course.enrolled?'Continuar':course.price===0?'Inscribirme':`S/ ${course.price}`} <ChevronRight size={16}/></button></div>
    </div>
  </article>;
}

export default function Campus(){
  const [tab,setTab]=useState('catalog');
  const [category,setCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [level,setLevel]=useState('all');
  const [selected,setSelected]=useState(null);
  const [favorites,setFavorites]=useState(new Set());
  const [enrolled,setEnrolled]=useState(new Set(coursesSeed.filter(c=>c.enrolled).map(c=>c.id)));
  const [toast,setToast]=useState('');
  const [lesson,setLesson]=useState(null);

  const tabs=[
    { id:'catalog', label:'Cursos', icon:'📚' },
    { id:'learning', label:'Mi aprendizaje', icon:'▶️' },
    { id:'certificates', label:'Certificados', icon:'🏅' },
    { id:'teachers', label:'Profesores', icon:'👩‍🏫' }
  ];

  const courses=useMemo(()=>coursesSeed
    .filter(c=>category==='all'||c.category===category)
    .filter(c=>level==='all'||c.level.toLowerCase().includes(level))
    .filter(c=>`${c.title} ${c.summary} ${c.instructor}`.toLowerCase().includes(query.toLowerCase())),[category,level,query]);

  const myCourses=coursesSeed.filter(c=>enrolled.has(c.id));
  const notify=text=>{setToast(text);setTimeout(()=>setToast(''),2400)};
  const toggleFavorite=id=>setFavorites(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next});
  const enroll=id=>{setEnrolled(prev=>new Set([...prev,id]));notify('Inscripción registrada en el prototipo');};

  return <div className="page campusPage">
    <section className="campusHero">
      <div><p className="eyebrow">Aprende a tu ritmo</p><h1>CampusHugo dentro de MiZona</h1><p>Cursos prácticos para estudiantes, familias, trabajadores y negocios. Continúa donde te quedaste y demuestra lo aprendido.</p><div className="heroActions"><button className="primary" onClick={()=>setTab('learning')}><PlayCircle size={17}/> Continuar aprendiendo</button><button className="secondary" onClick={()=>setTab('certificates')}><Award size={17}/> Mis certificados</button></div></div>
      <div className="campusHeroStats"><span><b>24</b> cursos disponibles</span><span><b>2,840</b> estudiantes</span><span><b>92%</b> satisfacción</span></div>
    </section>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>

    {tab==='catalog'&&<>
      <section className="campusControls"><div className="businessSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca Excel, IA, Power BI, matemática..."/></div><select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">Todos los niveles</option><option value="básico">Básico</option><option value="inicial">Inicial</option><option value="intermedio">Intermedio</option><option value="secundaria">Secundaria</option><option value="emprendedor">Emprendedor</option></select><button className="secondary" onClick={()=>notify(`Tienes ${favorites.size} curso(s) guardado(s)`)}><Heart size={17}/> Guardados ({favorites.size})</button></section>
      <div className="categoryRail">{categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}><span>{c.icon}</span>{c.label}</button>)}</div>
      <div className="campusLayout">
        <section><div className="sectionTitle"><h2>Formación recomendada</h2><p>Cursos pensados para resolver necesidades reales y mejorar oportunidades.</p></div><div className="courseGrid">{courses.map(course=><CourseCard key={course.id} course={{...course,enrolled:enrolled.has(course.id)}} favorite={favorites.has(course.id)} onFavorite={toggleFavorite} onOpen={setSelected}/>)}</div>{!courses.length&&<div className="emptyState">No encontramos cursos con esos filtros.</div>}</section>
        <aside className="campusSide"><Card title="Tu avance semanal" icon="🎯"><div className="weeklyGoal"><b>3 de 5 lecciones</b><div className="progressTrack"><i style={{width:'60%'}}/></div><span>Te faltan 2 para completar tu meta.</span></div></Card><Card title="Ruta sugerida" icon="🧭"><ol className="routeList"><li><b>Excel básico</b><span>En progreso</span></li><li><b>Power BI</b><span>Siguiente</span></li><li><b>IA aplicada</b><span>Recomendado</span></li></ol></Card><Card title="Aprende con confianza" icon="🛡️"><ul className="list compact"><li>Profesores y cursos revisados.</li><li>Evaluaciones breves y prácticas.</li><li>Certificados verificables por código.</li><li>Progreso guardado por usuario.</li></ul></Card></aside>
      </div>
    </>}

    {tab==='learning'&&<div className="campusLearning"><div className="sectionTitle"><h2>Mi aprendizaje</h2><p>Retoma tus cursos y revisa las próximas actividades.</p></div><div className="learningGrid">{myCourses.map(c=><article key={c.id} className="learningCard"><div className="learningIcon">{c.emoji}</div><div><p className="eyebrow">{c.level}</p><h3>{c.title}</h3><div className="courseProgress"><div><span>Progreso</span><b>{c.progress}%</b></div><div className="progressTrack"><i style={{width:`${c.progress}%`}}/></div></div><button className="primary" onClick={()=>setSelected(c)}><PlayCircle size={17}/> Continuar curso</button></div></article>)}</div><div className="grid2"><Card title="Próximas actividades" icon="📅"><ul className="list"><li><b>Excel:</b> práctica de fórmulas · Hoy</li><li><b>IA:</b> evaluación corta · Mañana</li><li><b>Sesión en vivo:</b> preguntas de Excel · Sábado</li></ul></Card><Card title="Logros recientes" icon="🏆"><div className="achievementList"><span>🔥 5 días aprendiendo</span><span>✅ 18 lecciones completadas</span><span>⭐ Promedio 18/20</span></div></Card></div></div>}

    {tab==='certificates'&&<div className="certificateArea"><div className="sectionTitle"><h2>Certificados y logros</h2><p>Cada certificado tiene un código que podrá verificarse públicamente.</p></div><div className="certificateGrid">{certificatesSeed.map(c=><article className="certificateCard" key={c.id}><div className="certificateSeal"><Award size={34}/></div><div><p className="eyebrow">Certificado CampusHugo</p><h3>{c.title}</h3><span>Emitido: {c.issued}</span><code>{c.code}</code></div><button className="secondary" onClick={()=>notify(`Certificado ${c.code} preparado para descargar`)}><FileText size={17}/> Ver certificado</button></article>)}</div><Card title="Próximo certificado" icon="🎓"><p>Completa <b>Excel desde cero</b>. Te falta el 62% del curso y la evaluación final.</p><div className="progressTrack"><i style={{width:'38%'}}/></div></Card></div>}

    {tab==='teachers'&&<div><div className="sectionTitle"><h2>Profesores y especialistas</h2><p>Perfiles educativos revisados por el Centro de Control.</p></div><div className="teacherGrid">{[
      ['DR','Prof. Daniela Ramos','Excel y análisis de datos','4.9 · 2,158 estudiantes'],
      ['MS','Ing. Marco Salazar','Power BI y Power Query','4.8 · 1,204 estudiantes'],
      ['LM','Prof. Luis Medina','Matemática escolar','4.7 · 840 estudiantes'],
      ['CT','Lic. Carla Torres','Ventas y emprendimiento','4.8 · 685 estudiantes']
    ].map(t=><article className="teacherCard" key={t[1]}><div>{t[0]}</div><h3>{t[1]} <BadgeCheck size={17}/></h3><p>{t[2]}</p><span>{t[3]}</span><button className="secondary" onClick={()=>notify(`Perfil de ${t[1]} abierto`)}>Ver perfil</button></article>)}</div></div>}

    {selected&&<div className="modalBackdrop" onMouseDown={()=>setSelected(null)}><section className="courseModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}><X size={18}/></button><div className="courseModalHead"><span>{selected.emoji}</span><div><p className="eyebrow">{selected.level}</p><h2>{selected.title}</h2><p>{selected.summary}</p><div className="courseMeta"><span><Clock3 size={15}/>{selected.duration}</span><span><UsersRound size={15}/>{selected.students.toLocaleString('es-PE')} estudiantes</span><span className="stars"><Star size={14} fill="currentColor"/>{selected.rating}</span></div></div></div><div className="courseModalBody"><div><h3>Contenido del curso</h3><div className="curriculum">{selected.modules.map((m,idx)=><details key={m.title} open={idx===0}><summary><span>{idx+1}</span><b>{m.title}</b><em>{m.lessons.length} lecciones</em></summary>{m.lessons.map((l,i)=><button key={l} onClick={()=>{if(enrolled.has(selected.id)){setLesson({course:selected,lesson:l,module:m.title});setSelected(null)}else notify('Inscríbete para abrir las lecciones')}}><PlayCircle size={16}/>{l}{!enrolled.has(selected.id)&&<LockKeyhole size={14}/>}</button>)}</details>)}</div></div><aside><Card title="Incluye" icon="✅"><ul className="list compact"><li>{selected.modules.reduce((n,m)=>n+m.lessons.length,0)} lecciones.</li><li>Ejercicios prácticos.</li><li>Evaluación final.</li><li>Certificado verificable.</li></ul></Card>{enrolled.has(selected.id)?<button className="primary full" onClick={()=>{setLesson({course:selected,lesson:selected.modules[0].lessons[0],module:selected.modules[0].title});setSelected(null)}}><PlayCircle size={17}/> Continuar curso</button>:<button className="primary full" onClick={()=>enroll(selected.id)}>{selected.price===0?'Inscribirme gratis':`Inscribirme por S/ ${selected.price}`}</button>}</aside></div></section></div>}

    {lesson&&<div className="modalBackdrop" onMouseDown={()=>setLesson(null)}><section className="lessonModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setLesson(null)}><X size={18}/></button><div className="lessonVideo"><PlayCircle size={64}/><span>Reproductor de clase</span></div><p className="eyebrow">{lesson.module}</p><h2>{lesson.lesson}</h2><p>Esta pantalla representa la experiencia de clase. En la integración funcional se conectará el video, los recursos, el ejercicio y el guardado de progreso en Supabase.</p><div className="lessonResources"><button className="secondary"><FileText size={17}/> Descargar práctica</button><button className="primary" onClick={()=>{setLesson(null);notify('Lección marcada como completada')}}><CheckCircle2 size={17}/> Completar lección</button></div></section></div>}

    {toast&&<div className="toastSuccess"><Sparkles size={17}/>{toast}</div>}
  </div>;
}
