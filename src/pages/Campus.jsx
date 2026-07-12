import { useEffect, useMemo, useState } from 'react';
import { Award, BadgeCheck, BookOpen, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Download, FileText, Flag, GraduationCap, Heart, Lock, LockKeyhole, Map, PenLine, PlayCircle, Plus, Search, Sparkles, Star, Target, Trophy, Upload, UserRound, UsersRound, X } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import {
  completeLocalLesson,
  createLocalAssignment,
  createLocalCourse,
  enrollLocalCourse,
  getLocalCampusSnapshot,
  issueLocalCertificate,
  reportLocalCourse,
  reviewLocalSubmission,
  submitLocalAssignment,
  submitLocalQuiz,
  subscribeLocalCampus,
  toggleLocalCourseFavorite
} from '../lib/localCampus';

const categories = [
  { id:'all', label:'Todos', icon:'✨' },
  { id:'excel', label:'Excel', icon:'📊' },
  { id:'powerbi', label:'Power BI', icon:'📈' },
  { id:'ai', label:'Inteligencia Artificial', icon:'🤖' },
  { id:'school', label:'Apoyo escolar', icon:'🎒' },
  { id:'business', label:'Negocios', icon:'🏪' }
];

function CourseCard({ course, onFavorite, onOpen }) {
  return <article className={`courseCard ${course.status !== 'active' ? 'campusCourseInactive' : ''}`}>
    <div className="courseVisual"><span>{course.emoji}</span><b>{course.level}</b>{course.price===0&&<em>Gratis</em>}{course.status!=='active'&&<i className="campusStatusBadge">{course.status}</i>}</div>
    <div className="courseBody">
      <div className="courseTitleRow"><div><h3>{course.title}</h3><p>{course.summary}</p></div><button className={`heartBtn ${course.favorite?'saved':''}`} onClick={()=>onFavorite(course.id)}><Heart size={18} fill={course.favorite?'currentColor':'none'}/></button></div>
      <div className="courseInstructor"><UserRound size={15}/><span>{course.instructor_name}</span>{course.verified&&<BadgeCheck size={16}/>}</div>
      <div className="courseMeta"><span><Clock3 size={14}/>{course.duration}</span><span><UsersRound size={14}/>{course.students}</span><span className="stars"><Star size={14} fill="currentColor"/>{course.rating||'Nuevo'}</span></div>
      {course.enrolled&&<div className="courseProgress"><div><span>Tu progreso</span><b>{course.progress}%</b></div><div className="progressTrack"><i style={{width:`${course.progress}%`}}/></div></div>}
      <div className="courseActions"><button className="secondary" onClick={()=>onOpen(course)}>Ver contenido</button><button className="primary" onClick={()=>onOpen(course)}>{course.enrolled?'Continuar':course.price===0?'Inscribirme':`S/ ${course.price}`} <ChevronRight size={16}/></button></div>
    </div>
  </article>;
}

