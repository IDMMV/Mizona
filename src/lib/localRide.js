import {
  getActiveLocalProfile,
  getActiveLocalProfileId,
  listLocalProfiles,
  mutateLocalState
} from './localStore';

const STATE_KEY = 'mizona-v8-local-ride-v20';
const CHANGE_EVENT = 'mizona:local-ride-change';
const CHANNEL_NAME = 'mizona-v8-ride-v20';
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const nowIso = () => new Date().toISOString();
const ago = ms => new Date(Date.now() - ms).toISOString();

const RIDE_STATUSES = ['searching','assigned','arriving','waiting','in_progress','completed','cancelled'];
const DELIVERY_STATUSES = ['searching','assigned','picked_up','in_transit','delivered','cancelled'];

const seedDrivers = [
  {
    id: 'drv-carlos', user_id: 'local-carlos', status: 'verified', verified: true, online: true,
    vehicle_type: 'auto', vehicle_brand: 'Toyota', vehicle_model: 'Yaris', plate: 'A7K-421', color: 'Plata',
    license_number: 'Q12345678', documents_ok: true, rating: 4.9, trips_completed: 1284,
    earnings: 486.50, created_at: ago(70 * 86400000), updated_at: ago(5 * 60000)
  },
  {
    id: 'drv-valery', user_id: 'local-valery', status: 'pending', verified: false, online: false,
    vehicle_type: 'moto', vehicle_brand: 'Honda', vehicle_model: 'CB125F', plate: '5821-KA', color: 'Rojo',
    license_number: 'M87654321', documents_ok: true, rating: 5, trips_completed: 0,
    earnings: 0, created_at: ago(2 * 86400000), updated_at: ago(2 * 86400000)
  }
];

const seedRides = [
  {
    id: 'ride-completed-1', code: 'R-0201', passenger_id: 'local-user-jose', driver_id: 'drv-carlos',
    service_type: 'auto', origin: 'Pachacútec, Ventanilla', destination: 'Plaza Vea Ventanilla',
    distance_km: 6.4, duration_min: 21, fare: 16.90, payment_method: 'digital', status: 'completed',
    security_code: '4729', passenger_confirmed: true, rating: 5, rating_comment: 'Buen servicio y puntual.',
    created_at: ago(2 * 86400000), accepted_at: ago(2 * 86400000 - 5 * 60000),
    started_at: ago(2 * 86400000 - 12 * 60000), completed_at: ago(2 * 86400000 - 33 * 60000), updated_at: ago(2 * 86400000 - 33 * 60000)
  },
  {
    id: 'ride-open-maria', code: 'R-0202', passenger_id: 'local-maria', driver_id: null,
    service_type: 'auto', origin: 'Comité Los Pinos', destination: 'Municipalidad de Ventanilla',
    distance_km: 4.8, duration_min: 18, fare: 14.20, payment_method: 'cash', status: 'searching',
    security_code: null, passenger_confirmed: false, rating: null, rating_comment: '',
    created_at: ago(12 * 60000), accepted_at: null, started_at: null, completed_at: null, updated_at: ago(12 * 60000)
  }
];

const seedDeliveries = [
  {
    id: 'delivery-completed-1', code: 'D-0107', customer_id: 'local-user-jose', driver_id: 'drv-carlos',
    pickup: 'Farmacia Económica', dropoff: 'Sector B, Pachacútec', content: 'Productos de cuidado personal',
    package_type: 'package', distance_km: 3.6, fare: 10.50, payment_method: 'cash', status: 'delivered',
    recipient_name: 'Rosa', recipient_phone: '*** *** 121', proof_note: 'Entregado en recepción',
    created_at: ago(86400000), accepted_at: ago(86400000 - 4 * 60000), picked_up_at: ago(86400000 - 14 * 60000),
    delivered_at: ago(86400000 - 35 * 60000), updated_at: ago(86400000 - 35 * 60000)
  }
];

function seedState() {
  return {
    version: 20,
    drivers: clone(seedDrivers),
    rides: clone(seedRides),
    deliveries: clone(seedDeliveries),
    reports: [],
    emergency_events: [],
    updated_at: nowIso()
  };
}

