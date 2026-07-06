import {
  getActiveLocalProfile,
  getActiveLocalProfileId,
  mutateLocalState,
  readLocalState
} from './localStore';

const STATE_KEY = 'mizona-v8-local-campus-v18';
const CHANGE_EVENT = 'mizona:local-campus-change';
const CHANNEL_NAME = 'mizona-v8-campus-v18';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const nowIso = () => new Date().toISOString();
const now = Date.now();
const iso = value => new Date(value).toISOString();

const seedCourses = [
  {
    id: 'course-excel-zero', category: 'excel', title: 'Excel desde cero', emoji: '📊', level: 'Básico',
    instructor_id: 'local-teacher', instructor_name: 'Profesora Ana', duration: '8 h 30 min',
    price: 0, rating: 4.9, verified: true, status: 'active', summary: 'Aprende fórmulas, tablas, filtros y gráficos con ejercicios prácticos.',
    requirements: 'No necesitas experiencia previa.', certificate: true, featured: true,
    modules: [
      { id: 'excel-m1', title: 'Conociendo Excel', lessons: [
        { id: 'excel-l1', title: 'Interfaz, libros y hojas', minutes: 18, type: 'video', resource: 'Guía de inicio.pdf' },
        { id: 'excel-l2', title: 'Filas, columnas y celdas', minutes: 22, type: 'interactive', resource: 'Ejercicio_celdas.xlsx' },
        { id: 'excel-l3', title: 'Guardar y compartir', minutes: 15, type: 'video', resource: 'Checklist.pdf' }
      ]},
      { id: 'excel-m2', title: 'Fórmulas esenciales', lessons: [
        { id: 'excel-l4', title: 'SUMA y PROMEDIO', minutes: 25, type: 'interactive', resource: 'Practica_formulas.xlsx' },
        { id: 'excel-l5', title: 'SI y condiciones', minutes: 28, type: 'interactive', resource: 'Ejercicios_SI.xlsx' },
        { id: 'excel-l6', title: 'Referencias absolutas', minutes: 20, type: 'video', resource: 'Referencias.pdf' }
      ]},
      { id: 'excel-m3', title: 'Trabajar con datos', lessons: [
        { id: 'excel-l7', title: 'Ordenar y filtrar', minutes: 24, type: 'interactive', resource: 'Base_clientes.xlsx' },
        { id: 'excel-l8', title: 'Tablas', minutes: 26, type: 'video', resource: 'Tabla_ventas.xlsx' },
        { id: 'excel-l9', title: 'Evaluación final', minutes: 20, type: 'quiz', resource: null }
      ]}
    ],
    quiz: [
      { id: 'q1', question: '¿Qué símbolo inicia una fórmula en Excel?', options: ['#', '=', '@', '&'], answer: 1 },
      { id: 'q2', question: '¿Qué función calcula el promedio?', options: ['SUMA', 'CONTAR', 'PROMEDIO', 'MAX'], answer: 2 },
      { id: 'q3', question: '¿Qué herramienta permite mostrar solo ciertos registros?', options: ['Filtro', 'Formato', 'Comentario', 'Zoom'], answer: 0 }
    ],
    created_at: iso(now - 60 * 86400000), updated_at: iso(now - 2 * 86400000)
  },
  {
    id: 'course-powerbi', category: 'powerbi', title: 'Power BI para principiantes', emoji: '📈', level: 'Básico',
    instructor_id: 'local-user-jose', instructor_name: 'José Hugo', duration: '10 h', price: 29, rating: 4.8,
    verified: true, status: 'active', summary: 'Transforma información en reportes visuales y dashboards claros.', requirements: 'Excel básico recomendado.', certificate: true, featured: true,
    modules: [
      { id: 'pbi-m1', title: 'Primer reporte', lessons: [
        { id: 'pbi-l1', title: 'Conocer Power BI', minutes: 20, type: 'video', resource: 'Introduccion_PowerBI.pdf' },
        { id: 'pbi-l2', title: 'Importar Excel', minutes: 28, type: 'interactive', resource: 'Ventas_demo.xlsx' },
        { id: 'pbi-l3', title: 'Visualizaciones', minutes: 35, type: 'interactive', resource: 'Reporte_inicial.pbix' }
      ]},
      { id: 'pbi-m2', title: 'Power Query', lessons: [
        { id: 'pbi-l4', title: 'Limpiar datos', minutes: 32, type: 'video', resource: 'Datos_sucios.xlsx' },
        { id: 'pbi-l5', title: 'Cambiar tipos', minutes: 22, type: 'interactive', resource: 'Tipos_datos.xlsx' },
        { id: 'pbi-l6', title: 'Combinar consultas', minutes: 30, type: 'interactive', resource: 'Consultas.xlsx' }
      ]},
      { id: 'pbi-m3', title: 'Dashboard final', lessons: [
        { id: 'pbi-l7', title: 'Medidas iniciales', minutes: 35, type: 'video', resource: 'Medidas_DAX.pdf' },
        { id: 'pbi-l8', title: 'Diseño del panel', minutes: 30, type: 'interactive', resource: 'Plantilla_dashboard.pptx' },
        { id: 'pbi-l9', title: 'Evaluación final', minutes: 20, type: 'quiz', resource: null }
      ]}
    ],
    quiz: [
      { id: 'q1', question: '¿Qué herramienta transforma datos antes de cargarlos?', options: ['Power Query', 'PowerPoint', 'Word', 'Paint'], answer: 0 },
      { id: 'q2', question: '¿Qué archivo suele contener un reporte de Power BI Desktop?', options: ['.xlsx', '.pbix', '.docx', '.jpg'], answer: 1 },
      { id: 'q3', question: '¿Para qué se usa una visualización?', options: ['Para borrar datos', 'Para representar información', 'Para instalar Windows', 'Para enviar correos'], answer: 1 }
    ],
    created_at: iso(now - 45 * 86400000), updated_at: iso(now - 3 * 86400000)
  },
  {
    id: 'course-ai-daily', category: 'ai', title: 'IA útil para la vida diaria', emoji: '🤖', level: 'Inicial',
    instructor_id: 'local-maria', instructor_name: 'María Torres', duration: '4 h 20 min', price: 0, rating: 4.9,
    verified: true, status: 'active', summary: 'Aprende a pedir mejores respuestas, resumir, crear ideas y trabajar con seguridad.', requirements: 'Celular o computadora con internet.', certificate: true, featured: true,
    modules: [
      { id: 'ai-m1', title: 'Empezar con IA', lessons: [
        { id: 'ai-l1', title: 'Qué puede hacer', minutes: 18, type: 'video', resource: 'Guia_IA.pdf' },
        { id: 'ai-l2', title: 'Cómo escribir instrucciones', minutes: 24, type: 'interactive', resource: 'Prompts_practicos.docx' },
        { id: 'ai-l3', title: 'Verificar respuestas', minutes: 20, type: 'video', resource: 'Lista_verificacion.pdf' }
      ]},
      { id: 'ai-m2', title: 'Productividad', lessons: [
        { id: 'ai-l4', title: 'Correos y documentos', minutes: 24, type: 'interactive', resource: 'Ejercicios_IA.docx' },
        { id: 'ai-l5', title: 'Estudio y aprendizaje', minutes: 24, type: 'video', resource: 'Plan_estudio.pdf' },
        { id: 'ai-l6', title: 'Evaluación final', minutes: 15, type: 'quiz', resource: null }
      ]}
    ],
    quiz: [
      { id: 'q1', question: '¿Qué debes hacer con una respuesta importante de IA?', options: ['Copiarla sin revisar', 'Verificarla', 'Borrarla', 'Publicarla siempre'], answer: 1 },
      { id: 'q2', question: '¿Qué información no debes compartir?', options: ['Tu comida favorita', 'Contraseñas', 'Un título', 'Una idea general'], answer: 1 },
      { id: 'q3', question: 'Una buena instrucción debe ser:', options: ['Clara y específica', 'Confusa', 'Vacía', 'Solo una palabra'], answer: 0 }
    ],
    created_at: iso(now - 35 * 86400000), updated_at: iso(now - 86400000)
  },
  {
    id: 'course-math-school', category: 'school', title: 'Matemática práctica secundaria', emoji: '🧮', level: 'Secundaria',
    instructor_id: 'local-teacher', instructor_name: 'Profesora Ana', duration: '7 h', price: 15, rating: 4.7,
    verified: true, status: 'active', summary: 'Refuerzo con ejemplos cotidianos, ejercicios guiados y evaluaciones cortas.', requirements: 'Cuaderno y calculadora básica.', certificate: true, featured: false,
    modules: [
      { id: 'math-m1', title: 'Números y operaciones', lessons: [
        { id: 'math-l1', title: 'Fracciones', minutes: 25, type: 'interactive', resource: 'Fracciones.pdf' },
        { id: 'math-l2', title: 'Porcentajes', minutes: 25, type: 'interactive', resource: 'Porcentajes.pdf' },
        { id: 'math-l3', title: 'Proporciones', minutes: 25, type: 'video', resource: 'Proporciones.pdf' }
      ]},
      { id: 'math-m2', title: 'Álgebra', lessons: [
        { id: 'math-l4', title: 'Expresiones', minutes: 28, type: 'video', resource: 'Algebra.pdf' },
        { id: 'math-l5', title: 'Ecuaciones', minutes: 30, type: 'interactive', resource: 'Ecuaciones.pdf' },
        { id: 'math-l6', title: 'Evaluación final', minutes: 20, type: 'quiz', resource: null }
      ]}
    ],
    quiz: [
      { id: 'q1', question: '¿Cuánto es 25% de 200?', options: ['25', '40', '50', '75'], answer: 2 },
      { id: 'q2', question: 'Si x + 3 = 8, x es:', options: ['3', '4', '5', '8'], answer: 2 },
      { id: 'q3', question: 'Una fracción equivalente a 1/2 es:', options: ['2/4', '1/3', '3/5', '4/5'], answer: 0 }
    ],
    created_at: iso(now - 20 * 86400000), updated_at: iso(now - 5 * 86400000)
  },
  {
    id: 'course-sales-local', category: 'business', title: 'Vende más en tu zona', emoji: '🏪', level: 'Emprendedor',
    instructor_id: 'local-maria', instructor_name: 'María Torres', duration: '5 h 10 min', price: 19, rating: 4.8,
    verified: false, status: 'pending', summary: 'Promociones, atención al cliente, precios y campañas locales medibles.', requirements: 'Tener una idea de negocio o emprendimiento.', certificate: true, featured: false,
    modules: [
      { id: 'sales-m1', title: 'Conoce a tu cliente', lessons: [
        { id: 'sales-l1', title: 'Necesidades de la zona', minutes: 22, type: 'video', resource: 'Cliente_local.pdf' },
        { id: 'sales-l2', title: 'Perfil del cliente', minutes: 25, type: 'interactive', resource: 'Perfil_cliente.docx' },
        { id: 'sales-l3', title: 'Competencia', minutes: 22, type: 'video', resource: 'Competencia.pdf' }
      ]},
      { id: 'sales-m2', title: 'Oferta atractiva', lessons: [
        { id: 'sales-l4', title: 'Precio y valor', minutes: 28, type: 'interactive', resource: 'Precios.xlsx' },
        { id: 'sales-l5', title: 'Promoción útil', minutes: 24, type: 'video', resource: 'Promociones.pdf' },
        { id: 'sales-l6', title: 'Evaluación final', minutes: 15, type: 'quiz', resource: null }
      ]}
    ],
    quiz: [
      { id: 'q1', question: 'Una buena promoción debe:', options: ['Resolver una necesidad', 'Confundir', 'Ocultar el precio', 'No tener vigencia'], answer: 0 },
      { id: 'q2', question: 'El valor para el cliente incluye:', options: ['Solo costo', 'Beneficios y solución', 'Solo logo', 'Nada'], answer: 1 },
      { id: 'q3', question: '¿Qué ayuda a medir una campaña?', options: ['Cupones o códigos', 'Adivinar', 'No registrar ventas', 'Cambiar de nombre'], answer: 0 }
    ],
    created_at: iso(now - 2 * 86400000), updated_at: iso(now - 2 * 3600000)
  }
];

