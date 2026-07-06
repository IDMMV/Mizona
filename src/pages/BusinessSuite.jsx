import { useMemo, useState } from 'react';
import {
  BarChart3, Banknote, CheckCircle2, ChefHat, Clock3, CreditCard,
  Minus, Package, Plus, Receipt, Search, ShoppingCart, Store, Trash2, Users
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';

const products = [
  { id: 1, name: 'Pollo a la brasa entero', category: 'Platos', price: 58.9, stock: 18, icon: '🍗' },
  { id: 2, name: '1/4 de pollo + papas', category: 'Platos', price: 18.9, stock: 34, icon: '🍽️' },
  { id: 3, name: 'Salchipapa familiar', category: 'Platos', price: 29.9, stock: 16, icon: '🍟' },
  { id: 4, name: 'Gaseosa 1.5 L', category: 'Bebidas', price: 9.5, stock: 42, icon: '🥤' },
  { id: 5, name: 'Chicha morada 1 L', category: 'Bebidas', price: 8, stock: 24, icon: '🧃' },
  { id: 6, name: 'Ensalada adicional', category: 'Extras', price: 6.5, stock: 20, icon: '🥗' },
  { id: 7, name: 'Porción de papas', category: 'Extras', price: 7.9, stock: 28, icon: '🍟' },
  { id: 8, name: 'Torta de chocolate', category: 'Postres', price: 8.5, stock: 9, icon: '🍰' }
];

const initialOrders = [
  { id: 'A-104', table: 'Mesa 4', items: 3, total: 48.3, status: 'preparing', elapsed: '08 min' },
  { id: 'A-103', table: 'Delivery', items: 5, total: 76.8, status: 'ready', elapsed: '14 min' },
  { id: 'A-102', table: 'Mesa 7', items: 2, total: 27.4, status: 'delivered', elapsed: '19 min' }
];

const inventoryRows = [
  { product: 'Pollo entero', category: 'Insumo', stock: 18, minimum: 12, unit: 'unid.' },
  { product: 'Papa precocida', category: 'Insumo', stock: 9, minimum: 10, unit: 'kg' },
  { product: 'Gaseosa 1.5 L', category: 'Bebida', stock: 42, minimum: 18, unit: 'unid.' },
  { product: 'Chicha morada', category: 'Bebida', stock: 24, minimum: 8, unit: 'L' },
  { product: 'Envases delivery', category: 'Empaque', stock: 14, minimum: 20, unit: 'unid.' }
];

const money = value => `S/ ${Number(value || 0).toFixed(2)}`;

export default function BusinessSuite() {
  const [tab, setTab] = useState('dashboard');
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('cash');
  const [cash, setCash] = useState('');
  const [orders, setOrders] = useState(initialOrders);
  const [notice, setNotice] = useState('');

  const filtered = products.filter(product =>
    (category === 'Todos' || product.category === category) &&
    product.name.toLowerCase().includes(query.toLowerCase())
  );
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const tax = total * 18 / 118;
  const change = payment === 'cash' ? Math.max(Number(cash || 0) - total, 0) : 0;

  const add = product => setCart(items => {
    const found = items.find(item => item.id === product.id);
    return found
      ? items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      : [...items, { ...product, qty: 1 }];
  });
  const quantity = (id, delta) => setCart(items => items
    .map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
    .filter(item => item.qty > 0));
  const finishSale = () => {
    if (!cart.length) return setNotice('Agrega al menos un producto al pedido.');
    if (payment === 'cash' && Number(cash || 0) < total) return setNotice('El efectivo recibido es menor que el total.');
    const id = `A-${105 + orders.length}`;
    setOrders(current => [{ id, table: 'Mostrador', items: cart.reduce((a, x) => a + x.qty, 0), total, status: 'preparing', elapsed: 'Ahora' }, ...current]);
    setCart([]); setCash(''); setNotice(`Venta ${id} registrada y enviada a cocina.`);
    setTab('kitchen');
  };
  const nextStatus = id => setOrders(current => current.map(order => order.id === id ? {
    ...order,
    status: order.status === 'preparing' ? 'ready' : order.status === 'ready' ? 'delivered' : order.status
  } : order));

  const tabs = [
    { id: 'dashboard', label: 'Resumen', icon: '📊' },
    { id: 'pos', label: 'Caja / POS', icon: '🧾' },
    { id: 'kitchen', label: 'Cocina', icon: '👨‍🍳' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'customers', label: 'Clientes', icon: '👥' },
    { id: 'reports', label: 'Reportes', icon: '📈' }
  ];

  return <div className="page businessSuitePage">
    <section className="businessSuiteHero">
      <div>
        <p className="eyebrow">Administración para negocios de cualquier rubro</p>
        <h1>MiZona Business</h1>
        <p>Caja, pedidos, cocina, inventario, clientes y reportes dentro de una sola plataforma.</p>
        <div className="businessSelector"><Store size={17}/><b>Pollería Mi Zona Centro</b><span>Sede Pachacútec</span></div>
      </div>
      <div className="businessHeroStats">
        <span><b>S/ 1,284.60</b>ventas de hoy</span>
        <span><b>38</b>pedidos</span>
        <span><b>4</b>por preparar</span>
        <span><b>2</b>alertas de stock</span>
      </div>
    </section>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>
    {notice && <div className="businessNotice"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice('')}>×</button></div>}

    {tab === 'dashboard' && <>
      <div className="businessKpis">
        <span><Banknote/><b>S/ 1,284.60</b><small>Ventas de hoy</small></span>
        <span><Receipt/><b>38</b><small>Comprobantes</small></span>
        <span><ShoppingCart/><b>S/ 33.81</b><small>Ticket promedio</small></span>
        <span><Users/><b>27</b><small>Clientes atendidos</small></span>
      </div>
      <div className="grid2">
        <Card title="Flujo de pedidos" icon="👨‍🍳">
          <div className="orderFlow">
            {orders.slice(0, 5).map(order => <div key={order.id}><b>{order.id}</b><span>{order.table} · {order.items} productos</span><em className={order.status}>{order.status === 'preparing' ? 'Preparando' : order.status === 'ready' ? 'Listo' : 'Entregado'}</em></div>)}
          </div>
        </Card>
        <Card title="Productos más vendidos" icon="🏆">
          <div className="topProducts"><span><b>1</b>1/4 pollo + papas <em>14 ventas</em></span><span><b>2</b>Pollo entero <em>9 ventas</em></span><span><b>3</b>Gaseosa 1.5 L <em>8 ventas</em></span><span><b>4</b>Salchipapa familiar <em>6 ventas</em></span></div>
        </Card>
      </div>
      <div className="grid2">
        <Card title="Resumen de caja" icon="💰"><div className="cashSummary"><span>Efectivo<b>S/ 742.30</b></span><span>Tarjeta / Yape<b>S/ 542.30</b></span><span>IGV incluido<b>S/ 195.96</b></span><span>Vuelto entregado<b>S/ 86.40</b></span></div></Card>
        <Card title="Alertas del negocio" icon="⚠️"><ul className="list"><li>La papa precocida está por debajo del stock mínimo.</li><li>Quedan 14 envases para delivery.</li><li>Un pedido lleva más de 15 minutos en cocina.</li><li>Cierre de caja programado para las 11:00 p. m.</li></ul></Card>
      </div>
    </>}

    {tab === 'pos' && <div className="posLayout">
      <section>
        <div className="posFilters"><div className="businessSearch"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar producto..."/></div><div className="chips">{['Todos','Platos','Bebidas','Extras','Postres'].map(x => <button key={x} className={category === x ? 'active' : ''} onClick={() => setCategory(x)}>{x}</button>)}</div></div>
        <div className="posProductGrid">{filtered.map(product => <button key={product.id} className="posProduct" onClick={() => add(product)}><span>{product.icon}</span><b>{product.name}</b><small>Stock: {product.stock}</small><strong>{money(product.price)}</strong></button>)}</div>
      </section>
      <aside className="cartPanel">
        <div className="cartHead"><div><ShoppingCart size={20}/><b>Pedido actual</b></div><button onClick={() => setCart([])}><Trash2 size={16}/></button></div>
        <div className="cartItems">{!cart.length && <div className="emptyCart">Selecciona productos para crear el pedido.</div>}{cart.map(item => <div className="cartItem" key={item.id}><span>{item.icon}</span><div><b>{item.name}</b><small>{money(item.price)} c/u</small></div><div className="qty"><button onClick={() => quantity(item.id,-1)}><Minus size={14}/></button><b>{item.qty}</b><button onClick={() => quantity(item.id,1)}><Plus size={14}/></button></div><strong>{money(item.price * item.qty)}</strong></div>)}</div>
        <div className="cartTotals"><span>Subtotal sin IGV<b>{money(total - tax)}</b></span><span>IGV incluido (18%)<b>{money(tax)}</b></span><span className="grandTotal">Total<b>{money(total)}</b></span></div>
        <div className="paymentMethods"><button className={payment === 'cash' ? 'active' : ''} onClick={() => setPayment('cash')}><Banknote/>Efectivo</button><button className={payment === 'digital' ? 'active' : ''} onClick={() => setPayment('digital')}><CreditCard/>Tarjeta/Yape</button></div>
        {payment === 'cash' && <><label className="cashField">Efectivo recibido<input type="number" min="0" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00"/></label><div className="changeBox"><span>Vuelto</span><b>{money(change)}</b></div></>}
        <button className="primary full finishSale" onClick={finishSale}><Receipt size={18}/>Cobrar e imprimir boleta</button>
      </aside>
    </div>}

    {tab === 'kitchen' && <div className="kitchenBoard">
      {['preparing','ready','delivered'].map(status => <section key={status}><header><span>{status === 'preparing' ? <ChefHat/> : status === 'ready' ? <CheckCircle2/> : <Receipt/>}</span><div><b>{status === 'preparing' ? 'En preparación' : status === 'ready' ? 'Listos para recoger' : 'Entregados'}</b><small>{orders.filter(x => x.status === status).length} pedidos</small></div></header><div>{orders.filter(x => x.status === status).map(order => <article key={order.id}><div><b>{order.id}</b><em><Clock3 size={13}/>{order.elapsed}</em></div><h3>{order.table}</h3><p>{order.items} productos · {money(order.total)}</p>{status !== 'delivered' && <button onClick={() => nextStatus(order.id)}>{status === 'preparing' ? 'Marcar como listo' : 'Pedido recogido'}</button>}</article>)}</div></section>)}
    </div>}

    {tab === 'inventory' && <>
      <div className="pageTitle"><div><h2>Inventario y alertas</h2><p className="muted">Controla productos, insumos y movimientos por sede.</p></div><button className="primary"><Plus size={17}/>Registrar movimiento</button></div>
      <Card title="Existencias actuales" icon="📦"><div className="inventoryTable"><div className="inventoryHead"><b>Producto</b><b>Categoría</b><b>Stock</b><b>Mínimo</b><b>Estado</b></div>{inventoryRows.map(row => <div key={row.product}><b>{row.product}</b><span>{row.category}</span><span>{row.stock} {row.unit}</span><span>{row.minimum} {row.unit}</span><em className={row.stock <= row.minimum ? 'low' : 'ok'}>{row.stock <= row.minimum ? 'Reponer' : 'Correcto'}</em></div>)}</div></Card>
    </>}

    {tab === 'customers' && <div className="grid2"><Card title="Clientes frecuentes" icon="👥"><div className="customerList"><div><b>María Torres</b><span>12 compras · S/ 438.20</span><em>Cliente frecuente</em></div><div><b>Carlos Ramírez</b><span>8 compras · S/ 292.40</span><em>Delivery</em></div><div><b>Lucía Mendoza</b><span>6 compras · S/ 183.80</span><em>Nuevo beneficio</em></div></div></Card><Card title="Fidelización" icon="🎁"><p>Configura puntos, descuentos por frecuencia y campañas para clientes del negocio.</p><div className="loyaltyStats"><span><b>86</b>clientes registrados</span><span><b>24</b>con beneficio activo</span><span><b>18%</b>recompra mensual</span></div><button className="primary">Crear campaña</button></Card></div>}

    {tab === 'reports' && <>
      <div className="businessKpis"><span><BarChart3/><b>S/ 8,742</b><small>Ventas semanales</small></span><span><Receipt/><b>264</b><small>Pedidos</small></span><span><Package/><b>S/ 3,184</b><small>Costo estimado</small></span><span><Banknote/><b>S/ 5,558</b><small>Margen bruto</small></span></div>
      <div className="grid2"><Card title="Ventas de los últimos 7 días" icon="📈"><div className="simpleBars">{[62,78,54,88,71,96,82].map((height,index)=><span key={index}><i style={{height:`${height}%`}}/><small>{['L','M','M','J','V','S','D'][index]}</small></span>)}</div></Card><Card title="Exportación y cierre" icon="📄"><p>Genera reportes de ventas, IGV, caja, inventario y utilidad por periodo.</p><div className="reportButtons"><button>Descargar Excel</button><button>Generar PDF</button><button>Imprimir cierre</button></div></Card></div>
    </>}
  </div>;
}
