export const STUDENT_MODULES = new Set([
  'panel', 'community', 'chat', 'notifications', 'personalFinance', 'transfer', 'campus', 'settings'
]);

export const ADMIN_ONLY_MODULES = new Set(['admin', 'architecture', 'localLab', 'blueprint', 'sync', 'cloudCenter', 'quality', 'gateway', 'cloudLaunch']);

export function isStudentProfile(profile) {
  return profile?.accountType === 'student' || profile?.account_type === 'student' || profile?.schoolRole === 'student' || profile?.school_role === 'student';
}

export function isBusinessProfile(profile) {
  return profile?.accountType === 'business' || profile?.account_type === 'business';
}

export function isOrganizationProfile(profile) {
  return profile?.accountType === 'organization' || profile?.account_type === 'organization';
}

export function isPlatformAdmin(profile) {
  return ['admin', 'super_admin'].includes(profile?.role);
}

export function canAccessModule(profile, moduleId, { ownsBusiness = false } = {}) {
  if (profile?.role === 'guest') return ['panel', 'settings'].includes(moduleId);
  const admin = isPlatformAdmin(profile);
  if (ADMIN_ONLY_MODULES.has(moduleId)) return admin;
  if (isStudentProfile(profile)) return STUDENT_MODULES.has(moduleId);
  if (moduleId === 'rideDelivery') return admin || profile?.role === 'driver' || profile?.accountType === 'driver' || profile?.account_type === 'driver';
  if (moduleId === 'business') return admin || isBusinessProfile(profile) || ownsBusiness || !isStudentProfile(profile);
  if (moduleId === 'committees') return admin || !isStudentProfile(profile);
  if (moduleId === 'payments') return admin || !isStudentProfile(profile);
  if (moduleId === 'verification') return admin || !isStudentProfile(profile);
  return true;
}

export function canPublishPromotions(profile, { ownsBusiness = false } = {}) {
  return isPlatformAdmin(profile) || isBusinessProfile(profile) || ownsBusiness;
}

export function canCreatePublicCommunity(profile) {
  return !isStudentProfile(profile);
}

export function profileAudienceLabel(profile, { ownsBusiness = false } = {}) {
  if (isPlatformAdmin(profile)) return 'Administrador de plataforma';
  if (isStudentProfile(profile)) return 'Cuenta estudiantil protegida';
  if (isBusinessProfile(profile) || ownsBusiness) return 'Negocio verificado';
  if (isOrganizationProfile(profile)) return 'Organización';
  return 'Usuario adulto';
}


// ETAPA 30.34 - Matriz base de roles y pestañas.
// El rol sugiere permisos, pero el administrador puede activar/desactivar módulos por usuario.
export const ROLE_ACCESS_MATRIX = {
  super_admin: {
    label: 'Super administrador',
    modules: ['panel','community','committees','chat','notifications','personalFinance','transfer','benefits','marketplace','business','campus','ride','rideDelivery','ai','verification','payments','gateway','sync','cloudCenter','cloudLaunch','quality','admin','architecture','settings'],
    canInvite: true,
    canManageModules: true
  },
  platform_admin: {
    label: 'Administrador de plataforma',
    modules: ['panel','community','committees','chat','notifications','benefits','marketplace','business','ride','rideDelivery','verification','payments','admin','architecture','settings'],
    canInvite: true,
    canManageModules: true
  },
  adult: {
    label: 'Adulto',
    modules: ['panel','community','committees','chat','notifications','personalFinance','benefits','marketplace','ride','settings'],
    canInvite: true
  },
  parent: {
    label: 'Padre de familia',
    modules: ['panel','community','committees','chat','notifications','benefits','marketplace','ride','campus','settings'],
    canInvite: true
  },
  student: {
    label: 'Alumno protegido',
    modules: ['panel','community','chat','notifications','transfer','campus','settings'],
    canInvite: false
  },
  business_owner: {
    label: 'Dueño de negocio',
    modules: ['panel','chat','notifications','benefits','marketplace','business','ride','settings'],
    canInvite: true
  },
  business_worker: {
    label: 'Trabajador de negocio',
    modules: ['panel','chat','notifications','business','settings'],
    canInvite: false
  },
  driver: {
    label: 'Conductor / repartidor',
    modules: ['panel','chat','notifications','ride','rideDelivery','settings'],
    canInvite: false
  },
  chat_guest: {
    label: 'Invitado solo chat',
    modules: ['chat','settings'],
    canInvite: false
  },
  temporary_guest: {
    label: 'Invitado temporal',
    modules: ['chat','settings'],
    canInvite: false,
    temporary: true
  }
};

export const MODULE_PERMISSION_ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'administrar'];

export function getRoleAccess(role = 'adult') {
  return ROLE_ACCESS_MATRIX[role] || ROLE_ACCESS_MATRIX.adult;
}

export function getRoleModules(role = 'adult') {
  return new Set(getRoleAccess(role).modules || []);
}

export function canRoleSeeModule(role, moduleId) {
  return getRoleModules(role).has(moduleId);
}
