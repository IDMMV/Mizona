import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bike, Car, CheckCircle2, Clock3, Copy, CreditCard, DollarSign, MapPin, Navigation, Package, PackageCheck, Phone, Receipt, Route, ShieldCheck, Star, Truck, UserCheck, UserRound, WalletCards } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import {
  acceptLocalDelivery,
  acceptLocalRideRequest,
  cancelLocalRideRequest,
  confirmLocalRideCode,
  createLocalDelivery,
  createLocalRideReport,
  createLocalRideRequest,
  getLocalRideSnapshot,
  localRideLabels,
  rateLocalRide,
  registerLocalDriver,
  subscribeLocalRide,
  toggleLocalDriverOnline,
  updateLocalDeliveryStatus,
  updateLocalRideStatus
} from '../lib/localRide';

const money = value => `S/ ${Number(value || 0).toFixed(2)}`;
const dateTime = value => value ? new Intl.DateTimeFormat('es-PE', { dateStyle:'short', timeStyle:'short' }).format(new Date(value)) : '—';
const rideStatus = value => localRideLabels.rideStatus[value] || value;
const deliveryStatus = value => localRideLabels.deliveryStatus[value] || value;

function Message({ text, clear }) {
  if (!text) return null;
  const error = text.startsWith('Error:');
  return <div className={`rideNotice ${error ? 'rideNoticeError' : ''}`}>
    {error ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>} {text.replace(/^Error:\s*/, '')}
    <button onClick={clear}>×</button>
  </div>;
}

function StatusBadge({ value, delivery = false }) {
  const label = delivery ? deliveryStatus(value) : rideStatus(value);
  return <span className={`rideStatusBadge status-${value}`}>{label}</span>;
}

function Empty({ icon='🚗', title, text, action }) {
  return <div className="emptyTracking"><span style={{fontSize:48}}>{icon}</span><h2>{title}</h2><p>{text}</p>{action}</div>;
}

function RequestRide({ snapshot, refresh, notify, goTracking }) {
  const [serviceType, setServiceType] = useState('auto');
  const [origin, setOrigin] = useState(snapshot.profile.zone || 'Pachacútec, Ventanilla');
  const [destination, setDestination] = useState('Plaza Vea Ventanilla');
  const [distanceKm, setDistanceKm] = useState(6.4);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const estimates = useMemo(() => ({
    moto: 4 + Number(distanceKm || 0) * 1.2,
    auto: 6 + Number(distanceKm || 0) * 1.7,
    van: 9 + Number(distanceKm || 0) * 2.4
  }), [distanceKm]);

  const submit = event => {
    event.preventDefault();
    try {
      createLocalRideRequest({ serviceType, origin, destination, distanceKm, paymentMethod });
      refresh();
      notify('Solicitud creada. Un conductor verificado podrá aceptarla desde otra sesión.');
      goTracking();
    } catch (error) { notify(`Error: ${error.message}`); }
  };

  return <div className="rideRequestLayout">
    <Card title="¿A dónde vas?" icon={<MapPin size={18}/>}>
      {snapshot.activePassengerRide ? <Empty icon={<Car size={18}/>} title="Ya tienes un viaje activo" text={`${snapshot.activePassengerRide.origin} → ${snapshot.activePassengerRide.destination}`} action={<button className="primary" onClick={goTracking}>Ver seguimiento</button>}/> : <form onSubmit={submit} className="rideRequestForm">
        <div className="routeFields">
          <label><span className="originDot"/>Origen<input value={origin} onChange={e=>setOrigin(e.target.value)} required/></label>
          <i/>
          <label><span className="destinationDot"/>Destino<input value={destination} onChange={e=>setDestination(e.target.value)} required/></label>
        </div>
        <div className="servicePicker">
          <button type="button" className={serviceType==='moto'?'active':''} onClick={()=>setServiceType('moto')}><Bike/><b>Moto</b><span>{money(estimates.moto)}</span></button>
          <button type="button" className={serviceType==='auto'?'active':''} onClick={()=>setServiceType('auto')}><Car/><b>Auto</b><span>{money(estimates.auto)}</span></button>
          <button type="button" className={serviceType==='van'?'active':''} onClick={()=>setServiceType('van')}><Truck/><b>Van</b><span>{money(estimates.van)}</span></button>
        </div>
        <div className="rideMiniFields">
          <label>Distancia estimada (km)<input type="number" min="1" max="60" step="0.1" value={distanceKm} onChange={e=>setDistanceKm(e.target.value)}/></label>
          <label>Pago<select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="cash">Efectivo</option><option value="digital">Yape / Plin</option><option value="card">Tarjeta</option></select></label>
        </div>
        <div className="rideEstimate"><div><Route size={18}/><span>Distancia<b>{distanceKm || 0} km</b></span></div><div><Clock3 size={18}/><span>Duración<b>{Math.max(8,Math.round(Number(distanceKm||0)*3.2))} min</b></span></div><strong>{money(estimates[serviceType])}</strong></div>
        <button className="primary full rideRequestButton" type="submit"><Navigation size={18}/>Buscar conductor</button>
      </form>}
    </Card>
    <aside className="rideMapMock"><div className="mapRoad roadOne"/><div className="mapRoad roadTwo"/><span className="mapOrigin">A</span><span className="mapDestination">B</span><span className="mapCar car1">🚗</span><span className="mapCar car2">🏍️</span><span className="mapCar car3">🚙</span><div className="mapLabel"><b>Simulación local</b><span>La ruta real se conectará después a un proveedor de mapas.</span></div></aside>
  </div>;
}

