import {
  AlertTriangle, Bike, CheckCircle2, Clock3, MapPin, PackageCheck, Route,
  ShieldCheck, Store, Truck, UserCheck, WalletCards
} from 'lucide-react';
import Card from '../components/Card';

const deliveryRules = [
  { title:'Estado inicial', value:'Deshabilitado para usuarios', text:'El módulo queda preparado, pero no se muestra como servicio activo hasta registrar motorizados.' },
  { title:'Entrega actual', value:'Delivery propio del proveedor', text:'Cada proveedor define su tarifa, zona, horario y comunicación con el cliente.' },
  { title:'Futuro', value:'Zona Ride Delivery', text:'Motorizados MiZona podrán recoger pedidos, hacer mandados y entregar productos.' }
];

const flow = [
  ['Marketplace', 'Cliente agrega productos o servicios al carrito.'],
  ['Proveedor', 'Acepta pedido, confirma stock, horario y costo de delivery.'],
  ['Chat', 'Cliente y proveedor coordinan detalles dentro de MiZona.'],
  ['Recibido', 'Cliente confirma recibido y califica.'],
  ['Reputación', 'MiZona registra cumplimiento, reclamos y calificación.']
];

export default function RideDelivery({ setPage }) {
  return <div className="rideDeliveryPage">
    <section className="rideDeliveryHero">
      <div>
        <span className="eyebrow">ETAPA 30.34 · PREPARADO</span>
        <h1>Zona Ride Delivery</h1>
        <p>Recojo de productos, delivery de negocios, mandados y envíos. Se mantiene deshabilitado hasta contar con motorizados activos.</p>
        <div className="heroActions">
          <button onClick={() => setPage?.('marketplace')}><Store size={18}/> Ver Marketplace</button>
          <button className="secondary" onClick={() => setPage?.('admin')}><ShieldCheck size={18}/> Configurar desde admin</button>
        </div>
      </div>
      <div className="deliveryStatusCard">
        <Truck size={42}/>
        <b>Servicio público aún no activo</b>
        <p>Por ahora se usa delivery propio de cada proveedor y comunicación por MiZona Chat.</p>
        <span><AlertTriangle size={16}/> Próximamente con motorizados</span>
      </div>
    </section>

    <div className="deliveryGrid">
      {deliveryRules.map(item => <Card key={item.title} className="deliveryRuleCard">
        <CheckCircle2/>
        <span>{item.title}</span>
        <h3>{item.value}</h3>
        <p>{item.text}</p>
      </Card>)}
    </div>

    <Card className="deliveryConfigCard">
      <div className="sectionHeader">
        <div><span>CONFIGURACIÓN DEL PROVEEDOR</span><h2>Opciones de entrega inicial</h2></div>
      </div>
      <div className="deliveryOptionsGrid">
        <article><PackageCheck/><b>Recojo en tienda</b><p>El cliente compra o reserva y recoge en el local.</p></article>
        <article><Bike/><b>Delivery propio</b><p>El proveedor entrega con su motorizado o personal.</p></article>
        <article className="locked"><Truck/><b>Zona Ride Delivery</b><p>Bloqueado hasta activar motorizados MiZona.</p></article>
        <article><MapPin/><b>Tarifa por zona</b><p>Zona 1, zona 2, zona 3 o tarifa personalizada.</p></article>
        <article><Route/><b>Tarifa por distancia</b><p>Preparado para cálculo futuro por kilómetros.</p></article>
        <article><Clock3/><b>Horario de atención</b><p>El proveedor define cuándo acepta pedidos.</p></article>
      </div>
    </Card>

    <Card className="deliveryFlowCard">
      <div className="sectionHeader">
        <div><span>FLUJO RECOMENDADO</span><h2>Pedido registrado sin prometer protección falsa</h2></div>
      </div>
      <div className="deliveryFlow">
        {flow.map(([title,text], index) => <article key={title}>
          <strong>{index + 1}</strong>
          <div><b>{title}</b><p>{text}</p></div>
        </article>)}
      </div>
      <div className="deliveryHonestNotice">
        <ShieldCheck/>
        <p><b>Mensaje recomendado:</b> “Te recomendamos registrar tu pedido en MiZona. Así quedará constancia de la operación, podrás confirmar recibido, calificar al proveedor y reportar problemas.”</p>
      </div>
    </Card>

    <Card className="deliveryAdminCard">
      <div><UserCheck/><h3>Cuando tengas motorizados</h3></div>
      <ul>
        <li>Activar repartidores por zona.</li>
        <li>Asignación manual o automática.</li>
        <li>Tarifas por zona o distancia.</li>
        <li>Multi-recojo de varios proveedores.</li>
        <li>Seguimiento por ubicación en Google Maps.</li>
      </ul>
      <div><WalletCards/><h3>Modelo de ingresos</h3></div>
      <ul>
        <li>Comisión por delivery.</li>
        <li>Comisión por venta registrada.</li>
        <li>Suscripción de negocio.</li>
        <li>Promociones destacadas.</li>
      </ul>
    </Card>
  </div>;
}