function allLessons(course) {
  return (course?.modules || []).flatMap(module => module.lessons || []);
}

function seedState() {
  return {
    version: 18,
    courses: clone(seedCourses),
    enrollments: [
      { id: 'enroll-jose-excel', user_id: 'local-user-jose', course_id: 'course-excel-zero', status: 'active', enrolled_at: iso(now - 12 * 86400000), completed_at: null },
      { id: 'enroll-jose-ai', user_id: 'local-user-jose', course_id: 'course-ai-daily', status: 'active', enrolled_at: iso(now - 8 * 86400000), completed_at: null },
      { id: 'enroll-ian-math', user_id: 'local-ian', course_id: 'course-math-school', status: 'active', enrolled_at: iso(now - 6 * 86400000), completed_at: null }
    ],
    favorites: [
      { id: 'camp-fav-jose-pbi', user_id: 'local-user-jose', course_id: 'course-powerbi', created_at: iso(now - 4 * 86400000) }
    ],
    progress: [
      { id: 'prog-jose-excel-1', user_id: 'local-user-jose', course_id: 'course-excel-zero', lesson_id: 'excel-l1', completed: true, completed_at: iso(now - 10 * 86400000) },
      { id: 'prog-jose-excel-2', user_id: 'local-user-jose', course_id: 'course-excel-zero', lesson_id: 'excel-l2', completed: true, completed_at: iso(now - 9 * 86400000) },
      { id: 'prog-jose-excel-3', user_id: 'local-user-jose', course_id: 'course-excel-zero', lesson_id: 'excel-l3', completed: true, completed_at: iso(now - 8 * 86400000) },
      { id: 'prog-jose-ai-1', user_id: 'local-user-jose', course_id: 'course-ai-daily', lesson_id: 'ai-l1', completed: true, completed_at: iso(now - 7 * 86400000) },
      { id: 'prog-jose-ai-2', user_id: 'local-user-jose', course_id: 'course-ai-daily', lesson_id: 'ai-l2', completed: true, completed_at: iso(now - 6 * 86400000) },
      { id: 'prog-jose-ai-3', user_id: 'local-user-jose', course_id: 'course-ai-daily', lesson_id: 'ai-l3', completed: true, completed_at: iso(now - 5 * 86400000) },
      { id: 'prog-jose-ai-4', user_id: 'local-user-jose', course_id: 'course-ai-daily', lesson_id: 'ai-l4', completed: true, completed_at: iso(now - 4 * 86400000) }
    ],
    quizAttempts: [],
    certificates: [
      { id: 'cert-demo-security', user_id: 'local-user-jose', course_id: 'course-ai-daily', title: 'Seguridad digital básica', code: 'MZ-SD-1831', score: 100, issued_at: iso(now - 30 * 86400000), status: 'valid' }
    ],
    assignments: [
      { id: 'assign-excel-1', course_id: 'course-excel-zero', title: 'Presupuesto familiar', description: 'Crea una tabla con ingresos, gastos, total y saldo usando fórmulas.', due_at: iso(now + 5 * 86400000), created_by: 'local-teacher', status: 'active', created_at: iso(now - 2 * 86400000) },
      { id: 'assign-math-1', course_id: 'course-math-school', title: 'Porcentajes en compras', description: 'Resuelve cinco situaciones de descuentos y aumentos porcentuales.', due_at: iso(now + 3 * 86400000), created_by: 'local-teacher', status: 'active', created_at: iso(now - 86400000) }
    ],
    submissions: [
      { id: 'sub-ian-math', assignment_id: 'assign-math-1', user_id: 'local-ian', text: 'Resolví los ejercicios en mi cuaderno y adjunto el resumen.', file_name: 'porcentajes_ian.pdf', status: 'submitted', score: null, feedback: '', submitted_at: iso(now - 3 * 3600000), reviewed_at: null }
    ],
    reports: [],
    updated_at: nowIso()
  };
}