function migrate(state) {
  const next = state && typeof state === 'object' ? state : seedState();
  next.version = 20;
  for (const key of ['drivers','rides','deliveries','reports','emergency_events']) next[key] = Array.isArray(next[key]) ? next[key] : [];
  if (!next.drivers.length) next.drivers = clone(seedDrivers);
  if (!next.rides.length) next.rides = clone(seedRides);
  if (!next.deliveries.length) next.deliveries = clone(seedDeliveries);
  next.updated_at = next.updated_at || nowIso();
  return next;
}

export function readLocalRideState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    const next = migrate(parsed);
    if (!parsed) localStorage.setItem(STATE_KEY, JSON.stringify(next));
    return clone(next);
  } catch {
    const fresh = seedState();
    localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    return clone(fresh);
  }
}

function writeState(next, reason = 'ride-update') {
  const state = migrate(next);
  state.updated_at = nowIso();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason } }));
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ reason, updated_at: state.updated_at });
    channel.close();
  } catch {}
  return clone(state);
}

function mutateState(fn, reason) {
  const state = readLocalRideState();
  fn(state);
  return writeState(state, reason);
}

export function subscribeLocalRide(callback) {
  const handler = event => callback?.(event.detail || { reason: 'local' });
  const storage = event => { if (event.key === STATE_KEY) callback?.({ reason: 'storage' }); };
  let channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = event => callback?.(event.data || { reason: 'broadcast' });
  } catch {}
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storage);
    channel?.close();
  };
}

function isAdmin(profile = getActiveLocalProfile()) {
  return ['admin','super_admin'].includes(profile?.role);
}

function isStudent(profile = getActiveLocalProfile()) {
  return profile?.accountType === 'student' || profile?.account_type === 'student' || profile?.schoolRole === 'student' || profile?.school_role === 'student';
}

function profileById(id) {
  return listLocalProfiles().find(item => item.id === id) || null;
}

function driverUser(state, driverId) {
  const driver = state.drivers.find(item => item.id === driverId);
  return driver ? profileById(driver.user_id) : null;
}

function notify(userIds, { title, body, page = 'ride', type = 'ride' }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return;
  mutateLocalState(draft => {
    for (const user_id of ids) {
      draft.notifications.unshift({
        id: uid('not-ride'), user_id, type, title, body, page, read: false, created_at: nowIso()
      });
    }
    draft.notifications = draft.notifications.slice(0, 500);
    return draft;
  }, 'ride-notification');
}

function audit(action, entityType, entityId, detail = '', metadata = {}) {
  mutateLocalState(draft => {
    draft.auditLogs.unshift({
      id: uid('audit-ride'), actor_id: getActiveLocalProfileId(), action,
      entity_type: entityType, entity_id: entityId, detail, metadata, created_at: nowIso()
    });
    draft.syncQueue.unshift({
      id: uid('queue-ride'), actor_id: getActiveLocalProfileId(), action,
      entity_type: entityType, entity_id: entityId, payload: metadata,
      status: 'local_only', created_at: nowIso()
    });
    draft.auditLogs = draft.auditLogs.slice(0, 500);
    draft.syncQueue = draft.syncQueue.slice(0, 800);
    return draft;
  }, 'ride-audit');
}

function requireAdult() {
  if (isStudent()) throw new Error('Las cuentas estudiantiles no pueden usar MiZona Ride.');
}

function currentDriver(state = readLocalRideState()) {
  return state.drivers.find(item => item.user_id === getActiveLocalProfileId()) || null;
}

function calculateRideFare(serviceType, distanceKm) {
  const km = Math.max(1, Number(distanceKm || 1));
  const rates = {
    moto: { base: 4, km: 1.2 },
    auto: { base: 6, km: 1.7 },
    van: { base: 9, km: 2.4 }
  };
  const rate = rates[serviceType] || rates.auto;
  return Math.round((rate.base + rate.km * km) * 10) / 10;
}

function calculateDeliveryFare(distanceKm, packageType) {
  const km = Math.max(1, Number(distanceKm || 1));
  const surcharge = packageType === 'food' ? 2 : packageType === 'document' ? 0 : 1;
  return Math.round((5 + km * 1.35 + surcharge) * 10) / 10;
}

