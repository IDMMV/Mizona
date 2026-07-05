import { Home, Users, MessageCircle, CloudUpload, Gift, Store, BriefcaseBusiness, Shield, GraduationCap, Car, ShoppingBag, Bot, Settings, FileText } from 'lucide-react';

export const statusLabel = {
  active: 'Activo',
  beta: 'Beta',
  soon: 'Próximamente',
  maintenance: 'Mantenimiento'
};

export const modules = [
  { id: 'panel', label: 'Mi Panel', icon: Home, status: 'active', phase: 'Base', audience: 'Todos' },
  { id: 'community', label: 'Mi Comunidad', icon: Users, status: 'active', phase: 'Sprint 2', audience: 'Colegios, comités, clubes' },
  { id: 'chat', label: 'MiZona Chat', icon: MessageCircle, status: 'active', phase: 'Sprint 2', audience: 'Usuarios y aulas' },
  { id: 'transfer', label: 'MiZona Transfer', icon: CloudUpload, status: 'active', phase: 'Sprint 2', audience: 'Aulas y trabajos' },
  { id: 'benefits', label: 'Beneficios', icon: Gift, status: 'active', phase: 'Sprint 3', audience: 'Todos' },
  { id: 'businesses', label: 'Negocios', icon: Store, status: 'beta', phase: 'Sprint 4', audience: 'Comercios' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, status: 'soon', phase: 'Futuro', audience: 'Usuarios' },
  { id: 'business', label: 'MiZona Business', icon: BriefcaseBusiness, status: 'soon', phase: 'Futuro', audience: 'Negocios' },
  { id: 'campus', label: 'CampusHugo', icon: GraduationCap, status: 'soon', phase: 'Futuro', audience: 'Estudiantes' },
  { id: 'ride', label: 'MiZona Ride', icon: Car, status: 'soon', phase: 'Futuro', audience: 'Transporte' },
  { id: 'ai', label: 'IA MiZona', icon: Bot, status: 'maintenance', phase: 'Futuro', audience: 'Todos' },
  { id: 'admin', label: 'Centro de Control', icon: Shield, status: 'active', phase: 'Core', audience: 'Administradores' },
  { id: 'blueprint', label: 'Blueprint', icon: FileText, status: 'active', phase: 'Docs', audience: 'Equipo' },
  { id: 'settings', label: 'Configuración', icon: Settings, status: 'active', phase: 'Core', audience: 'Usuario' }
];

export const communities = [
  { id: 'san-martin', name: 'Colegio San Martín', type: 'Colegio', members: 1240, status: 'active', zone: 'Ventanilla - Pachacútec', features: ['Comunicados', 'Aula Chat', 'Documentos', 'Eventos'] },
  { id: 'los-pinos', name: 'Comité Los Pinos', type: 'Comité', members: 320, status: 'beta', zone: 'Pachacútec Sector B', features: ['Actas', 'Avisos', 'Eventos'] },
  { id: 'union', name: 'Club Deportivo Unión', type: 'Club', members: 180, status: 'soon', zone: 'Ventanilla', features: ['Eventos', 'Galería', 'Grupos'] }
];

export const schoolRooms = [
  { id: '5a', name: '5° A Primaria', teacher: 'Prof. Ramos', members: 34, chats: 6, files: 12 },
  { id: '2b', name: '2° B Secundaria', teacher: 'Prof. Medina', members: 29, chats: 9, files: 18 },
  { id: 'promo', name: 'Promoción 2026', teacher: 'Coordinación', members: 86, chats: 4, files: 7 }
];

export const notices = [
  { title: 'Reunión de padres', category: 'Comunicado', date: 'Hoy 7:00 p. m.', target: '5° A Primaria' },
  { title: 'Actividad deportiva', category: 'Evento', date: 'Sábado 10:00 a. m.', target: 'Secundaria' },
  { title: 'Entrega de tarea de ciencias', category: 'Tarea', date: 'Viernes', target: '2° B Secundaria' }
];

export const chatThreads = [
  { id: 1, name: 'Carlos_2009', type: 'Individual', context: '5° A Primaria', last: '¿Terminaste la maqueta?', expires: '7 días' },
  { id: 2, name: 'Grupo Ciencias', type: 'Grupo de trabajo', context: 'Colegio San Martín', last: 'Subí el archivo en Transfer.', expires: '7 días' },
  { id: 3, name: 'Aula 2° B', type: 'Aula Chat', context: 'Prof. Medina', last: 'Recuerden enviar el PDF.', expires: '7 días' }
];