function migrateState(state) {
  const next = state && typeof state === 'object' ? state : seedState();
  next.version = 18;
  next.courses = Array.isArray(next.courses) ? next.courses : clone(seedCourses);
  next.enrollments = Array.isArray(next.enrollments) ? next.enrollments : [];
  next.favorites = Array.isArray(next.favorites) ? next.favorites : [];
  next.progress = Array.isArray(next.progress) ? next.progress : [];
  next.quizAttempts = Array.isArray(next.quizAttempts) ? next.quizAttempts : [];
  next.certificates = Array.isArray(next.certificates) ? next.certificates : [];
  next.assignments = Array.isArray(next.assignments) ? next.assignments : [];
  next.submissions = Array.isArray(next.submissions) ? next.submissions : [];
  next.reports = Array.isArray(next.reports) ? next.reports : [];
  next.updated_at = next.updated_at || nowIso();
  return next;
}

export function readLocalCampusState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    const migrated = migrateState(parsed);
    if (!parsed) localStorage.setItem(STATE_KEY, JSON.stringify(migrated));
    return clone(migrated);
  } catch {
    const fresh = seedState();
    localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    return clone(fresh);
  }
}

function writeState(next, reason = 'campus-update') {
  const state = migrateState(next);
  state.updated_at = nowIso();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason, updated_at: state.updated_at } }));
  channel?.postMessage({ reason, updated_at: state.updated_at });
  return clone(state);
}