function ensureDriverMayOperate(driver) {
  if (!driver) throw new Error('Debes registrarte como conductor.');
  if (driver.status !== 'verified' || !driver.verified) throw new Error('Tu perfil de conductor todavía no está verificado.');
  if (!driver.documents_ok) throw new Error('Tus documentos requieren actualización.');
}

export function getLocalRideSnapshot() {
  const state = readLocalRideState();
  const profileId = getActiveLocalProfileId();
  const driver = currentDriver(state);
  const profiles = Object.fromEntries(listLocalProfiles().map(item => [item.id, item]));
  const drivers = state.drivers.map(item => ({
    ...item,
    profile: profiles[item.user_id] || null
  }));
  const rides = state.rides.map(item => ({
    ...item,
    passenger: profiles[item.passenger_id] || null,
    driver: item.driver_id ? drivers.find(row => row.id === item.driver_id) || null : null
  }));
  const deliveries = state.deliveries.map(item => ({
    ...item,
    customer: profiles[item.customer_id] || null,
    driver: item.driver_id ? drivers.find(row => row.id === item.driver_id) || null : null
  }));
  const myRides = rides.filter(item => item.passenger_id === profileId || item.driver?.user_id === profileId);
  const myDeliveries = deliveries.filter(item => item.customer_id === profileId || item.driver?.user_id === profileId);
  const availableRides = rides.filter(item => item.status === 'searching');
  const availableDeliveries = deliveries.filter(item => item.status === 'searching');
  const activePassengerRide = rides.find(item => item.passenger_id === profileId && !['completed','cancelled'].includes(item.status)) || null;
  const activeDriverRide = rides.find(item => item.driver?.user_id === profileId && !['completed','cancelled'].includes(item.status)) || null;
  const activePassengerDelivery = deliveries.find(item => item.customer_id === profileId && !['delivered','cancelled'].includes(item.status)) || null;
  const activeDriverDelivery = deliveries.find(item => item.driver?.user_id === profileId && !['delivered','cancelled'].includes(item.status)) || null;
  return {
    state,
    profile: getActiveLocalProfile(),
    driver,
    drivers,
    rides,
    deliveries,
    myRides,
    myDeliveries,
    availableRides,
    availableDeliveries,
    activePassengerRide,
    activeDriverRide,
    activePassengerDelivery,
    activeDriverDelivery,
    reports: state.reports,
    emergencyEvents: state.emergency_events,
    verifiedOnlineDrivers: drivers.filter(item => item.verified && item.status === 'verified' && item.online).length,
    pendingDrivers: drivers.filter(item => item.status === 'pending').length,
    openServices: availableRides.length + availableDeliveries.length,
    completedServices: rides.filter(item => item.status === 'completed').length + deliveries.filter(item => item.status === 'delivered').length,
    isAdmin: isAdmin()
  };
}

export function registerLocalDriver(values) {
  requireAdult();
  const state = readLocalRideState();
  if (currentDriver(state)) throw new Error('Ya tienes un perfil de conductor registrado.');
  const vehicleType = ['moto','auto','van'].includes(values.vehicleType) ? values.vehicleType : 'auto';
  const plate = String(values.plate || '').trim().toUpperCase();
  if (plate.length < 5) throw new Error('Ingresa una placa válida.');
  const id = uid('drv');
  const autoVerified = isAdmin();
  mutateState(draft => {
    draft.drivers.unshift({
      id, user_id: getActiveLocalProfileId(), status: autoVerified ? 'verified' : 'pending', verified: autoVerified,
      online: false, vehicle_type: vehicleType, vehicle_brand: String(values.brand || '').trim(),
      vehicle_model: String(values.model || '').trim(), plate, color: String(values.color || '').trim(),
      license_number: String(values.licenseNumber || '').trim(), documents_ok: Boolean(values.documentsOk),
      rating: 5, trips_completed: 0, earnings: 0, created_at: nowIso(), updated_at: nowIso()
    });
  }, 'driver-register');
  const admins = listLocalProfiles().filter(item => ['admin','super_admin'].includes(item.role)).map(item => item.id);
  notify(admins, { title: 'Nuevo conductor pendiente', body: `${getActiveLocalProfile().displayName} solicitó validación en MiZona Ride.`, page: 'admin' });
  audit('ride_driver_register', 'ride_driver', id, plate, { vehicleType });
  return id;
}