function CourseModal({ course, snapshot, onClose, onRefresh, onLesson, onQuiz, onToast }) {
  const [reporting,setReporting]=useState(false);
  const [reason,setReason]=useState('Contenido incorrecto');
  const [details,setDetails]=useState('');
  const enrolled=course.enrolled;
  const progressRows=snapshot.progress.filter(item=>item.user_id===snapshot.profile.id&&item.course_id===course.id&&item.completed);
  const completedIds=new Set(progressRows.map(item=>item.lesson_id));
  const doEnroll=()=>{try{enrollLocalCourse(course.id);onRefresh();onToast('Inscripción registrada en este dispositivo.');}catch(error){onToast(error.message);}};
  const doCertificate=()=>{try{const cert=issueLocalCertificate(course.id);onRefresh();onToast(`Certificado emitido: ${cert.code}`);}catch(error){onToast(error.message);}};
  const submitReport=()=>{try{reportLocalCourse(course.id,reason,details);setReporting(false);setDetails('');onToast('Reporte enviado al Centro de Control.');}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop" onMouseDown={event=>event.target===event.currentTarget&&onClose()}>
    <div className="courseModal campusCourseModalV18">
      <button className="modalClose" onClick={onClose}><X size={20}/></button>
      <div className="courseModalHead"><span>{course.emoji}</span><div><p className="eyebrow">{course.category} · {course.level}</p><h2>{course.title}</h2><p>{course.summary}</p><div className="courseInstructor"><UserRound size={15}/><span>{course.instructor_name}</span>{course.verified&&<BadgeCheck size={16}/>}</div></div></div>
      <div className="courseModalBody">
        <section>
          <h3>Contenido del curso</h3>
          <div className="curriculum">{course.modules.map((module,index)=><details key={module.id} open={index===0}><summary><span>{index+1}</span><b>{module.title}</b><em>{module.lessons.length} lecciones</em></summary>{module.lessons.map(lesson=><button key={lesson.id} onClick={()=>lesson.type==='quiz'?onQuiz(course):onLesson(course,lesson)} disabled={!enrolled}><span>{completedIds.has(lesson.id)?<CheckCircle2 size={17}/>:lesson.type==='quiz'?<ClipboardCheck size={17}/>:<PlayCircle size={17}/>}</span><b>{lesson.title}</b><small>{lesson.minutes} min</small></button>)}</details>)}</div>
        </section>
        <aside>
          <Card title="Información" icon={<BookOpen size={18}/>}><ul className="list"><li>{course.duration} de contenido.</li><li>{course.students} estudiantes locales.</li><li>{course.requirements}</li><li>{course.certificate?'Certificado disponible.':'Sin certificado.'}</li></ul></Card>
          {!enrolled&&course.status==='active'&&<button className="primary wide" onClick={doEnroll}>{course.price===0?'Inscribirme gratis':`Inscribirme por S/ ${course.price}`}</button>}
          {enrolled&&<><div className="courseProgress"><div><span>Avance general</span><b>{course.progress}%</b></div><div className="progressTrack"><i style={{width:`${course.progress}%`}}/></div></div><button className="secondary wide" onClick={()=>onQuiz(course)}><ClipboardCheck size={16}/> Evaluación final</button>{course.certificate&&<button className="primary wide" onClick={doCertificate}><Award size={16}/> Generar certificado</button>}</>}
          <button className="ghost wide" onClick={()=>setReporting(true)}><Flag size={16}/> Reportar contenido</button>
        </aside>
      </div>
      {reporting&&<div className="campusInlinePanel"><h3>Reportar curso</h3><select value={reason} onChange={e=>setReason(e.target.value)}><option>Contenido incorrecto</option><option>Lenguaje inadecuado</option><option>Publicidad engañosa</option><option>Problema de derechos</option></select><textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe el problema..."/><div><button className="secondary" onClick={()=>setReporting(false)}>Cancelar</button><button className="primary" onClick={submitReport}>Enviar reporte</button></div></div>}
    </div>
  </div>;
}

function LessonModal({ course, lesson, onClose, onRefresh, onToast }) {
  const snapshot=getLocalCampusSnapshot();
  const done=snapshot.progress.some(item=>item.user_id===snapshot.profile.id&&item.course_id===course.id&&item.lesson_id===lesson.id&&item.completed);
  const toggle=()=>{try{const progress=completeLocalLesson(course.id,lesson.id,!done);onRefresh();onToast(!done?`Lección completada. Avance: ${progress}%`:'Lección marcada como pendiente.');onClose();}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop"><div className="lessonModal"><button className="modalClose" onClick={onClose}><X size={20}/></button><div className="lessonVideo"><PlayCircle size={58}/><b>{lesson.title}</b><span>Reproductor demostrativo local · {lesson.minutes} minutos</span></div><h2>{lesson.title}</h2><p className="muted">Esta lección conserva el avance por perfil. En producción, aquí se conectará el video, pizarra interactiva o ejercicio correspondiente.</p><div className="campusLessonSteps"><span><b>1</b> Revisa la explicación.</span><span><b>2</b> Practica con el recurso.</span><span><b>3</b> Marca la lección como completada.</span></div><div className="lessonResources">{lesson.resource&&<button className="secondary" onClick={()=>onToast(`Recurso preparado: ${lesson.resource}`)}><Download size={16}/> {lesson.resource}</button>}<button className={done?'secondary':'primary'} onClick={toggle}>{done?'Marcar pendiente':'Completar lección'} <CheckCircle2 size={16}/></button></div></div></div>;
}

function QuizModal({ course, onClose, onRefresh, onToast }) {
  const [answers,setAnswers]=useState({});
  const [result,setResult]=useState(null);
  const submit=()=>{try{const next=submitLocalQuiz(course.id,answers);setResult(next);onRefresh();onToast(next.passed?'Evaluación aprobada.':'Debes obtener al menos 70%.');}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop"><div className="lessonModal campusQuizModal"><button className="modalClose" onClick={onClose}><X size={20}/></button><p className="eyebrow">Evaluación final</p><h2>{course.title}</h2><p className="muted">Selecciona una respuesta por pregunta. Necesitas 70% para aprobar.</p><div className="campusQuizQuestions">{course.quiz.map((question,index)=><fieldset key={question.id}><legend>{index+1}. {question.question}</legend>{question.options.map((option,i)=><label key={option}><input type="radio" name={question.id} checked={Number(answers[question.id])===i} onChange={()=>setAnswers(current=>({...current,[question.id]:i}))}/><span>{option}</span></label>)}</fieldset>)}</div>{result&&<div className={`campusQuizResult ${result.passed?'passed':'failed'}`}><Trophy size={24}/><div><b>{result.score}% · {result.passed?'Aprobado':'Por mejorar'}</b><span>{result.correct} de {result.total} respuestas correctas.</span></div></div>}<div className="modalActions"><button className="secondary" onClick={onClose}>Cerrar</button><button className="primary" onClick={submit}>Calificar evaluación</button></div></div></div>;
}

function AssignmentModal({ assignment, onClose, onRefresh, onToast }) {
  const [text,setText]=useState(assignment.submission?.text||'');
  const [fileName,setFileName]=useState(assignment.submission?.file_name||'');
  const submit=()=>{try{submitLocalAssignment(assignment.id,{text,fileName});onRefresh();onToast('Tarea enviada al profesor.');onClose();}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop"><div className="formModal"><button className="modalClose" onClick={onClose}><X size={20}/></button><h2>{assignment.title}</h2><p className="muted">{assignment.description}</p><label>Respuesta o comentario<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Explica tu trabajo..."/></label><label>Nombre del archivo entregado<input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="ejemplo: tarea_final.pdf"/></label><p className="campusLocalNotice"><Upload size={16}/> En esta etapa se registra el nombre del archivo. El archivo real seguirá usando el almacenamiento local del Chat/Transfer.</p><button className="primary wide" onClick={submit}>Enviar tarea</button></div></div>;
}

function CreateCourseModal({ onClose, onRefresh, onToast }) {
  const [form,setForm]=useState({title:'',category:'excel',emoji:'📘',level:'Básico',duration:'2 h',price:0,summary:'',requirements:'',moduleTitle:'Módulo inicial',lesson1:'Introducción',lesson2:'Práctica guiada',certificate:true});
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const submit=()=>{try{createLocalCourse(form);onRefresh();onToast('Curso creado y enviado a revisión.');onClose();}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop"><div className="formModal campusCreateCourse"><button className="modalClose" onClick={onClose}><X size={20}/></button><h2>Crear curso local</h2><div className="campusFormGrid"><label>Título<input value={form.title} onChange={e=>set('title',e.target.value)}/></label><label>Categoría<select value={form.category} onChange={e=>set('category',e.target.value)}><option value="excel">Excel</option><option value="powerbi">Power BI</option><option value="ai">IA</option><option value="school">Apoyo escolar</option><option value="business">Negocios</option></select></label><label>Icono<input value={form.emoji} onChange={e=>set('emoji',e.target.value)}/></label><label>Nivel<input value={form.level} onChange={e=>set('level',e.target.value)}/></label><label>Duración<input value={form.duration} onChange={e=>set('duration',e.target.value)}/></label><label>Precio S/<input type="number" min="0" value={form.price} onChange={e=>set('price',e.target.value)}/></label></div><label>Resumen<textarea value={form.summary} onChange={e=>set('summary',e.target.value)}/></label><label>Requisitos<input value={form.requirements} onChange={e=>set('requirements',e.target.value)}/></label><div className="campusFormGrid"><label>Módulo<input value={form.moduleTitle} onChange={e=>set('moduleTitle',e.target.value)}/></label><label>Lección 1<input value={form.lesson1} onChange={e=>set('lesson1',e.target.value)}/></label><label>Lección 2<input value={form.lesson2} onChange={e=>set('lesson2',e.target.value)}/></label><label className="commerceCheck"><input type="checkbox" checked={form.certificate} onChange={e=>set('certificate',e.target.checked)}/> Emitir certificado</label></div><button className="primary wide" onClick={submit}>Guardar curso</button></div></div>;
}

function CreateAssignmentModal({ courses, onClose, onRefresh, onToast }) {
  const [courseId,setCourseId]=useState(courses[0]?.id||'');
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [dueAt,setDueAt]=useState('');
  const submit=()=>{try{createLocalAssignment(courseId,{title,description,dueAt});onRefresh();onToast('Tarea publicada para los estudiantes inscritos.');onClose();}catch(error){onToast(error.message);}};
  return <div className="modalBackdrop"><div className="formModal"><button className="modalClose" onClick={onClose}><X size={20}/></button><h2>Nueva tarea</h2><label>Curso<select value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(course=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Título<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Descripción<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Fecha límite<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label><button className="primary wide" onClick={submit}>Publicar tarea</button></div></div>;
}

export default function Campus(){
  const { profile }=useApp();
  const [snapshot,setSnapshot]=useState(getLocalCampusSnapshot);
  const [tab,setTab]=useState('catalog');
  const [category,setCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [level,setLevel]=useState('all');
  const [selected,setSelected]=useState(null);
  const [lesson,setLesson]=useState(null);
  const [quizCourse,setQuizCourse]=useState(null);
  const [assignment,setAssignment]=useState(null);
  const [createCourseOpen,setCreateCourseOpen]=useState(false);
  const [createAssignmentOpen,setCreateAssignmentOpen]=useState(false);
  const [toast,setToast]=useState('');
  const refresh=()=>setSnapshot(getLocalCampusSnapshot());
  useEffect(()=>{refresh();return subscribeLocalCampus(refresh);},[profile.id]);
  const notify=text=>{setToast(text);window.setTimeout(()=>setToast(''),2800);};
  const tabs=[{id:'catalog',label:'Cursos',icon:'📚'},{id:'learning',label:'Mi aprendizaje',icon:'▶️'},{id:'assignments',label:'Tareas',icon:'📝'},{id:'certificates',label:'Certificados',icon:'🏅'},...(snapshot.canTeach?[{id:'instructor',label:'Profesor',icon:'👩‍🏫'}]:[])];
  const courses=useMemo(()=>snapshot.courses.filter(c=>category==='all'||c.category===category).filter(c=>level==='all'||c.level.toLowerCase().includes(level)).filter(c=>`${c.title} ${c.summary} ${c.instructor_name}`.toLowerCase().includes(query.toLowerCase())),[snapshot,category,level,query]);
  const favorite=(id)=>{toggleLocalCourseFavorite(id);refresh();};
  const openLesson=(course,row)=>setLesson({course,row});
  const activeSelected=selected?snapshot.courses.find(item=>item.id===selected.id)||selected:null;
  const teachers=useMemo(()=>Array.from(new Map(snapshot.courses.map(course=>[course.instructor_id,{id:course.instructor_id,name:course.instructor_name,courses:snapshot.courses.filter(item=>item.instructor_id===course.instructor_id).length,verified:snapshot.courses.some(item=>item.instructor_id===course.instructor_id&&item.verified)}])).values()),[snapshot]);

  return <div className="page campusPage campusV18">
    <section className="campusHero"><div><p className="eyebrow">Etapa 18 · aprendizaje multiusuario local</p><h1>CampusHugo dentro de MiZona</h1><p>Cursos, avance, evaluaciones, tareas, certificados y herramientas para profesores, compartidos entre perfiles y pestañas de este navegador.</p><div className="heroActions"><button className="primary" onClick={()=>setTab('learning')}><PlayCircle size={17}/> Continuar aprendiendo</button><button className="secondary" onClick={()=>setTab('certificates')}><Award size={17}/> Mis certificados</button></div></div><div className="campusHeroStats"><span><b>{snapshot.activeCourseCount}</b> cursos activos</span><span><b>{snapshot.totalEnrollments}</b> inscripciones</span><span><b>{snapshot.myCertificates.length}</b> certificados tuyos</span></div></section>
    <Tabs tabs={tabs} active={tab} setActive={setTab}/>

    {tab==='catalog'&&<><section className="campusControls"><div className="businessSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca Excel, IA, Power BI, matemática..."/></div><select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">Todos los niveles</option><option value="básico">Básico</option><option value="inicial">Inicial</option><option value="intermedio">Intermedio</option><option value="secundaria">Secundaria</option><option value="emprendedor">Emprendedor</option></select><button className="secondary" onClick={()=>notify(`Tienes ${snapshot.favoriteIds.length} curso(s) guardado(s)`)}><Heart size={17}/> Guardados ({snapshot.favoriteIds.length})</button></section><div className="categoryRail">{categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}><span>{c.icon}</span>{c.label}</button>)}</div><div className="campusLayout"><section><div className="sectionTitle"><h2>Formación disponible</h2><p>Los avances y favoritos pertenecen al perfil activo: <b>@{profile.username}</b>.</p></div><div className="courseGrid">{courses.map(course=><CourseCard key={course.id} course={course} onFavorite={favorite} onOpen={setSelected}/>)}</div>{!courses.length&&<div className="emptyState">No encontramos cursos con esos filtros.</div>}</section><aside className="campusSide"><Card title="Tu meta semanal" icon={<Target size={18}/>}><div className="weeklyGoal"><b>3 lecciones esta semana</b><div className="progressTrack"><i style={{width:'66%'}}/></div><span>Completa una lección más para llegar a tu meta.</span></div></Card><Card title="Ruta recomendada" icon={<Map size={18}/>}><ol className="routeList"><li>Excel básico <span>Ahora</span></li><li>Power BI <span>Siguiente</span></li><li>Dashboards <span>Después</span></li></ol></Card><Card title="Profesores" icon={<GraduationCap size={18}/>}><div className="campusMiniTeacherList">{teachers.map(row=><span key={row.id}><b>{row.name}</b><small>{row.courses} curso(s) {row.verified?'· verificado':''}</small></span>)}</div></Card></aside></div></>}

    {tab==='learning'&&<><div className="sectionTitle"><h2>Mi aprendizaje</h2><p>El avance se guarda de forma independiente para cada perfil local.</p></div><div className="learningGrid">{snapshot.myCourses.map(course=><article className="learningCard" key={course.id}><div className="learningIcon">{course.emoji}</div><div><small>{course.level} · {course.instructor_name}</small><h3>{course.title}</h3><div className="courseProgress"><div><span>Progreso</span><b>{course.progress}%</b></div><div className="progressTrack"><i style={{width:`${course.progress}%`}}/></div></div><button className="primary" onClick={()=>setSelected(course)}><PlayCircle size={16}/> Continuar curso</button></div></article>)}{!snapshot.myCourses.length&&<div className="emptyState">Todavía no estás inscrito en ningún curso.</div>}</div><Card title="Logros" icon={<Trophy size={18}/>}><div className="achievementList"><span>🔥 Perfil activo: @{profile.username}</span><span>📚 {snapshot.myCourses.length} curso(s) en progreso</span><span>🏅 {snapshot.myCertificates.length} certificado(s) emitido(s)</span></div></Card></>}

    {tab==='assignments'&&<><div className="sectionTitle"><h2>Mis tareas</h2><p>Entrega actividades y revisa la calificación del profesor.</p></div><div className="campusAssignmentGrid">{snapshot.myAssignments.map(item=><article key={item.id} className="campusAssignmentCard"><div><span>{item.course?.emoji||'📝'}</span><div><small>{item.course?.title}</small><h3>{item.title}</h3><p>{item.description}</p></div></div><div className="campusAssignmentMeta"><span><CalendarDays size={15}/> {item.due_at?new Date(item.due_at).toLocaleString('es-PE'):'Sin fecha límite'}</span><b className={item.submission?.status==='reviewed'?'reviewed':item.submission?'submitted':'pending'}>{item.submission?.status==='reviewed'?`Calificado ${item.submission.score}/100`:item.submission?'Entregado':'Pendiente'}</b></div>{item.submission?.feedback&&<p className="campusFeedback">Comentario: {item.submission.feedback}</p>}<button className="primary" onClick={()=>setAssignment(item)}>{item.submission?'Actualizar entrega':'Entregar tarea'}</button></article>)}{!snapshot.myAssignments.length&&<div className="emptyState">No tienes tareas activas.</div>}</div></>}

    {tab==='certificates'&&<div className="certificateArea"><div className="sectionTitle"><h2>Certificados verificables</h2><p>Cada certificado pertenece al perfil activo y tiene un código único.</p></div><div className="certificateGrid">{snapshot.myCertificates.map(cert=><article className="certificateCard" key={cert.id}><div className="certificateSeal"><Award size={31}/></div><div><small>CampusHugo · MiZona</small><h3>{cert.title}</h3><span>Emitido: {new Date(cert.issued_at).toLocaleDateString('es-PE')}</span><span>Puntaje: {cert.score}%</span><code>{cert.code}</code></div><button className="secondary" onClick={()=>window.print()}><Download size={16}/> Imprimir</button></article>)}{!snapshot.myCertificates.length&&<div className="emptyState">Completa un curso y aprueba su evaluación para obtener un certificado.</div>}</div><Card title="Verificación" icon={<Lock size={18}/>}><p className="muted">En esta etapa el código se valida dentro de este navegador. Cuando vuelva el backend, podrá consultarse públicamente desde una página de verificación.</p></Card></div>}

    {tab==='instructor'&&<><div className="campusInstructorHeader"><div><h2>Panel del profesor</h2><p>Administra cursos, tareas y entregas dentro del laboratorio local.</p></div><div><button className="secondary" onClick={()=>setCreateAssignmentOpen(true)} disabled={!snapshot.instructorCourses.length}><Plus size={16}/> Nueva tarea</button><button className="primary" onClick={()=>setCreateCourseOpen(true)}><Plus size={16}/> Crear curso</button></div></div><div className="adminKpis"><span><b>{snapshot.instructorCourses.length}</b> cursos propios</span><span><b>{snapshot.instructorAssignments.length}</b> tareas</span><span><b>{snapshot.pendingSubmissions.length}</b> entregas pendientes</span><span><b>{snapshot.instructorCourses.reduce((sum,item)=>sum+item.students,0)}</b> estudiantes</span></div><div className="grid2"><Card title="Mis cursos" icon={<GraduationCap size={18}/>}><div className="campusInstructorList">{snapshot.instructorCourses.map(course=><article key={course.id}><span>{course.emoji}</span><div><b>{course.title}</b><small>{course.status} · {course.students} estudiantes · {course.progress||0}% de tu perfil</small></div><button onClick={()=>setSelected(course)}>Abrir</button></article>)}{!snapshot.instructorCourses.length&&<p className="muted">Todavía no has creado cursos.</p>}</div></Card><Card title="Entregas por revisar" icon={<PenLine size={18}/>}><div className="campusSubmissionList">{snapshot.pendingSubmissions.map(sub=>{const assignmentRow=snapshot.assignments.find(item=>item.id===sub.assignment_id);return <SubmissionReview key={sub.id} submission={sub} assignment={assignmentRow} onRefresh={refresh} onToast={notify}/>})}{!snapshot.pendingSubmissions.length&&<p className="muted">No hay entregas pendientes.</p>}</div></Card></div></>}

    {activeSelected&&<CourseModal course={activeSelected} snapshot={snapshot} onClose={()=>setSelected(null)} onRefresh={refresh} onLesson={openLesson} onQuiz={setQuizCourse} onToast={notify}/>} 
    {lesson&&<LessonModal course={lesson.course} lesson={lesson.row} onClose={()=>setLesson(null)} onRefresh={refresh} onToast={notify}/>} 
    {quizCourse&&<QuizModal course={quizCourse} onClose={()=>setQuizCourse(null)} onRefresh={refresh} onToast={notify}/>} 
    {assignment&&<AssignmentModal assignment={assignment} onClose={()=>setAssignment(null)} onRefresh={refresh} onToast={notify}/>} 
    {createCourseOpen&&<CreateCourseModal onClose={()=>setCreateCourseOpen(false)} onRefresh={refresh} onToast={notify}/>} 
    {createAssignmentOpen&&<CreateAssignmentModal courses={snapshot.instructorCourses} onClose={()=>setCreateAssignmentOpen(false)} onRefresh={refresh} onToast={notify}/>} 
    {toast&&<div className="toastSuccess"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

function SubmissionReview({submission,assignment,onRefresh,onToast}){
  const [score,setScore]=useState(80);
  const [feedback,setFeedback]=useState('Buen trabajo.');
  const submit=()=>{try{reviewLocalSubmission(submission.id,{score,feedback});onRefresh();onToast('Entrega calificada.');}catch(error){onToast(error.message);}};
  return <article><div><b>{assignment?.title||'Tarea'}</b><small>{submission.file_name||'Sin archivo'} · {new Date(submission.submitted_at).toLocaleString('es-PE')}</small></div><div className="campusSubmissionControls"><input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)}/><input value={feedback} onChange={e=>setFeedback(e.target.value)}/><button onClick={submit}>Calificar</button></div></article>;
}