function mutateState(mutator, reason) {
  const state = readLocalCampusState();
  mutator(state);
  return writeState(state, reason);
}

export function subscribeLocalCampus(callback) {
  const handler = () => callback(readLocalCampusState());
  const storageHandler = event => { if (event.key === STATE_KEY) handler(); };
  const channelHandler = () => handler();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  channel?.addEventListener('message', channelHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
    channel?.removeEventListener('message', channelHandler);
  };
}

function isAdmin(profile = getActiveLocalProfile()) {
  return ['admin', 'super_admin'].includes(profile?.role);
}

function canTeach(profile = getActiveLocalProfile()) {
  return isAdmin(profile) || profile?.schoolRole === 'teacher' || profile?.schoolRole === 'assistant';
}

function adminIds() {
  return (readLocalState().directory || []).filter(item => ['admin', 'super_admin'].includes(item.role) && item.status === 'active').map(item => item.id);
}

function addAudit(action, entityType, entityId, detail = '', payload = {}) {
  const profile = getActiveLocalProfile();
  mutateLocalState(draft => {
    draft.auditLogs = Array.isArray(draft.auditLogs) ? draft.auditLogs : [];
    draft.syncQueue = Array.isArray(draft.syncQueue) ? draft.syncQueue : [];
    draft.auditLogs.unshift({ id: uid('audit-campus'), actor_id: profile.id, action, entity_type: entityType, entity_id: entityId, detail, created_at: nowIso() });
    draft.syncQueue.unshift({ id: uid('sync-campus'), actor_id: profile.id, action, entity_type: entityType, entity_id: entityId, payload, status: 'local_only', created_at: nowIso() });
  }, `campus-${action}`);
}