export function reviewLocalDriver(driverId, status, verified = null) {
  if (!isAdmin()) throw new Error('Solo un administrador puede revisar conductores.');
  if (!['pending','verified','suspended','rejected'].includes(status)) throw new Error('Estado de conductor inválido.');
  let userId = null;
  mutateState(draft => {
    const driver = draft.drivers.find(item => item.id === driverId);
    if (!driver) throw new Error('Conductor no encontrado.');
    userId = driver.user_id;
    driver.status = status;
    driver.verified = verified === null ? status === 'verified' : Boolean(verified);
    driver.online = status === 'verified' ? driver.online : false;
    driver.updated_at = nowIso();
  }, 'driver-review');
  notify([userId], { title: 'Estado de conductor actualizado', body: `Tu solicitud está en estado: ${status}.` });
  audit('ride_driver_review', 'ride_driver', driverId, status, { verified });
  return true;
}

export function toggleLocalDriverOnline(online) {
  const state = readLocalRideState();
  const driver = currentDriver(state);
  ensureDriverMayOperate(driver);
  mutateState(draft => {
    const row = draft.drivers.find(item => item.id === driver.id);
    row.online = Boolean(online);
    row.updated_at = nowIso();
  }, 'driver-online');
  audit('ride_driver_online', 'ride_driver', driver.id, online ? 'online' : 'offline');
  return true;
}

export function createLocalRideRequest(values) {
  requireAdult();
  const state = readLocalRideState();
  const existing = state.rides.find(item => item.passenger_id === getActiveLocalProfileId() && !['completed','cancelled'].includes(item.status));
  if (existing) throw new Error('Ya tienes un viaje activo. Cancélalo o complétalo primero.');
  const origin = String(values.origin || '').trim();
  const destination = String(values.destination || '').trim();
  if (origin.length < 3 || destination.length < 3) throw new Error('Completa el origen y el destino.');
  const serviceType = ['moto','auto','van'].includes(values.serviceType) ? values.serviceType : 'auto';
  const distanceKm = Math.max(1, Number(values.distanceKm || 1));
  const fare = calculateRideFare(serviceType, distanceKm);
  const id = uid('ride');
  const code = `R-${String(Date.now()).slice(-4)}`;
  mutateState(draft => {
    draft.rides.unshift({
      id, code, passenger_id: getActiveLocalProfileId(), driver_id: null, service_type: serviceType,
      origin, destination, distance_km: distanceKm, duration_min: Math.max(8, Math.round(distanceKm * 3.2)), fare,
      payment_method: values.paymentMethod || 'cash', status: 'searching', security_code: null,
      passenger_confirmed: false, rating: null, rating_comment: '',
      created_at: nowIso(), accepted_at: null, started_at: null, completed_at: null, updated_at: nowIso()
    });
  }, 'ride-request-create');
  const drivers = state.drivers.filter(item => item.verified && item.status === 'verified' && item.online).map(item => item.user_id);
  notify(drivers, { title: 'Nuevo viaje disponible', body: `${origin} → ${destination} · S/ ${fare.toFixed(2)}` });
  audit('ride_request_create', 'ride_request', id, `${origin} → ${destination}`, { fare, serviceType, distanceKm });
  return id;
}

export function cancelLocalRideRequest(rideId, reason = 'Cancelado por el pasajero') {
  requireAdult();
  let driverUserId = null;
  mutateState(draft => {
    const ride = draft.rides.find(item => item.id === rideId);
    if (!ride) throw new Error('Viaje no encontrado.');
    const driver = ride.driver_id ? draft.drivers.find(item => item.id === ride.driver_id) : null;
    driverUserId = driver?.user_id || null;
    const allowed = ride.passenger_id === getActiveLocalProfileId() || isAdmin();
    if (!allowed) throw new Error('No puedes cancelar este viaje.');
    if (['in_progress','completed'].includes(ride.status)) throw new Error('El viaje ya inició y no puede cancelarse desde aquí.');
    ride.status = 'cancelled';
    ride.cancel_reason = reason;
    ride.updated_at = nowIso();
  }, 'ride-request-cancel');
  notify([driverUserId], { title: 'Viaje cancelado', body: reason });
  audit('ride_request_cancel', 'ride_request', rideId, reason);
  return true;
}