function PassengerTracking({ snapshot, refresh, notify }) {
  const ride = snapshot.activePassengerRide;
  const delivery = snapshot.activePassengerDelivery;
  const share = async item => {
    const text = item.origin ? `${item.code}: ${item.origin} → ${item.destination}. Estado: ${rideStatus(item.status)}.` : `${item.code}: ${item.pickup} → ${item.dropoff}. Estado: ${deliveryStatus(item.status)}.`;
    try { await navigator.clipboard.writeText(text); notify('Resumen copiado para compartir con un contacto de confianza.'); }
    catch { notify(text); }
  };
  const emergency = item => {
    if (!window.confirm('¿Registrar una alerta de emergencia local para administradores?')) return;
    try { createLocalRideReport({ rideId:item.origin ? item.id : null, deliveryId:item.pickup ? item.id : null, reason:'Alerta de seguridad', details:'El usuario activó el botón de emergencia.', emergency:true }); refresh(); notify('Alerta local registrada y enviada a los administradores de prueba.'); }
    catch(error){ notify(`Error: ${error.message}`); }
  };
  if (!ride && !delivery) return <Card title="Seguimiento" icon={<MapPin size={18}/>}><Empty title="No tienes servicios activos" text="Solicita un viaje o envío para comenzar."/></Card>;
  const item = ride || delivery;
  const driver = item.driver;
  return <div className="trackingLayout">
    <section className="trackingCard">
      <div className="trackingHeader"><div><small>{item.code}</small><h2>{ride ? rideStatus(item.status) : deliveryStatus(item.status)}</h2><p>{ride ? `${item.origin} → ${item.destination}` : `${item.pickup} → ${item.dropoff}`}</p></div><span>{money(item.fare)}</span></div>
      {driver ? <div className="assignedDriver"><div className="driverAvatar">{driver.vehicle_type==='moto'?'🏍️':driver.vehicle_type==='van'?'🚐':'🚗'}</div><div><b>{driver.profile?.display_name || 'Conductor'}</b><span>{driver.vehicle_brand} {driver.vehicle_model} · {driver.plate} · ⭐ {driver.rating}</span></div><button title="Llamada simulada"><Phone size={17}/></button></div> : <div className="rideSearchingPulse"><span/>Buscando conductor disponible…</div>}
      <div className="rideRouteSummary"><span><MapPin/>Inicio<b>{ride?item.origin:item.pickup}</b></span><i/><span><MapPin/>Destino<b>{ride?item.destination:item.dropoff}</b></span></div>
      {ride?.security_code && !['in_progress','completed','cancelled'].includes(ride.status) && <div className="securityCode"><ShieldCheck/><div><small>Código de seguridad</small><b>{ride.security_code}</b></div><span>Solo entrégalo al conductor que aparece en pantalla.</span></div>}
      <div className="rideTrackingActions"><button onClick={()=>share(item)}><Copy size={16}/>Compartir estado</button><button className="dangerAction" onClick={()=>emergency(item)}><AlertTriangle size={16}/>Emergencia</button></div>
      {ride?.status==='searching' && <button className="ghost full" onClick={()=>{try{cancelLocalRideRequest(ride.id);refresh();notify('Viaje cancelado.');}catch(error){notify(`Error: ${error.message}`);}}}>Cancelar solicitud</button>}
      {ride?.status==='completed' && !ride.rating && <RideRating ride={ride} refresh={refresh} notify={notify}/>} 
    </section>
    <aside>
      <Card title="Seguridad" icon={<ShieldCheck size={18}/>}><ul className="list"><li>Verifica placa, vehículo y nombre.</li><li>No compartas el código con terceros.</li><li>Comparte el viaje con alguien de confianza.</li><li>La alerta de esta etapa es solo una simulación local.</li></ul></Card>
      <Card title="Pago" icon={<CreditCard size={18}/>}><p>{item.payment_method==='cash'?'Efectivo':item.payment_method==='digital'?'Yape / Plin':'Tarjeta'}</p><b>{money(item.fare)}</b></Card>
    </aside>
  </div>;
}