function notifyUsers(userIds, { title, body, page = 'campus', type = 'course' }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return;
  mutateLocalState(draft => {
    draft.notifications = Array.isArray(draft.notifications) ? draft.notifications : [];
    ids.forEach(userId => draft.notifications.unshift({ id: uid('not-campus'), user_id: userId, type, title, body, page, read: false, created_at: nowIso() }));
  }, 'campus-notification');
}

function profileName(id) {
  const row = (readLocalState().directory || []).find(item => item.id === id);
  return row?.display_name || row?.username || 'Usuario';
}

function courseProgress(state, userId, course) {
  const lessons = allLessons(course);
  if (!lessons.length) return 0;
  const completed = new Set(state.progress.filter(item => item.user_id === userId && item.course_id === course.id && item.completed).map(item => item.lesson_id));
  return Math.round((lessons.filter(item => completed.has(item.id)).length / lessons.length) * 100);
}

function studentCount(state, courseId) {
  return state.enrollments.filter(item => item.course_id === courseId && item.status === 'active').length;
}

export function getLocalCampusSnapshot() {
  const state = readLocalCampusState();
  const profile = getActiveLocalProfile();
  const userId = profile.id;
  const visibleCourses = state.courses.filter(course => course.status === 'active' || course.instructor_id === userId || isAdmin(profile));
  const courses = visibleCourses.map(course => ({
    ...course,
    students: studentCount(state, course.id),
    progress: courseProgress(state, userId, course),
    enrolled: state.enrollments.some(item => item.user_id === userId && item.course_id === course.id && item.status === 'active'),
    favorite: state.favorites.some(item => item.user_id === userId && item.course_id === course.id)
  }));
  const enrollments = state.enrollments.filter(item => item.user_id === userId && item.status === 'active');
  const myCourses = courses.filter(course => enrollments.some(item => item.course_id === course.id));
  const myCertificates = state.certificates.filter(item => item.user_id === userId && item.status === 'valid');
  const myAssignments = state.assignments
    .filter(item => item.status === 'active' && enrollments.some(en => en.course_id === item.course_id))
    .map(item => ({ ...item, course: state.courses.find(course => course.id === item.course_id), submission: state.submissions.find(sub => sub.assignment_id === item.id && sub.user_id === userId) || null }));
  const instructorCourses = courses.filter(course => course.instructor_id === userId);
  const instructorAssignments = state.assignments.filter(item => instructorCourses.some(course => course.id === item.course_id));
  const pendingSubmissions = state.submissions.filter(sub => instructorAssignments.some(item => item.id === sub.assignment_id) && sub.status === 'submitted');
  return {
    ...state,
    profile,
    canTeach: canTeach(profile),
    courses,
    myCourses,
    myCertificates,
    myAssignments,
    instructorCourses,
    instructorAssignments,
    pendingSubmissions,
    favoriteIds: state.favorites.filter(item => item.user_id === userId).map(item => item.course_id),
    pendingCourseCount: state.courses.filter(item => item.status === 'pending').length,
    activeCourseCount: state.courses.filter(item => item.status === 'active').length,
    totalEnrollments: state.enrollments.filter(item => item.status === 'active').length,
    pendingReportCount: state.reports.filter(item => item.status === 'pending').length
  };
}