export function acceptLocalRideRequest(rideId) {
  requireAdult();
  const state = readLocalRideState();
  const driver = currentDriver(state);
  ensureDriverMayOperate(driver);
  if (!driver.online) throw new Error('Activa el modo disponible antes de aceptar servicios.');
  if (state.rides.some(item => item.driver_id === driver.id && !['completed','cancelled'].includes(item.status))) throw new Error('Ya tienes un viaje activo.');
  let passengerId = null;
  mutateState(draft => {
    const ride = draft.rides.find(item => item.id === rideId);
    if (!ride || ride.status !== 'searching') throw new Error('La solicitud ya no está disponible.');
    passengerId = ride.passenger_id;
    ride.driver_id = driver.id;
    ride.status = 'assigned';
    ride.security_code = String(Math.floor(1000 + Math.random() * 9000));
    ride.accepted_at = nowIso();
    ride.updated_at = nowIso();
  }, 'ride-request-accept');
  notify([passengerId], { title: 'Conductor asignado', body: `${getActiveLocalProfile().displayName} aceptó tu viaje.` });
  audit('ride_request_accept', 'ride_request', rideId, driver.plate, { driverId: driver.id });
  return true;
}

export function updateLocalRideStatus(rideId, status) {
  if (!RIDE_STATUSES.includes(status)) throw new Error('Estado de viaje inválido.');
  const state = readLocalRideState();
  const ride = state.rides.find(item => item.id === rideId);
  if (!ride) throw new Error('Viaje no encontrado.');
  const driver = ride.driver_id ? state.drivers.find(item => item.id === ride.driver_id) : null;
  const actor = getActiveLocalProfileId();
  const allowed = isAdmin() || ride.passenger_id === actor || driver?.user_id === actor;
  if (!allowed) throw new Error('No tienes permiso para actualizar este viaje.');
  if (status === 'in_progress') throw new Error('Usa el código de seguridad para iniciar el viaje.');
  mutateState(draft => {
    const row = draft.rides.find(item => item.id === rideId);
    row.status = status;
    row.updated_at = nowIso();
    if (status === 'completed') {
      row.completed_at = nowIso();
      const drv = draft.drivers.find(item => item.id === row.driver_id);
      if (drv) {
        drv.trips_completed = Number(drv.trips_completed || 0) + 1;
        drv.earnings = Number(drv.earnings || 0) + Number(row.fare || 0) * 0.82;
      }
    }
  }, 'ride-status');
  const recipients = [ride.passenger_id, driver?.user_id].filter(id => id && id !== actor);
  notify(recipients, { title: 'Estado del viaje', body: `${ride.code}: ${status.replaceAll('_',' ')}` });
  audit('ride_status_update', 'ride_request', rideId, status);
  return true;
}

export function confirmLocalRideCode(rideId, code) {
  const state = readLocalRideState();
  const ride = state.rides.find(item => item.id === rideId);
  if (!ride) throw new Error('Viaje no encontrado.');
  const driver = state.drivers.find(item => item.id === ride.driver_id);
  if (!driver || driver.user_id !== getActiveLocalProfileId()) throw new Error('Solo el conductor asignado puede validar el código.');
  if (!['assigned','arriving','waiting'].includes(ride.status)) throw new Error('El viaje no está listo para iniciar.');
  if (String(code || '').trim() !== String(ride.security_code || '')) throw new Error('Código de seguridad incorrecto.');
  mutateState(draft => {
    const row = draft.rides.find(item => item.id === rideId);
    row.status = 'in_progress';
    row.passenger_confirmed = true;
    row.started_at = nowIso();
    row.updated_at = nowIso();
  }, 'ride-code-confirm');
  notify([ride.passenger_id], { title: 'Viaje iniciado', body: `${ride.code} comenzó correctamente.` });
  audit('ride_code_confirm', 'ride_request', rideId, 'Código validado');
  return true;
}