function RideRating({ ride, refresh, notify }) {
  const [rating,setRating]=useState(5); const [comment,setComment]=useState('');
  return <div className="rideRatingBox"><h3>Califica el viaje</h3><div className="rideStars">{[1,2,3,4,5].map(n=><button key={n} className={n<=rating?'active':''} onClick={()=>setRating(n)}>★</button>)}</div><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comentario opcional"/><button className="primary" onClick={()=>{try{rateLocalRide(ride.id,rating,comment);refresh();notify('Calificación guardada.');}catch(error){notify(`Error: ${error.message}`);}}}>Enviar calificación</button></div>;
}

function DeliveryRequest({ snapshot, refresh, notify, goTracking }) {
  const [form,setForm]=useState({pickup:'Farmacia Económica',dropoff:'Sector B, Pachacútec',content:'Documento o paquete',packageType:'package',distanceKm:4,paymentMethod:'cash',recipientName:'',recipientPhone:''});
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const estimate=5+Number(form.distanceKm||0)*1.35+(form.packageType==='food'?2:form.packageType==='document'?0:1);
  const submit=event=>{event.preventDefault();try{createLocalDelivery(form);refresh();notify('Envío creado. Un repartidor podrá aceptarlo desde otra sesión.');goTracking();}catch(error){notify(`Error: ${error.message}`);}};
  return <div className="grid2">
    <Card title="Solicitar envío" icon={<Package size={18}/>}>
      {snapshot.activePassengerDelivery ? <Empty icon={<Bike size={18}/>} title="Ya tienes un envío activo" text={`${snapshot.activePassengerDelivery.pickup} → ${snapshot.activePassengerDelivery.dropoff}`} action={<button className="primary" onClick={goTracking}>Ver seguimiento</button>}/> : <form className="deliveryForm" onSubmit={submit}>
        <label>Punto de recojo<input value={form.pickup} onChange={e=>update('pickup',e.target.value)} required/></label>
        <label>Punto de entrega<input value={form.dropoff} onChange={e=>update('dropoff',e.target.value)} required/></label>
        <label>¿Qué se enviará?<input value={form.content} onChange={e=>update('content',e.target.value)} required/></label>
        <div className="rideMiniFields"><label>Tipo<select value={form.packageType} onChange={e=>update('packageType',e.target.value)}><option value="package">Paquete</option><option value="food">Comida</option><option value="document">Documento</option></select></label><label>Distancia km<input type="number" min="1" max="60" step="0.1" value={form.distanceKm} onChange={e=>update('distanceKm',e.target.value)}/></label></div>
        <div className="rideMiniFields"><label>Destinatario<input value={form.recipientName} onChange={e=>update('recipientName',e.target.value)} /></label><label>Teléfono<input value={form.recipientPhone} onChange={e=>update('recipientPhone',e.target.value)} /></label></div>
        <label>Pago<select value={form.paymentMethod} onChange={e=>update('paymentMethod',e.target.value)}><option value="cash">Efectivo</option><option value="digital">Yape / Plin</option><option value="card">Tarjeta</option></select></label>
        <button className="primary full" type="submit"><PackageCheck size={17}/>Solicitar repartidor · {money(estimate)}</button>
      </form>}
    </Card>
    <Card title="Cómo funciona" icon={<Bike size={18}/>}><div className="statusTimeline"><div className="done"><span>1</span><div><b>Solicita</b><small>Registra recojo, destino y contenido.</small></div></div><div><span>2</span><div><b>Asignación</b><small>Un conductor verificado acepta.</small></div></div><div><span>3</span><div><b>Recojo y traslado</b><small>El estado se actualiza entre pestañas.</small></div></div><div><span>4</span><div><b>Entrega</b><small>Se registra una constancia local.</small></div></div></div></Card>
  </div>;
}