export function toggleLocalCourseFavorite(courseId) {
  const userId = getActiveLocalProfileId();
  mutateState(state => {
    const index = state.favorites.findIndex(item => item.user_id === userId && item.course_id === courseId);
    if (index >= 0) state.favorites.splice(index, 1);
    else state.favorites.unshift({ id: uid('camp-fav'), user_id: userId, course_id: courseId, created_at: nowIso() });
  }, 'course-favorite');
  return true;
}

export function enrollLocalCourse(courseId) {
  const profile = getActiveLocalProfile();
  let courseTitle = 'Curso';
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course || course.status !== 'active') throw new Error('Este curso no está disponible para inscripción.');
    courseTitle = course.title;
    const existing = state.enrollments.find(item => item.user_id === profile.id && item.course_id === courseId);
    if (existing) {
      existing.status = 'active';
      existing.enrolled_at = existing.enrolled_at || nowIso();
    } else {
      state.enrollments.unshift({ id: uid('enroll'), user_id: profile.id, course_id: courseId, status: 'active', enrolled_at: nowIso(), completed_at: null });
    }
  }, 'course-enroll');
  addAudit('course_enroll', 'course', courseId, courseTitle);
  notifyUsers([profile.id], { title: 'Inscripción confirmada', body: `Ya puedes comenzar ${courseTitle}.` });
  return true;
}

export function completeLocalLesson(courseId, lessonId, completed = true) {
  const userId = getActiveLocalProfileId();
  let progress = 0;
  let courseTitle = 'Curso';
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');
    courseTitle = course.title;
    if (!state.enrollments.some(item => item.user_id === userId && item.course_id === courseId && item.status === 'active')) throw new Error('Debes inscribirte antes de avanzar.');
    const lesson = allLessons(course).find(item => item.id === lessonId);
    if (!lesson) throw new Error('Lección no encontrada.');
    let row = state.progress.find(item => item.user_id === userId && item.course_id === courseId && item.lesson_id === lessonId);
    if (!row) {
      row = { id: uid('progress'), user_id: userId, course_id: courseId, lesson_id: lessonId, completed: Boolean(completed), completed_at: completed ? nowIso() : null };
      state.progress.push(row);
    } else {
      row.completed = Boolean(completed);
      row.completed_at = completed ? nowIso() : null;
    }
    progress = courseProgress(state, userId, course);
  }, 'lesson-progress');
  addAudit('lesson_progress', 'course_lesson', lessonId, `${courseTitle}: ${progress}%`);
  return progress;
}

export function submitLocalQuiz(courseId, answers = {}) {
  const userId = getActiveLocalProfileId();
  let result = null;
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');
    const quiz = course.quiz || [];
    if (!quiz.length) throw new Error('Este curso no tiene evaluación.');
    const correct = quiz.filter(question => Number(answers[question.id]) === Number(question.answer)).length;
    const score = Math.round((correct / quiz.length) * 100);
    const passed = score >= 70;
    result = { score, correct, total: quiz.length, passed };
    state.quizAttempts.unshift({ id: uid('quiz'), user_id: userId, course_id: courseId, score, correct, total: quiz.length, passed, attempted_at: nowIso() });
    if (passed) {
      const quizLessons = allLessons(course).filter(lesson => lesson.type === 'quiz');
      quizLessons.forEach(lesson => {
        let row = state.progress.find(item => item.user_id === userId && item.course_id === courseId && item.lesson_id === lesson.id);
        if (!row) state.progress.push({ id: uid('progress'), user_id: userId, course_id: courseId, lesson_id: lesson.id, completed: true, completed_at: nowIso() });
        else { row.completed = true; row.completed_at = nowIso(); }
      });
    }
  }, 'quiz-submit');
  addAudit('quiz_submit', 'course', courseId, `Puntaje ${result.score}`);
  return result;
}