export function rateLocalRide(rideId, rating, comment = '') {
  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('La calificación debe ser de 1 a 5.');
  let driverId = null;
  mutateState(draft => {
    const ride = draft.rides.find(item => item.id === rideId);
    if (!ride || ride.passenger_id !== getActiveLocalProfileId() || ride.status !== 'completed') throw new Error('Solo el pasajero puede calificar un viaje completado.');
    if (ride.rating) throw new Error('Este viaje ya fue calificado.');
    ride.rating = score;
    ride.rating_comment = String(comment || '').trim();
    driverId = ride.driver_id;
    const related = draft.rides.filter(item => item.driver_id === driverId && Number(item.rating) > 0);
    const driver = draft.drivers.find(item => item.id === driverId);
    if (driver && related.length) driver.rating = Math.round((related.reduce((sum,item) => sum + Number(item.rating), 0) / related.length) * 10) / 10;
  }, 'ride-rating');
  const driver = readLocalRideState().drivers.find(item => item.id === driverId);
  notify([driver?.user_id], { title: 'Nueva calificación', body: `Recibiste ${score} estrella${score === 1 ? '' : 's'}.` });
  audit('ride_rating_create', 'ride_request', rideId, `${score} estrellas`);
  return true;
}

export function createLocalDelivery(values) {
  requireAdult();
  const pickup = String(values.pickup || '').trim();
  const dropoff = String(values.dropoff || '').trim();
  const content = String(values.content || '').trim();
  if (pickup.length < 3 || dropoff.length < 3 || content.length < 2) throw new Error('Completa los datos del envío.');
  const state = readLocalRideState();
  const existing = state.deliveries.find(item => item.customer_id === getActiveLocalProfileId() && !['delivered','cancelled'].includes(item.status));
  if (existing) throw new Error('Ya tienes un envío activo.');
  const distanceKm = Math.max(1, Number(values.distanceKm || 1));
  const packageType = ['package','food','document'].includes(values.packageType) ? values.packageType : 'package';
  const fare = calculateDeliveryFare(distanceKm, packageType);
  const id = uid('delivery');
  const code = `D-${String(Date.now()).slice(-4)}`;
  mutateState(draft => {
    draft.deliveries.unshift({
      id, code, customer_id: getActiveLocalProfileId(), driver_id: null, pickup, dropoff, content,
      package_type: packageType, distance_km: distanceKm, fare, payment_method: values.paymentMethod || 'cash',
      status: 'searching', recipient_name: String(values.recipientName || '').trim(),
      recipient_phone: String(values.recipientPhone || '').trim(), proof_note: '',
      created_at: nowIso(), accepted_at: null, picked_up_at: null, delivered_at: null, updated_at: nowIso()
    });
  }, 'delivery-create');
  const drivers = state.drivers.filter(item => item.verified && item.status === 'verified' && item.online).map(item => item.user_id);
  notify(drivers, { title: 'Nuevo envío disponible', body: `${pickup} → ${dropoff} · S/ ${fare.toFixed(2)}` });
  audit('delivery_create', 'ride_delivery', id, `${pickup} → ${dropoff}`, { fare, packageType, distanceKm });
  return id;
}

export function acceptLocalDelivery(deliveryId) {
  requireAdult();
  const state = readLocalRideState();
  const driver = currentDriver(state);
  ensureDriverMayOperate(driver);
  if (!driver.online) throw new Error('Activa el modo disponible antes de aceptar servicios.');
  if (state.deliveries.some(item => item.driver_id === driver.id && !['delivered','cancelled'].includes(item.status))) throw new Error('Ya tienes un envío activo.');
  let customerId = null;
  mutateState(draft => {
    const delivery = draft.deliveries.find(item => item.id === deliveryId);
    if (!delivery || delivery.status !== 'searching') throw new Error('El envío ya no está disponible.');
    customerId = delivery.customer_id;
    delivery.driver_id = driver.id;
    delivery.status = 'assigned';
    delivery.accepted_at = nowIso();
    delivery.updated_at = nowIso();
  }, 'delivery-accept');
  notify([customerId], { title: 'Repartidor asignado', body: `${getActiveLocalProfile().displayName} aceptó tu envío.` });
  audit('delivery_accept', 'ride_delivery', deliveryId, driver.plate, { driverId: driver.id });
  return true;
}

