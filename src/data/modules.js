import { Home, Search, HandHelping, Users, Building2, Bell, Settings, Shield } from 'lucide-react';

export const statusLabel = { active: 'Activo', beta: 'Beta', soon: 'Próximamente' };
export const sectionOrder = ['MiZona Estudiantes', 'Cuenta'];

export const modules = [
  { id: 'panel', label: 'Para ti', icon: Home, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'explore', label: 'Explorar', icon: Search, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'help', label: 'Red de ayuda', icon: HandHelping, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'communities', label: 'Comunidades', icon: Users, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'institutions', label: 'Instituciones', icon: Building2, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, status: 'active', section: 'MiZona Estudiantes' },
  { id: 'admin', label: 'Moderación', icon: Shield, status: 'active', section: 'Cuenta', adminOnly: true },
  { id: 'settings', label: 'Mi cuenta', icon: Settings, status: 'active', section: 'Cuenta' }
];
