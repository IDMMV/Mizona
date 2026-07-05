import { Home, Users, MessageCircle, Gift, Store, ShoppingBag, GraduationCap, Car, Bot, Shield, UploadCloud, Building2 } from 'lucide-react';

export const modules = [
  { id: 'panel', label: 'Mi Panel', icon: Home, status: 'activo', path: 'panel', audience: 'todos' },
  { id: 'comunidad', label: 'Mi Comunidad', icon: Users, status: 'activo', path: 'comunidad', audience: 'comunidades' },
  { id: 'chat', label: 'MiZona Chat', icon: MessageCircle, status: 'activo', path: 'chat', audience: 'usuarios' },
  { id: 'transfer', label: 'MiZona Transfer', icon: UploadCloud, status: 'activo', path: 'transfer', audience: 'colegios' },
  { id: 'beneficios', label: 'Beneficios', icon: Gift, status: 'beta', path: 'beneficios', audience: 'todos' },
  { id: 'negocios', label: 'Negocios', icon: Store, status: 'beta', path: 'negocios', audience: 'todos' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, status: 'desactivado', path: 'marketplace', audience: 'todos' },
  { id: 'campus', label: 'CampusHugo', icon: GraduationCap, status: 'desactivado', path: 'campus', audience: 'aprendizaje' },
  { id: 'business', label: 'MiZona Business', icon: Building2, status: 'desactivado', path: 'business', audience: 'negocios' },
  { id: 'ride', label: 'MiZona Ride', icon: Car, status: 'desactivado', path: 'ride', audience: 'conductores' },
  { id: 'ia', label: 'IA MiZona', icon: Bot, status: 'mantenimiento', path: 'ia', audience: 'todos' },
  { id: 'admin', label: 'Centro de Control', icon: Shield, status: 'activo', path: 'admin', audience: 'admin' }
];