export function updateLocalDeliveryStatus(deliveryId, status, proofNote = '') {
  if (!DELIVERY_STATUSES.includes(status)) throw new Error('Estado de envío inválido.');
  const state = readLocalRideState();
  const delivery = state.deliveries.find(item => item.id === deliveryId);
  if (!delivery) throw new Error('Envío no encontrado.');
  const driver = state.drivers.find(item => item.id === delivery.driver_id);
  const actor = getActiveLocalProfileId();
  const allowed = isAdmin() || delivery.customer_id === actor || driver?.user_id === actor;
  if (!allowed) throw new Error('No tienes permiso para actualizar este envío.');
  mutateState(draft => {
    const row = draft.deliveries.find(item => item.id === deliveryId);
    row.status = status;
    row.updated_at = nowIso();
    if (status === 'picked_up') row.picked_up_at = nowIso();
    if (status === 'delivered') {
      row.delivered_at = nowIso();
      row.proof_note = String(proofNote || '').trim() || 'Entregado al destinatario';
      const drv = draft.drivers.find(item => item.id === row.driver_id);
      if (drv) {
        drv.trips_completed = Number(drv.trips_completed || 0) + 1;
        drv.earnings = Number(drv.earnings || 0) + Number(row.fare || 0) * 0.82;
      }
    }
  }, 'delivery-status');
  const recipients = [delivery.customer_id, driver?.user_id].filter(id => id && id !== actor);
  notify(recipients, { title: 'Estado del envío', body: `${delivery.code}: ${status.replaceAll('_',' ')}` });
  audit('delivery_status_update', 'ride_delivery', deliveryId, status);
  return true;
}

export function createLocalRideReport({ rideId = null, deliveryId = null, reason, details = '', emergency = false }) {
  requireAdult();
  const state = readLocalRideState();
  const ride = rideId ? state.rides.find(item => item.id === rideId) : null;
  const delivery = deliveryId ? state.deliveries.find(item => item.id === deliveryId) : null;
  if (!ride && !delivery) throw new Error('Servicio no encontrado.');
  const id = uid(emergency ? 'emergency' : 'ride-report');
  mutateState(draft => {
    const row = {
      id, reporter_id: getActiveLocalProfileId(), ride_id: rideId, delivery_id: deliveryId,
      reason: String(reason || 'Otro'), details: String(details || '').trim(), emergency: Boolean(emergency),
      status: emergency ? 'urgent' : 'pending', created_at: nowIso(), reviewed_at: null, reviewed_by: null
    };
    draft.reports.unshift(row);
    if (emergency) draft.emergency_events.unshift(row);
  }, emergency ? 'ride-emergency' : 'ride-report');
  const admins = listLocalProfiles().filter(item => ['admin','super_admin'].includes(item.role)).map(item => item.id);
  notify(admins, {
    title: emergency ? 'EMERGENCIA EN MIZONA RIDE' : 'Nuevo reporte de movilidad',
    body: `${reason}${details ? ` · ${details}` : ''}`,
    page: 'admin', type: emergency ? 'emergency' : 'moderation'
  });
  audit(emergency ? 'ride_emergency_create' : 'ride_report_create', 'ride_report', id, reason, { rideId, deliveryId });
  return id;
}

export function reviewLocalRideReport(reportId, status) {
  if (!isAdmin()) throw new Error('Solo un administrador puede revisar reportes.');
  if (!['pending','reviewing','resolved','dismissed','urgent'].includes(status)) throw new Error('Estado de reporte inválido.');
  let reporterId = null;
  mutateState(draft => {
    const report = draft.reports.find(item => item.id === reportId);
    if (!report) throw new Error('Reporte no encontrado.');
    report.status = status;
    report.reviewed_at = nowIso();
    report.reviewed_by = getActiveLocalProfileId();
    reporterId = report.reporter_id;
  }, 'ride-report-review');
  notify([reporterId], { title: 'Reporte de viaje actualizado', body: `Estado: ${status}.` });
  audit('ride_report_review', 'ride_report', reportId, status);
  return true;
}

export function resetLocalRide() {
  localStorage.removeItem(STATE_KEY);
  writeState(seedState(), 'ride-reset');
}

export const localRideLabels = {
  rideStatus: {
    searching: 'Buscando conductor', assigned: 'Conductor asignado', arriving: 'Conductor en camino',
    waiting: 'Conductor esperando', in_progress: 'Viaje en curso', completed: 'Completado', cancelled: 'Cancelado'
  },
  deliveryStatus: {
    searching: 'Buscando repartidor', assigned: 'Repartidor asignado', picked_up: 'Paquete recogido',
    in_transit: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado'
  }
};