function DriverCenter({ snapshot, refresh, notify }) {
  const driver=snapshot.driver;
  const [code,setCode]=useState('');
  const [proof,setProof]=useState('Entregado al destinatario');
  if (!driver) return <DriverRegistration refresh={refresh} notify={notify}/>;
  if (driver.status!=='verified') return <Card title="Solicitud de conductor" icon={<UserCheck size={18}/>}><div className="driverApprovalState"><UserCheck size={42}/><h2>Estado: {driver.status}</h2><p>Tu solicitud debe ser aprobada por un administrador local antes de aceptar viajes.</p><div className="driverDocumentGrid"><span>Vehículo<b>{driver.vehicle_brand} {driver.vehicle_model}</b></span><span>Placa<b>{driver.plate}</b></span><span>Documentos<b>{driver.documents_ok?'Registrados':'Pendientes'}</b></span></div></div></Card>;
  const activeRide=snapshot.activeDriverRide;
  const activeDelivery=snapshot.activeDriverDelivery;
  const acceptRide=id=>{try{acceptLocalRideRequest(id);refresh();notify('Viaje aceptado.');}catch(error){notify(`Error: ${error.message}`);}};
  const acceptDelivery=id=>{try{acceptLocalDelivery(id);refresh();notify('Envío aceptado.');}catch(error){notify(`Error: ${error.message}`);}};
  const changeRide=(id,status)=>{try{updateLocalRideStatus(id,status);refresh();notify(`Viaje actualizado: ${rideStatus(status)}.`);}catch(error){notify(`Error: ${error.message}`);}};
  const changeDelivery=(id,status)=>{try{updateLocalDeliveryStatus(id,status,proof);refresh();notify(`Envío actualizado: ${deliveryStatus(status)}.`);}catch(error){notify(`Error: ${error.message}`);}};
  return <div className="driverCenter">
    <section className="driverDashboardHeader"><div><span className={driver.online?'onlineDot':'offlineDot'}/><div><h2>Panel del conductor</h2><p>{driver.vehicle_brand} {driver.vehicle_model} · {driver.plate}</p></div></div><button className={driver.online?'driverOnlineButton active':'driverOnlineButton'} onClick={()=>{try{toggleLocalDriverOnline(!driver.online);refresh();notify(driver.online?'Ahora estás fuera de línea.':'Ahora estás disponible.');}catch(error){notify(`Error: ${error.message}`);}}}>{driver.online?'Disponible':'Fuera de línea'}</button></section>
    <div className="driverStats"><span><b>{driver.trips_completed}</b> servicios</span><span><b>{driver.rating} ★</b> calificación</span><span><b>{money(driver.earnings)}</b> ganancias locales</span><span><b>{snapshot.openServices}</b> solicitudes abiertas</span></div>
    {(activeRide||activeDelivery) && <Card title="Servicio activo" icon={<MapPin size={18}/>}>
      {activeRide && <div className="driverActiveService"><div><span>{activeRide.code}</span><h3>{activeRide.origin} → {activeRide.destination}</h3><p>Pasajero: {activeRide.passenger?.display_name} · {money(activeRide.fare)}</p><StatusBadge value={activeRide.status}/></div><div className="driverStatusActions">{activeRide.status==='assigned'&&<button onClick={()=>changeRide(activeRide.id,'arriving')}>Voy al origen</button>}{activeRide.status==='arriving'&&<button onClick={()=>changeRide(activeRide.id,'waiting')}>Llegué</button>}{['assigned','arriving','waiting'].includes(activeRide.status)&&<div className="rideCodeEntry"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código de 4 dígitos" maxLength={4}/><button className="primary" onClick={()=>{try{confirmLocalRideCode(activeRide.id,code);setCode('');refresh();notify('Código correcto. Viaje iniciado.');}catch(error){notify(`Error: ${error.message}`);}}}>Iniciar viaje</button></div>}{activeRide.status==='in_progress'&&<button className="primary" onClick={()=>changeRide(activeRide.id,'completed')}>Completar viaje</button>}</div></div>}
      {activeDelivery && <div className="driverActiveService"><div><span>{activeDelivery.code}</span><h3>{activeDelivery.pickup} → {activeDelivery.dropoff}</h3><p>{activeDelivery.content} · {money(activeDelivery.fare)}</p><StatusBadge value={activeDelivery.status} delivery/></div><div className="driverStatusActions">{activeDelivery.status==='assigned'&&<button onClick={()=>changeDelivery(activeDelivery.id,'picked_up')}>Paquete recogido</button>}{activeDelivery.status==='picked_up'&&<button onClick={()=>changeDelivery(activeDelivery.id,'in_transit')}>Iniciar traslado</button>}{activeDelivery.status==='in_transit'&&<><input value={proof} onChange={e=>setProof(e.target.value)} placeholder="Constancia de entrega"/><button className="primary" onClick={()=>changeDelivery(activeDelivery.id,'delivered')}>Confirmar entrega</button></>}</div></div>}
    </Card>}
    {!activeRide&&!activeDelivery&&<div className="grid2"><Card title="Viajes disponibles" icon={<Car size={18}/>}><div className="rideAvailableList">{snapshot.availableRides.length?snapshot.availableRides.map(item=><article key={item.id}><div><b>{item.origin} → {item.destination}</b><span>{item.passenger?.display_name} · {item.distance_km} km · {money(item.fare)}</span></div><button disabled={!driver.online} onClick={()=>acceptRide(item.id)}>Aceptar</button></article>):<p className="muted">No hay viajes pendientes.</p>}</div></Card><Card title="Envíos disponibles" icon={<Package size={18}/>}><div className="rideAvailableList">{snapshot.availableDeliveries.length?snapshot.availableDeliveries.map(item=><article key={item.id}><div><b>{item.pickup} → {item.dropoff}</b><span>{item.content} · {item.distance_km} km · {money(item.fare)}</span></div><button disabled={!driver.online} onClick={()=>acceptDelivery(item.id)}>Aceptar</button></article>):<p className="muted">No hay envíos pendientes.</p>}</div></Card></div>}
  </div>;
}

function DriverRegistration({ refresh, notify }) {
  const [form,setForm]=useState({vehicleType:'auto',brand:'Toyota',model:'Yaris',plate:'',color:'Plata',licenseNumber:'',documentsOk:true});
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const submit=event=>{event.preventDefault();try{registerLocalDriver(form);refresh();notify('Solicitud de conductor registrada. Un administrador debe aprobarla.');}catch(error){notify(`Error: ${error.message}`);}};
  return <Card title="Registrarme como conductor" icon={<UserCheck size={18}/>}><form className="driverRegisterForm" onSubmit={submit}><div className="rideMiniFields"><label>Tipo de vehículo<select value={form.vehicleType} onChange={e=>update('vehicleType',e.target.value)}><option value="moto">Moto</option><option value="auto">Auto</option><option value="van">Van</option></select></label><label>Placa<input value={form.plate} onChange={e=>update('plate',e.target.value.toUpperCase())} required/></label></div><div className="rideMiniFields"><label>Marca<input value={form.brand} onChange={e=>update('brand',e.target.value)} required/></label><label>Modelo<input value={form.model} onChange={e=>update('model',e.target.value)} required/></label></div><div className="rideMiniFields"><label>Color<input value={form.color} onChange={e=>update('color',e.target.value)}/></label><label>Número de licencia<input value={form.licenseNumber} onChange={e=>update('licenseNumber',e.target.value)} required/></label></div><label className="checkLine"><input type="checkbox" checked={form.documentsOk} onChange={e=>update('documentsOk',e.target.checked)}/> Declaro que licencia, SOAT y documentos del vehículo están vigentes.</label><button className="primary" type="submit">Enviar solicitud</button></form></Card>;
}

function History({ snapshot, refresh, notify }) {
  const rows=[...snapshot.myRides.map(item=>({...item,kind:'ride'})),...snapshot.myDeliveries.map(item=>({...item,kind:'delivery'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const completed=rows.filter(item=>['completed','delivered'].includes(item.status));
  const spent=completed.filter(item=>(item.kind==='ride'?item.passenger_id:item.customer_id)===snapshot.profile.id).reduce((sum,item)=>sum+Number(item.fare||0),0);
  return <><div className="rideHistoryStats"><span><b>{rows.length}</b>servicios</span><span><b>{completed.length}</b>completados</span><span><b>{money(spent)}</b>gastado</span></div><Card title="Historial local" icon={<Receipt size={18}/>}><div className="rideHistory">{rows.length?rows.map(item=><div key={item.id}><span className="historyIcon">{item.kind==='ride'?'🚗':'📦'}</span><div><b>{item.kind==='ride'?`${item.origin} → ${item.destination}`:`${item.pickup} → ${item.dropoff}`}</b><small>{item.code} · {dateTime(item.created_at)}</small></div><strong>{money(item.fare)}</strong><em>{item.kind==='ride'?rideStatus(item.status):deliveryStatus(item.status)}</em>{item.kind==='ride'&&item.status==='completed'&&!item.rating&&item.passenger_id===snapshot.profile.id&&<button className="ghost" onClick={()=>{const score=Number(prompt('Calificación de 1 a 5','5'));if(!score)return;try{rateLocalRide(item.id,score,'');refresh();notify('Calificación guardada.');}catch(error){notify(`Error: ${error.message}`);}}}>Calificar</button>}</div>):<p className="muted">Todavía no hay servicios.</p>}</div></Card></>;
}

export default function Ride() {
  const { profile } = useApp();
  const [snapshot,setSnapshot]=useState(getLocalRideSnapshot);
  const [tab,setTab]=useState('request');
  const [message,setMessage]=useState('');
  const refresh=()=>setSnapshot(getLocalRideSnapshot());
  useEffect(()=>subscribeLocalRide(refresh),[]);
  useEffect(()=>refresh(),[profile.id]);
  const notify=text=>setMessage(text);
  const tabs=[
    {id:'request',label:'Pedir viaje',icon:'🚗'},
    {id:'tracking',label:'Seguimiento',icon:'📍'},
    {id:'delivery',label:'Envíos',icon:'📦'},
    {id:'driver',label:snapshot.driver?'Panel conductor':'Ser conductor',icon:'🧑‍✈️'},
    {id:'history',label:'Historial',icon:'🧾'}
  ];
  return <div className="page ridePage rideStage20">
    <section className="rideHero"><div><p className="eyebrow">Etapa 20 · movilidad multiusuario local</p><h1>MiZona Ride</h1><p>Pasajeros, conductores y repartidores pueden probar el flujo completo entre pestañas del mismo navegador.</p><div className="rideTrust"><ShieldCheck size={18}/>Perfiles adultos · Conductores verificados · Código de seguridad</div></div><div className="rideHeroStats"><span><b>{snapshot.verifiedOnlineDrivers}</b>conductores disponibles</span><span><b>{snapshot.openServices}</b>servicios abiertos</span><span><b>{snapshot.completedServices}</b>completados</span><span><b>{snapshot.pendingDrivers}</b>conductores pendientes</span></div></section>
    <Tabs tabs={tabs} active={tab} setActive={setTab}/>
    <Message text={message} clear={()=>setMessage('')}/>
    {tab==='request'&&<RequestRide snapshot={snapshot} refresh={refresh} notify={notify} goTracking={()=>setTab('tracking')}/>} 
    {tab==='tracking'&&<PassengerTracking snapshot={snapshot} refresh={refresh} notify={notify}/>} 
    {tab==='delivery'&&<DeliveryRequest snapshot={snapshot} refresh={refresh} notify={notify} goTracking={()=>setTab('tracking')}/>} 
    {tab==='driver'&&<DriverCenter snapshot={snapshot} refresh={refresh} notify={notify}/>} 
    {tab==='history'&&<History snapshot={snapshot} refresh={refresh} notify={notify}/>} 
  </div>;
}