export function issueLocalCertificate(courseId) {
  const userId = getActiveLocalProfileId();
  let certificate = null;
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course || !course.certificate) throw new Error('Este curso no emite certificado.');
    const progress = courseProgress(state, userId, course);
    const bestAttempt = state.quizAttempts.filter(item => item.user_id === userId && item.course_id === courseId && item.passed).sort((a, b) => b.score - a.score)[0];
    if (progress < 100 || !bestAttempt) throw new Error('Completa todas las lecciones y aprueba la evaluación con al menos 70%.');
    const existing = state.certificates.find(item => item.user_id === userId && item.course_id === courseId && item.status === 'valid');
    if (existing) { certificate = existing; return; }
    const code = `MZ-${course.category.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    certificate = { id: uid('certificate'), user_id: userId, course_id: courseId, title: course.title, code, score: bestAttempt.score, issued_at: nowIso(), status: 'valid' };
    state.certificates.unshift(certificate);
    const enrollment = state.enrollments.find(item => item.user_id === userId && item.course_id === courseId);
    if (enrollment) enrollment.completed_at = nowIso();
  }, 'certificate-issue');
  addAudit('certificate_issue', 'certificate', certificate.id, certificate.code);
  notifyUsers([userId], { title: 'Certificado disponible', body: `Completaste ${certificate.title}. Código ${certificate.code}.` });
  return certificate;
}

export function submitLocalAssignment(assignmentId, { text = '', fileName = '' } = {}) {
  const userId = getActiveLocalProfileId();
  let instructorId = null;
  let title = 'Tarea';
  mutateState(state => {
    const assignment = state.assignments.find(item => item.id === assignmentId && item.status === 'active');
    if (!assignment) throw new Error('La tarea no está disponible.');
    title = assignment.title;
    const course = state.courses.find(item => item.id === assignment.course_id);
    instructorId = course?.instructor_id || null;
    if (!state.enrollments.some(item => item.user_id === userId && item.course_id === assignment.course_id && item.status === 'active')) throw new Error('Debes estar inscrito en el curso.');
    let row = state.submissions.find(item => item.assignment_id === assignmentId && item.user_id === userId);
    const payload = { text: String(text || '').trim(), file_name: String(fileName || '').trim() || null, status: 'submitted', score: null, feedback: '', submitted_at: nowIso(), reviewed_at: null };
    if (row) Object.assign(row, payload);
    else state.submissions.unshift({ id: uid('submission'), assignment_id: assignmentId, user_id: userId, ...payload });
  }, 'assignment-submit');
  addAudit('assignment_submit', 'assignment', assignmentId, title);
  notifyUsers([instructorId], { title: 'Nueva tarea entregada', body: `${profileName(userId)} entregó ${title}.` });
  return true;
}

export function reviewLocalSubmission(submissionId, { score, feedback = '' }) {
  const profile = getActiveLocalProfile();
  if (!canTeach(profile)) throw new Error('Solo profesores o administradores pueden calificar.');
  const numericScore = Math.max(0, Math.min(100, Number(score)));
  let studentId = null;
  let title = 'Tarea';
  mutateState(state => {
    const submission = state.submissions.find(item => item.id === submissionId);
    if (!submission) throw new Error('Entrega no encontrada.');
    const assignment = state.assignments.find(item => item.id === submission.assignment_id);
    const course = state.courses.find(item => item.id === assignment?.course_id);
    if (!isAdmin(profile) && course?.instructor_id !== profile.id) throw new Error('No puedes calificar esta entrega.');
    studentId = submission.user_id;
    title = assignment?.title || title;
    submission.score = numericScore;
    submission.feedback = String(feedback || '').trim();
    submission.status = 'reviewed';
    submission.reviewed_at = nowIso();
    submission.reviewed_by = profile.id;
  }, 'submission-review');
  addAudit('submission_review', 'submission', submissionId, `${numericScore}/100`);
  notifyUsers([studentId], { title: 'Tarea calificada', body: `${title}: ${numericScore}/100.` });
  return true;
}

export function createLocalCourse(values) {
  const profile = getActiveLocalProfile();
  if (!canTeach(profile)) throw new Error('Solo profesores o administradores pueden crear cursos.');
  const title = String(values.title || '').trim();
  if (title.length < 5) throw new Error('El título debe tener al menos 5 caracteres.');
  const lessons = [
    { id: uid('lesson'), title: String(values.lesson1 || 'Introducción').trim(), minutes: 20, type: 'video', resource: null },
    { id: uid('lesson'), title: String(values.lesson2 || 'Práctica guiada').trim(), minutes: 25, type: 'interactive', resource: null },
    { id: uid('lesson'), title: 'Evaluación final', minutes: 15, type: 'quiz', resource: null }
  ];
  const courseId = uid('course');
  const status = isAdmin(profile) ? 'active' : 'pending';
  mutateState(state => {
    state.courses.unshift({
      id: courseId,
      category: values.category || 'school',
      title,
      emoji: String(values.emoji || '📘').slice(0, 3),
      level: String(values.level || 'Básico').trim(),
      instructor_id: profile.id,
      instructor_name: profile.displayName,
      duration: String(values.duration || '2 h').trim(),
      price: Math.max(0, Number(values.price || 0)),
      rating: 0,
      verified: isAdmin(profile),
      status,
      summary: String(values.summary || '').trim(),
      requirements: String(values.requirements || 'Sin requisitos previos.').trim(),
      certificate: Boolean(values.certificate),
      featured: false,
      modules: [{ id: uid('module'), title: String(values.moduleTitle || 'Módulo 1').trim(), lessons }],
      quiz: [
        { id: 'q1', question: 'Pregunta de demostración del curso', options: ['Correcta', 'Opción 2', 'Opción 3', 'Opción 4'], answer: 0 }
      ],
      created_at: nowIso(),
      updated_at: nowIso()
    });
  }, 'course-create');
  addAudit('course_create', 'course', courseId, title, { status });
  if (status === 'pending') notifyUsers(adminIds(), { title: 'Curso pendiente', body: `${profile.displayName} creó ${title}.`, page: 'admin' });
  return courseId;
}

export function createLocalAssignment(courseId, values) {
  const profile = getActiveLocalProfile();
  if (!canTeach(profile)) throw new Error('Solo profesores o administradores pueden crear tareas.');
  const title = String(values.title || '').trim();
  if (title.length < 4) throw new Error('Escribe un título válido.');
  const id = uid('assignment');
  let studentIds = [];
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');
    if (!isAdmin(profile) && course.instructor_id !== profile.id) throw new Error('No puedes crear tareas en este curso.');
    state.assignments.unshift({ id, course_id: courseId, title, description: String(values.description || '').trim(), due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null, created_by: profile.id, status: 'active', created_at: nowIso() });
    studentIds = state.enrollments.filter(item => item.course_id === courseId && item.status === 'active').map(item => item.user_id);
  }, 'assignment-create');
  addAudit('assignment_create', 'assignment', id, title);
  notifyUsers(studentIds, { title: 'Nueva tarea', body: `${title} ya está disponible.`, page: 'campus' });
  return id;
}

export function reviewLocalCourse(courseId, status, verified = null) {
  const profile = getActiveLocalProfile();
  if (!isAdmin(profile)) throw new Error('Solo un administrador puede moderar cursos.');
  let instructorId = null;
  let title = 'Curso';
  mutateState(state => {
    const course = state.courses.find(item => item.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');
    if (!['active', 'pending', 'paused', 'rejected'].includes(status)) throw new Error('Estado inválido.');
    course.status = status;
    if (verified !== null) course.verified = Boolean(verified);
    course.updated_at = nowIso();
    instructorId = course.instructor_id;
    title = course.title;
  }, 'course-review');
  addAudit('course_review', 'course', courseId, status);
  notifyUsers([instructorId], { title: 'Curso actualizado', body: `${title}: ${status}.`, page: 'campus' });
  return true;
}

export function reportLocalCourse(courseId, reason, details = '') {
  const profile = getActiveLocalProfile();
  const id = uid('course-report');
  mutateState(state => {
    state.reports.unshift({ id, course_id: courseId, reporter_id: profile.id, reason: String(reason || 'Contenido por revisar'), details: String(details || '').trim(), status: 'pending', created_at: nowIso() });
  }, 'course-report');
  addAudit('course_report', 'course', courseId, reason);
  notifyUsers(adminIds(), { title: 'Reporte de curso', body: `${profile.displayName} reportó un contenido de CampusHugo.`, page: 'admin' });
  return id;
}

export function reviewLocalCourseReport(reportId, status) {
  if (!isAdmin()) throw new Error('Solo un administrador puede revisar reportes.');
  mutateState(state => {
    const report = state.reports.find(item => item.id === reportId);
    if (!report) throw new Error('Reporte no encontrado.');
    report.status = status;
    report.reviewed_at = nowIso();
  }, 'course-report-review');
  addAudit('course_report_review', 'course_report', reportId, status);
  return true;
}

export function resetLocalCampus() {
  localStorage.removeItem(STATE_KEY);
  writeState(seedState(), 'campus-reset');
}
