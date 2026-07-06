import { useMemo, useState } from 'react';
import {
  Bike, Car, CheckCircle2, Clock3, MapPin, MessageCircle, Navigation,
  PackageCheck, Phone, Route, ShieldCheck, Star, Truck, UserRound
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';

const drivers = [
  { id: 1, name: 'Luis Mendoza', vehicle: 'Toyota Yaris · A7K-421', type: 'Auto', rating: 4.9, trips: 1284, eta: 4, icon: '🚗' },
  { id: 2, name: 'Carlos Rojas', vehicle: 'Hyundai Accent · B9P-317', type: 'Auto', rating: 4.8, trips: 946, eta: 6, icon: '🚙' },
  { id: 3, name: 'Ana Torres', vehicle: 'Moto Honda · 5821-KA', type: 'Moto', rating: 4.9, trips: 721, eta: 3, icon: '🏍️' }
];
const history = [
  { id: 'R-784', route: 'Pachacútec → Plaza Vea Ventanilla', date: 'Hoy, 9:20 a. m.', amount: 12.5, status: 'Completado' },
  { id: 'R-783', route: 'Mercado Central → Colegio San Martín', date: 'Ayer, 6:40 p. m.', amount: 9.8, status: 'Completado' },
  { id: 'D-218', route: 'Bodega Los Pinos → Sector B', date: 'Ayer, 1:15 p. m.', amount: 7.5, status: 'Entregado' }
];

const money = value => `S/ ${Number(value).toFixed(2)}`;

export default function Ride() {
  const [tab, setTab] = useState('request');
  const [service, setService] = useState('auto');
  const [origin, setOrigin] = useState('Pachacútec, Ventanilla');
  const [destination, setDestination] = useState('Plaza Vea Ventanilla');
  const [request, setRequest] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [delivery, setDelivery] = useState(null);
  const [notice, setNotice] = useState('');

  const prices = { moto: 7.5, auto: 12.5, van: 19.9 };
  const estimate = useMemo(() => prices[service] || 12.5, [service]);
  const statuses = ['Solicitud creada', 'Conductor asignado', 'Conductor en camino', 'Viaje iniciado', 'Completado'];

  const createRequest = () => {
    if (!origin.trim() || !destination.trim()) return setNotice('Completa el origen y el destino.');
    setRequest({ id: `R-${Math.floor(800 + Math.random() * 90)}`, service, origin, destination, estimate });
    setSelectedDriver(null); setStatusIndex(0); setNotice('Solicitud creada. Selecciona un conductor disponible.'); setTab('drivers');
  };
  const chooseDriver = driver => {
    setSelectedDriver(driver); setStatusIndex(1); setNotice(`${driver.name} fue asignado al viaje.`); setTab('tracking');
  };
  const advance = () => setStatusIndex(index => Math.min(index + 1, statuses.length - 1));
  const createDelivery = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDelivery({ id: `D-${Math.floor(230 + Math.random() * 50)}`, pickup: form.get('pickup'), dropoff: form.get('dropoff'), content: form.get('content'), price: 9.5, status: 'Buscando repartidor' });
    setNotice('Envío registrado. Un repartidor cercano recibirá la solicitud.');
  };

  const tabs = [
    { id: 'request', label: 'Pedir viaje', icon: '🚗' },
    { id: 'drivers', label: 'Conductores', icon: '🧑‍✈️' },
    { id: 'tracking', label: 'Seguimiento', icon: '📍' },
    { id: 'delivery', label: 'Delivery / Envíos', icon: '📦' },
    { id: 'history', label: 'Historial', icon: '🧾' }
  ];

  return <div className="page ridePage">
    <section className="rideHero">
      <div>
        <p className="eyebrow">Movilidad y entregas dentro de tu zona</p>
        <h1>MiZona Ride</h1>
        <p>Solicita viajes, envíos y delivery con conductores verificados, seguimiento y código de seguridad.</p>
        <div className="rideTrust"><ShieldCheck size={18}/>Conductores validados · Viajes registrados · Soporte local</div>
      </div>
      <div className="rideHeroStats"><span><b>24</b>conductores cerca</span><span><b>4 min</b>tiempo promedio</span><span><b>4.8 ★</b>calificación</span><span><b>92</b>viajes hoy</span></div>
    </section>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>
    {notice && <div className="rideNotice"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice('')}>×</button></div>}

    {tab === 'request' && <div className="rideRequestLayout">
      <Card title="¿A dónde vas?" icon="📍">
        <div className="routeFields">
          <label><span className="originDot"/>Origen<input value={origin} onChange={e => setOrigin(e.target.value)} /></label>
          <i/>
          <label><span className="destinationDot"/>Destino<input value={destination} onChange={e => setDestination(e.target.value)} /></label>
        </div>
        <div className="servicePicker">
          <button className={service === 'moto' ? 'active' : ''} onClick={() => setService('moto')}><Bike/><b>Moto</b><span>{money(prices.moto)}</span></button>
          <button className={service === 'auto' ? 'active' : ''} onClick={() => setService('auto')}><Car/><b>Auto</b><span>{money(prices.auto)}</span></button>
          <button className={service === 'van' ? 'active' : ''} onClick={() => setService('van')}><Truck/><b>Van</b><span>{money(prices.van)}</span></button>
        </div>
        <div className="rideEstimate"><div><Route size={18}/><span>Distancia estimada<b>6.4 km</b></span></div><div><Clock3 size={18}/><span>Duración estimada<b>18–24 min</b></span></div><strong>{money(estimate)}</strong></div>
        <button className="primary full rideRequestButton" onClick={createRequest}><Navigation size={18}/>Buscar conductor</button>
      </Card>
      <aside className="rideMapMock"><div className="mapRoad roadOne"/><div className="mapRoad roadTwo"/><span className="mapOrigin">A</span><span className="mapDestination">B</span><span className="mapCar car1">🚗</span><span className="mapCar car2">🏍️</span><span className="mapCar car3">🚙</span><div className="mapLabel"><b>Zona de cobertura</b><span>Ventanilla · Pachacútec · Mi Perú</span></div></aside>
    </div>}

    {tab === 'drivers' && <>
      <div className="pageTitle"><div><h2>Conductores disponibles</h2><p className="muted">Elige una opción verificada cercana a tu punto de partida.</p></div>{request && <span className="requestCode">Solicitud {request.id} · {money(request.estimate)}</span>}</div>
      <div className="driverGrid">{drivers.filter(driver => service !== 'moto' || driver.type === 'Moto').map(driver => <article className="driverCard" key={driver.id}><div className="driverAvatar">{driver.icon}</div><div><h3>{driver.name}</h3><p>{driver.vehicle}</p><div className="driverMeta"><span><Star size={14}/> {driver.rating}</span><span>{driver.trips} viajes</span><span><Clock3 size={14}/> {driver.eta} min</span></div></div><div className="driverActions"><button onClick={() => chooseDriver(driver)}>Elegir conductor</button><button className="ghost"><MessageCircle size={16}/></button></div></article>)}</div>
      <Card title="Seguridad antes de subir" icon="🛡️"><div className="safetyGrid"><span>1. Verifica placa y modelo.</span><span>2. Confirma la foto del conductor.</span><span>3. Comparte tu viaje con un contacto.</span><span>4. No entregues el código hasta subir.</span></div></Card>
    </>}

    {tab === 'tracking' && <div className="trackingLayout">
      <section className="trackingCard">
        {!request && <div className="emptyTracking"><Car size={42}/><h2>Aún no tienes un viaje activo</h2><p>Crea una solicitud para comenzar el seguimiento.</p><button className="primary" onClick={() => setTab('request')}>Pedir viaje</button></div>}
        {request && <><div className="trackingHeader"><div><small>{request.id}</small><h2>{statuses[statusIndex]}</h2><p>{request.origin} → {request.destination}</p></div><span>{money(request.estimate)}</span></div>
          {selectedDriver && <div className="assignedDriver"><div className="driverAvatar">{selectedDriver.icon}</div><div><b>{selectedDriver.name}</b><span>{selectedDriver.vehicle} · ⭐ {selectedDriver.rating}</span></div><button><Phone size={17}/></button><button><MessageCircle size={17}/></button></div>}
          <div className="statusTimeline">{statuses.map((status,index) => <div key={status} className={index <= statusIndex ? 'done' : ''}><span>{index < statusIndex ? '✓' : index + 1}</span><div><b>{status}</b><small>{index === statusIndex ? 'Estado actual' : index < statusIndex ? 'Completado' : 'Pendiente'}</small></div></div>)}</div>
          <div className="securityCode"><ShieldCheck/><div><small>Código de seguridad</small><b>4729</b></div><span>Muéstralo únicamente al conductor asignado.</span></div>
          {statusIndex < statuses.length - 1 && <button className="primary full" onClick={advance}>Simular siguiente estado</button>}
        </>}
      </section>
      <aside><Card title="Ayuda durante el viaje" icon="🆘"><div className="helpButtons"><button>Compartir ubicación</button><button>Contactar soporte</button><button className="dangerAction">Reportar emergencia</button></div></Card><Card title="Pago" icon="💳"><p>Yape / tarjeta registrada</p><b>{request ? money(request.estimate) : 'S/ 0.00'}</b><small className="muted">El cobro se confirma al terminar.</small></Card></aside>
    </div>}

    {tab === 'delivery' && <div className="grid2">
      <Card title="Solicitar envío" icon="📦"><form className="deliveryForm" onSubmit={createDelivery}><label>Punto de recojo<input name="pickup" required placeholder="Dirección o negocio"/></label><label>Punto de entrega<input name="dropoff" required placeholder="Dirección del destinatario"/></label><label>¿Qué se enviará?<input name="content" required placeholder="Documento, compra, comida..."/></label><div className="deliveryTypes"><button type="button"><Bike/>Moto</button><button type="button"><Car/>Auto</button></div><button className="primary full" type="submit"><PackageCheck size={17}/>Solicitar repartidor</button></form></Card>
      <Card title="Estado del envío" icon="🛵">{delivery ? <div className="deliveryStatus"><span>📦</span><h3>{delivery.id}</h3><p>{delivery.pickup} → {delivery.dropoff}</p><b>{delivery.status}</b><div><span>Contenido</span><strong>{delivery.content}</strong></div><div><span>Tarifa estimada</span><strong>{money(delivery.price)}</strong></div><button className="ghost full">Cancelar solicitud</button></div> : <div className="emptyDelivery">Crea un envío para ver aquí su seguimiento.</div>}</Card>
    </div>}

    {tab === 'history' && <><div className="rideHistoryStats"><span><b>18</b>viajes este mes</span><span><b>S/ 184.60</b>gastado</span><span><b>4.9</b>tu calificación</span></div><Card title="Actividad reciente" icon="🧾"><div className="rideHistory">{history.map(item => <div key={item.id}><span className="historyIcon">{item.id.startsWith('D') ? '📦' : '🚗'}</span><div><b>{item.route}</b><small>{item.id} · {item.date}</small></div><em>{item.status}</em><strong>{money(item.amount)}</strong></div>)}</div></Card></>}
  </div>;
}
