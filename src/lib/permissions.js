export const STUDENT_MODULES = new Set([
  'panel', 'community', 'chat', 'notifications', 'transfer', 'campus', 'settings'
]);

export const ADMIN_ONLY_MODULES = new Set(['admin', 'localLab', 'blueprint', 'sync', 'cloudCenter', 'quality', 'gateway', 'cloudLaunch']);

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
  const admin = isPlatformAdmin(profile);
  if (ADMIN_ONLY_MODULES.has(moduleId)) return admin;
  if (isStudentProfile(profile)) return STUDENT_MODULES.has(moduleId);
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
