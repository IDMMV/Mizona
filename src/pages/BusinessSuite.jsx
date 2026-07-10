import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Banknote, BarChart3, CheckCircle2, ChefHat, ClipboardList, Clock3, CreditCard,
  Download, Minus, Package, Plus, Printer, Receipt, Search, Settings, ShoppingCart,
  Store, Trash2, Truck, UserPlus, Users, WalletCards, XCircle
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import {
  addLocalBusinessWorker,
  adjustLocalBusinessStock,
  closeLocalCashSession,
  createLocalBusinessCustomer,
  createLocalBusinessExpense,
  createLocalBusinessProduct,
  createLocalBusinessSale,
  createLocalBusinessWorkspace,
  getActiveBusinessId,
  getLocalBusinessSnapshot,
  listLocalBusinessWorkspaces,
  openLocalCashSession,
  setActiveBusinessId,
  subscribeLocalBusiness,
  updateLocalBusinessOrderStatus,
  updateLocalBusinessWorker
} from '../lib/localBusiness';
import { listLocalProfiles } from '../lib/localStore';

const money = value => `S/ ${Number(value || 0).toFixed(2)}`;
const roleLabel = { platform_admin:'Administrador de plataforma', owner:'Propietario', manager:'Administrador', cashier:'Caja', cook:'Cocina', waiter:'Mozo' };
const statusLabel = { received:'Nuevo', preparing:'Preparando', ready:'Listo', delivered:'Entregado', cancelled:'Cancelado' };
const can = (role, ...allowed) => role === 'platform_admin' || role === 'owner' || allowed.includes(role);

function downloadCsv(filename, rows){
  const content = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type:'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function EmptyWorkspace({ profile, onCreated }){
  const [form,setForm]=useState({name:'',category:'Restaurante',ruc:'',zone:profile.zone||'',address:'',phone:''});
  const [error,setError]=useState('');
  const submit=e=>{e.preventDefault();try{const id=createLocalBusinessWorkspace(form);onCreated(id);}catch(err){setError(err.message);}};
  return <div className="page businessSuitePage"><section className="businessSuiteHero"><div><p className="eyebrow">Etapa 19 · Multiusuario local</p><h1>Crea tu primer negocio</h1><p>MiZona Business separa la información de cada empresa y permite trabajar con caja, cocina, inventario, personal y reportes.</p></div></section><Card title="Registrar negocio" icon="🏪"><form className="businessCreateForm" onSubmit={submit}><label>Nombre comercial<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. Pollería El Buen Sabor" required/></label><label>Rubro<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Restaurante</option><option>Bodega</option><option>Farmacia</option><option>Servicios</option><option>Educación</option><option>Otro</option></select></label><label>RUC opcional<input value={form.ruc} onChange={e=>setForm({...form,ruc:e.target.value})}/></label><label>Zona<input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}/></label><label>Dirección<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><label>Teléfono<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>{error&&<div className="formError">{error}</div>}<button className="primary" type="submit"><Store size={17}/>Crear negocio</button></form></Card></div>;
}

export default function BusinessSuite(){
  const { profile, refreshLocalIndicators } = useApp();
  const [version,setVersion]=useState(0);
  const [businessId,setBusinessId]=useState(()=>getActiveBusinessId());
  const [tab,setTab]=useState('dashboard');
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('Todos');
  const [cart,setCart]=useState([]);
  const [orderType,setOrderType]=useState('counter');
  const [table,setTable]=useState('Mostrador');
  const [customerName,setCustomerName]=useState('');
  const [selectedCustomer,setSelectedCustomer]=useState('');
  const [payment,setPayment]=useState('cash');
  const [cash,setCash]=useState('');
  const [lastReceipt,setLastReceipt]=useState(null);
  const [showReceipt,setShowReceipt]=useState(false);
  const [opening,setOpening]=useState('100');
  const [counted,setCounted]=useState('');
  const [productForm,setProductForm]=useState({name:'',category:'General',price:'',stock:'',minimum:'',unit:'unid.',emoji:'📦',kitchen:false});
  const [stockForm,setStockForm]=useState({productId:'',quantity:'',reason:'Reposición'});
  const [customerForm,setCustomerForm]=useState({name:'',phone:''});
  const [workerForm,setWorkerForm]=useState({username:'',role:'cashier'});
  const [expenseForm,setExpenseForm]=useState({category:'Compra de insumos',description:'',amount:'',payment_method:'cash'});
  const [kioskMode,setKioskMode]=useState(false);
  const [kioskView,setKioskView]=useState('tv');
  const [kioskLocked,setKioskLocked]=useState(true);
  const [marketOrders,setMarketOrders]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('mizona-market-orders-v3035')||'[]');}catch{return [];}
  });

  useEffect(()=>subscribeLocalBusiness(()=>{setVersion(v=>v+1);refreshLocalIndicators?.();}),[refreshLocalIndicators]);
  useEffect(()=>{
    const load=()=>{try{setMarketOrders(JSON.parse(localStorage.getItem('mizona-market-orders-v3035')||'[]'));}catch{setMarketOrders([]);}};
    load();
    const onStorage=event=>{if(event.key==='mizona-market-orders-v3035')load();};
    window.addEventListener('storage', onStorage);
    window.addEventListener('mizona-market-orders-updated', load);
    return ()=>{window.removeEventListener('storage', onStorage);window.removeEventListener('mizona-market-orders-updated', load);};
  },[]);
  useEffect(()=>{
    document.body.classList.toggle('businessKioskActive', kioskMode);
    return ()=>document.body.classList.remove('businessKioskActive');
  },[kioskMode]);
  const workspaces=useMemo(()=>listLocalBusinessWorkspaces(),[version,profile.id]);
  useEffect(()=>{if(!businessId&&workspaces[0])setBusinessId(workspaces[0].id);if(businessId&&!workspaces.some(x=>x.id===businessId)&&workspaces[0])setBusinessId(workspaces[0].id);},[businessId,workspaces]);
  const snapshot=useMemo(()=>businessId?getLocalBusinessSnapshot(businessId):null,[businessId,version]);
  const role=snapshot?.role;
  const openSession=snapshot?.cash_sessions.find(x=>x.status==='open'&&(x.user_id===profile.id||can(role,'manager')))||null;
  const categories=['Todos',...new Set((snapshot?.products||[]).map(x=>x.category))];
  const filtered=(snapshot?.products||[]).filter(p=>p.active&&(category==='Todos'||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase()));
  const total=cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  const tax=total*Number(snapshot?.business.igv_rate||18)/(100+Number(snapshot?.business.igv_rate||18));
  const change=payment==='cash'?Math.max(Number(cash||0)-total,0):0;
  const profiles=listLocalProfiles();

  if(!workspaces.length)return <EmptyWorkspace profile={profile} onCreated={id=>{setBusinessId(id);setVersion(v=>v+1);}}/>;
  if(!snapshot)return <div className="page"><Card title="Sin acceso" icon="🔒"><p>No se encontró un negocio disponible para este perfil.</p></Card></div>;

  const safe=fn=>{setError('');setNotice('');try{const result=fn();setVersion(v=>v+1);refreshLocalIndicators?.();return result;}catch(err){setError(err.message);return null;}};
  const switchBusiness=id=>{safe(()=>setActiveBusinessId(id));setBusinessId(id);setCart([]);setTab('dashboard');};
  const add=product=>setCart(items=>{const found=items.find(x=>x.product_id===product.id);return found?items.map(x=>x.product_id===product.id?{...x,qty:x.qty+1}:x):[...items,{product_id:product.id,name:product.name,price:product.price,qty:1,emoji:product.emoji}];});
  const quantity=(id,delta)=>setCart(items=>items.map(x=>x.product_id===id?{...x,qty:Math.max(0,x.qty+delta)}:x).filter(x=>x.qty>0));
  const finishSale=()=>safe(()=>{
    if(!cart.length)throw new Error('Agrega al menos un producto al pedido.');
    if(payment==='cash'&&Number(cash||0)<total)throw new Error('El efectivo recibido es menor al total. Verifica el monto antes de cobrar.');
    const receipt=createLocalBusinessSale(businessId,{items:cart,order_type:orderType,table,customer_name:customerName,customer_id:selectedCustomer||null,payment_method:payment,cash_received:payment==='cash'?cash:total});
    setLastReceipt(receipt);
    setShowReceipt(false);
    setCart([]);
    setCash('');
    setCustomerName('');
    setSelectedCustomer('');
    setNotice(`Venta ${receipt.receipt} registrada y enviada al flujo de pedidos.`);
    setTab('kitchen');
    setKioskView('kitchen');
    return receipt;
  });
  const createProduct=e=>{e.preventDefault();const result=safe(()=>createLocalBusinessProduct(businessId,{...productForm,price:Number(productForm.price),stock:Number(productForm.stock),minimum:Number(productForm.minimum)}));if(result)setProductForm({name:'',category:'General',price:'',stock:'',minimum:'',unit:'unid.',emoji:'📦',kitchen:false});};
  const adjust=e=>{e.preventDefault();const result=safe(()=>adjustLocalBusinessStock(businessId,stockForm.productId,Number(stockForm.quantity),stockForm.reason));if(result)setStockForm({productId:'',quantity:'',reason:'Reposición'});};
  const addCustomer=e=>{e.preventDefault();const result=safe(()=>createLocalBusinessCustomer(businessId,customerForm));if(result)setCustomerForm({name:'',phone:''});};
  const addWorker=e=>{e.preventDefault();const result=safe(()=>addLocalBusinessWorker(businessId,workerForm.username,workerForm.role));if(result)setWorkerForm({username:'',role:'cashier'});};
  const addExpense=e=>{e.preventDefault();const result=safe(()=>createLocalBusinessExpense(businessId,{...expenseForm,amount:Number(expenseForm.amount)}));if(result)setExpenseForm({category:'Compra de insumos',description:'',amount:'',payment_method:'cash'});};
  const tabs=[
    {id:'dashboard',label:'Resumen',icon:'📊'},
    ...(can(role,'manager','cashier','waiter')?[{id:'pos',label:'Caja / POS',icon:'🧾'}]:[]),
    ...(can(role,'manager','cashier','cook','waiter')?[{id:'kitchen',label:'Pedidos / Cocina',icon:'👨‍🍳'},{id:'marketOrders',label:'Pedidos Marketplace',icon:'🛒'}]:[]),
    ...(can(role,'manager')?[{id:'inventory',label:'Inventario',icon:'📦'}]:[]),
    ...(can(role,'manager','cashier')?[{id:'customers',label:'Clientes',icon:'👥'}]:[]),
    ...(can(role,'manager')?[{id:'workers',label:'Personal',icon:'🧑‍💼'},{id:'expenses',label:'Gastos',icon:'💸'},{id:'reports',label:'Reportes',icon:'📈'}]:[])
  ];

  const enterKiosk=(view='tv')=>{
    setKioskView(view);
    setKioskLocked(true);
    setKioskMode(true);
    if(view==='pos'&&tabs.some(x=>x.id==='pos'))setTab('pos');
    if(view==='kitchen'&&tabs.some(x=>x.id==='kitchen'))setTab('kitchen');
    document.documentElement.requestFullscreen?.().catch(()=>{});
  };
  const exitKiosk=()=>{
    setKioskMode(false);
    setKioskLocked(true);
    if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  };

  const marketStatusNext={registrado:'aceptado',aceptado:'preparando',preparando:'en_camino',en_camino:'entregado'};
  const marketStatusLabel={registrado:'Registrado',aceptado:'Aceptado',preparando:'Preparando',en_camino:'En camino',entregado:'Entregado',recibido:'Recibido',calificado:'Calificado',cancelado:'Cancelado'};
  const persistMarketOrders=next=>{
    setMarketOrders(next);
    localStorage.setItem('mizona-market-orders-v3035', JSON.stringify(next));
    window.dispatchEvent(new Event('mizona-market-orders-updated'));
  };
  const updateMarketOrder=(id,patch)=>{
    const next=marketOrders.map(order=>order.id===id?{...order,...patch,updated_at:new Date().toISOString()}:order);
    persistMarketOrders(next);
    setNotice('Pedido Marketplace actualizado.');
  };
  const businessMarketOrders=marketOrders.filter(order=>{
    const currentName=String(snapshot?.business?.name||'').toLowerCase();
    const provider=String(order.provider||'').toLowerCase();
    return provider.includes(currentName)||currentName.includes(provider)||true;
  });

    const statusNext={received:'preparing',preparing:'ready',ready:'delivered'};
  const today=snapshot.sales.filter(x=>x.created_at.slice(0,10)===new Date().toISOString().slice(0,10));
  const topProducts=Object.values(today.flatMap(sale=>{const order=snapshot.orders.find(o=>o.id===sale.order_id);return order?.items||[];}).reduce((acc,item)=>{acc[item.name]=acc[item.name]||{name:item.name,qty:0,total:0};acc[item.name].qty+=item.qty;acc[item.name].total+=item.qty*item.price;return acc;},{})).sort((a,b)=>b.qty-a.qty).slice(0,5);

  return <div className={`page businessSuitePage ${kioskMode?'businessSuiteKiosk':''}`}>
    {kioskMode&&<div className="businessKioskTop">
      <div><b>🔒 MiZona Business</b><span>{snapshot.business.name} · {openSession?'Caja abierta':'Caja cerrada'} · @{profile.username}</span></div>
      <div className="businessKioskSwitch">
        <button className={kioskView==='pos'?'active':''} onClick={()=>{setKioskView('pos');setTab('pos')}}>🧾 Caja</button>
        <button className={kioskView==='kitchen'?'active':''} onClick={()=>{setKioskView('kitchen');setTab('kitchen')}}>👨‍🍳 Cocina</button>
        <button className={kioskView==='tv'?'active':''} onClick={()=>{setKioskView('tv');setTab('dashboard')}}>📺 Panel TV</button>
      </div>
      <button className={kioskLocked?'kioskLock locked':'kioskLock'} onClick={()=>kioskLocked?setKioskLocked(false):exitKiosk()}>{kioskLocked?'🔒 Seguro':'🔓 Salir'}</button>
    </div>}
    {!kioskMode&&<section className="businessSuiteHero">
      <div><p className="eyebrow">Etapa 19 · Gestión multiusuario local</p><h1>MiZona Business</h1><p>Caja, pedidos, cocina, inventario, clientes, trabajadores y reportes separados por negocio.</p><div className="businessSelector"><Store size={17}/><select value={businessId} onChange={e=>switchBusiness(e.target.value)}>{workspaces.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><span>{snapshot.business.zone}</span></div></div>
      <div className="businessHeroStats"><span><b>{money(snapshot.stats.today_total)}</b>ventas de hoy</span><span><b>{snapshot.stats.today_sales}</b>comprobantes</span><span><b>{snapshot.stats.pending_orders}</b>pedidos activos</span><span><b>{snapshot.stats.low_stock}</b>alertas de stock</span></div>
    </section>}
    {!kioskMode&&<div className="businessModePanel">
      <div><b>🖥️ Modo pantalla completa / kiosco</b><span>Oculta menús de MiZona y deja Business en una vista limpia para caja, cocina, TV, tablet o celular.</span></div>
      <button onClick={()=>enterKiosk('pos')}>🧾 Caja / POS</button>
      <button onClick={()=>enterKiosk('kitchen')}>👨‍🍳 Cocina</button>
      <button onClick={()=>enterKiosk('tv')}>📺 Panel TV</button>
    </div>}
    {!kioskMode&&<div className="businessRoleStrip"><span><b>{roleLabel[role]||role}</b> · @{profile.username}</span><span>{openSession?`Caja abierta desde ${new Date(openSession.opened_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}`:'Caja cerrada'}</span></div>}
    {!kioskMode&&<Tabs tabs={tabs} active={tabs.some(x=>x.id===tab)?tab:tabs[0].id} setActive={setTab}/>}
    {notice&&<div className="businessNotice"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    {error&&<div className="businessError"><XCircle size={18}/>{error}<button onClick={()=>setError('')}>×</button></div>}
    {tab==='pos'&&lastReceipt&&!showReceipt&&<button className="floatingReceiptPrint" onClick={()=>setShowReceipt(true)}><Printer size={18}/><span>Imprimir última boleta</span></button>}

    {tab==='dashboard'&&<>
      <div className="businessKpis"><span><Banknote/><b>{money(snapshot.stats.today_total)}</b><small>Ventas hoy</small></span><span><Receipt/><b>{snapshot.stats.today_sales}</b><small>Comprobantes</small></span><span><ShoppingCart/><b>{money(snapshot.stats.ticket)}</b><small>Ticket promedio</small></span><span><Users/><b>{snapshot.customers.length}</b><small>Clientes registrados</small></span></div>
      <div className="grid2"><Card title="Flujo de pedidos" icon="👨‍🍳"><div className="orderFlow">{snapshot.orders.slice(0,6).map(order=><div key={order.id}><b>{order.code}</b><span>{order.table} · {order.items.reduce((a,x)=>a+x.qty,0)} productos</span><em className={order.status}>{statusLabel[order.status]}</em></div>)}{!snapshot.orders.length&&<p className="muted">Todavía no hay pedidos.</p>}</div></Card><Card title="Productos más vendidos" icon="🏆"><div className="topProducts">{topProducts.map((item,index)=><span key={item.name}><b>{index+1}</b>{item.name}<em>{item.qty} unidades</em></span>)}{!topProducts.length&&<p className="muted">Registra ventas para generar este ranking.</p>}</div></Card></div>
      <div className="grid2"><Card title="Resumen de caja" icon="💰"><div className="cashSummary"><span>Efectivo<b>{money(snapshot.stats.cash)}</b></span><span>Tarjeta / Yape<b>{money(snapshot.stats.digital)}</b></span><span>IGV incluido<b>{money(today.reduce((a,x)=>a+Number(x.tax||0),0))}</b></span><span>Gastos de hoy<b>{money(snapshot.expenses.filter(x=>x.created_at.slice(0,10)===new Date().toISOString().slice(0,10)).reduce((a,x)=>a+Number(x.amount||0),0))}</b></span></div></Card><Card title="Alertas del negocio" icon="⚠️"><ul className="list">{snapshot.products.filter(x=>x.track_stock&&x.stock<=x.minimum).slice(0,5).map(x=><li key={x.id}>{x.name}: stock {x.stock} {x.unit}.</li>)}{snapshot.orders.filter(x=>['received','preparing'].includes(x.status)&&Date.now()-new Date(x.created_at)>15*60000).map(x=><li key={x.id}>{x.code} lleva más de 15 minutos.</li>)}{!snapshot.stats.low_stock&&!snapshot.orders.some(x=>['received','preparing'].includes(x.status))&&<li>Sin alertas pendientes.</li>}</ul></Card></div>
      <Card title="Control de caja" icon="🧾">{openSession?<div className="cashSessionPanel"><div><b>Caja abierta</b><span>Fondo inicial: {money(openSession.opening_amount)}</span></div><label>Conteo al cerrar<input type="number" min="0" value={counted} onChange={e=>setCounted(e.target.value)} placeholder="0.00"/></label><button className="dangerSoft" onClick={()=>{const result=safe(()=>closeLocalCashSession(businessId,openSession.id,Number(counted)));if(result)setNotice(`Caja cerrada. Diferencia: ${money(result.difference)}.`);}}>Cerrar caja</button></div>:<div className="cashSessionPanel"><div><b>Abrir turno de caja</b><span>Registra el fondo inicial antes de vender.</span></div><label>Fondo inicial<input type="number" min="0" value={opening} onChange={e=>setOpening(e.target.value)}/></label><button className="primary" onClick={()=>{const id=safe(()=>openLocalCashSession(businessId,Number(opening)));if(id)setNotice('Caja abierta correctamente.');}}>Abrir caja</button></div>}</Card>
    </>}

    {tab==='pos'&&<div className="posLayout"><section><div className="posFilters"><div className="businessSearch"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar producto..."/></div><div className="chips">{categories.map(x=><button key={x} className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}</button>)}</div></div><div className="posProductGrid">{filtered.map(product=><button key={product.id} className="posProduct" disabled={product.track_stock&&product.stock<=0} onClick={()=>add(product)}><span>{product.emoji}</span><b>{product.name}</b><small>Stock: {product.stock} {product.unit}</small><strong>{money(product.price)}</strong></button>)}</div></section><aside className="cartPanel"><div className="cartHead"><div><ShoppingCart size={20}/><b>Pedido actual</b></div><button onClick={()=>setCart([])}><Trash2 size={16}/></button></div><div className="orderMeta"><select value={orderType} onChange={e=>setOrderType(e.target.value)}><option value="counter">Mostrador</option><option value="table">Mesa</option><option value="delivery">Delivery</option><option value="pickup">Recojo</option></select><input value={table} onChange={e=>setTable(e.target.value)} placeholder="Mesa o referencia"/><select value={selectedCustomer} onChange={e=>setSelectedCustomer(e.target.value)}><option value="">Cliente ocasional</option>{snapshot.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Nombre para pedido"/></div><div className="cartItems">{!cart.length&&<div className="emptyCart">Selecciona productos para crear el pedido.</div>}{cart.map(item=><div className="cartItem" key={item.product_id}><span>{item.emoji}</span><div><b>{item.name}</b><small>{money(item.price)} c/u</small></div><div className="qty"><button onClick={()=>quantity(item.product_id,-1)}><Minus size={14}/></button><b>{item.qty}</b><button onClick={()=>quantity(item.product_id,1)}><Plus size={14}/></button></div><strong>{money(item.price*item.qty)}</strong></div>)}</div><div className="cartTotals"><span>Subtotal sin IGV<b>{money(total-tax)}</b></span><span>IGV incluido ({snapshot.business.igv_rate}%)<b>{money(tax)}</b></span><span className="grandTotal">Total<b>{money(total)}</b></span></div><div className="paymentMethods"><button className={payment==='cash'?'active':''} onClick={()=>setPayment('cash')}><Banknote/>Efectivo</button><button className={payment==='digital'?'active':''} onClick={()=>setPayment('digital')}><CreditCard/>Tarjeta/Yape</button></div>{payment==='cash'&&<><label className="cashField">Efectivo recibido<input type="number" min="0" value={cash} onChange={e=>setCash(e.target.value)} placeholder="0.00"/></label><div className="changeBox"><span>Vuelto</span><b>{money(change)}</b></div></>}<div className="posActionRow"><button className="primary full finishSale" onClick={finishSale}><Receipt size={18}/>Cobrar venta</button><button className="secondary printReceiptBtn" disabled={!lastReceipt} onClick={()=>setShowReceipt(true)}><Printer size={18}/>Imprimir</button></div></aside></div>}

    {tab==='marketOrders'&&<div className="marketOrdersBusiness36">
      <section className="businessMarketHero36">
        <div><p className="eyebrow">Etapa 30.36 · Marketplace conectado</p><h2>Pedidos recibidos desde Marketplace</h2><p>El negocio acepta, prepara y actualiza estados. El cliente lo verá desde Mis pedidos.</p></div>
        <div><b>{businessMarketOrders.length}</b><span>pedidos registrados</span></div>
      </section>
      <div className="marketOrderColumns36">
        {['registrado','aceptado','preparando','en_camino','entregado','recibido','calificado'].map(status=><section key={status}>
          <header><b>{marketStatusLabel[status]}</b><small>{businessMarketOrders.filter(order=>order.status===status).length} pedidos</small></header>
          {businessMarketOrders.filter(order=>order.status===status).map(order=><article key={order.id} className={`businessMarketOrderCard36 status-${status}`}>
            <div className="orderTop36"><div><span>{order.id}</span><h3>{order.provider}</h3><p>{order.deliveryMode} · {new Date(order.created_at).toLocaleString('es-PE')}</p></div><strong>{money(order.total)}</strong></div>
            <div className="businessOrderItems36">{order.items.map(item=><p key={item.id}><b>{item.qty}×</b> {item.title} <span>{money(item.price)}</span></p>)}</div>
            {order.rating&&<div className="businessRating36">⭐ {order.rating.stars}/5 · {order.rating.comment||'Sin comentario'} {order.problem&&<em>· problema reportado</em>}</div>}
            <div className="businessOrderActions36">
              {marketStatusNext[order.status]&&<button onClick={()=>updateMarketOrder(order.id,{status:marketStatusNext[order.status]})}>{order.status==='registrado'?'Aceptar pedido':order.status==='aceptado'?'Pasar a preparación':order.status==='preparando'?'Enviar / listo':'Marcar entregado'}</button>}
              {!['recibido','calificado','cancelado'].includes(order.status)&&<button className="secondary" onClick={()=>updateMarketOrder(order.id,{status:'cancelado',problem:true})}>Cancelar</button>}
            </div>
          </article>)}
          {!businessMarketOrders.some(order=>order.status===status)&&<div className="emptyColumn">Sin pedidos</div>}
        </section>)}
      </div>
      <div className="businessMarketNotice36"><AlertTriangle/><p><b>Importante:</b> esta conexión usa pedidos locales del Marketplace para prueba. La siguiente etapa puede sincronizarlos en Supabase para que cliente y proveedor los vean desde distintos dispositivos.</p></div>
    </div>}

    {tab==='kitchen'&&<div className="kitchenBoard">{['received','preparing','ready','delivered'].map(status=><section key={status}><header><span>{status==='received'?<ClipboardList/>:status==='preparing'?<ChefHat/>:status==='ready'?<CheckCircle2/>:<Receipt/>}</span><div><b>{statusLabel[status]}</b><small>{snapshot.orders.filter(x=>x.status===status).length} pedidos</small></div></header><div>{snapshot.orders.filter(x=>x.status===status).map(order=><article key={order.id}><div><b>{order.code}</b><em><Clock3 size={13}/>{Math.max(0,Math.round((Date.now()-new Date(order.created_at))/60000))} min</em></div><h3>{order.table}</h3><p>{order.items.map(x=>`${x.qty}× ${x.name}`).join(' · ')}</p><strong>{money(order.total)}</strong>{statusNext[status]&&<button onClick={()=>safe(()=>updateLocalBusinessOrderStatus(businessId,order.id,statusNext[status]))}>{status==='received'?'Iniciar preparación':status==='preparing'?'Marcar listo':'Entregar / concluir'}</button>}</article>)}{!snapshot.orders.some(x=>x.status===status)&&<div className="emptyColumn">Sin pedidos</div>}</div></section>)}</div>}

    {tab==='inventory'&&<><div className="grid2"><Card title="Nuevo producto" icon="➕"><form className="businessForm" onSubmit={createProduct}><input placeholder="Nombre" value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/><input placeholder="Categoría" value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}/><input type="number" step="0.01" placeholder="Precio" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/><input type="number" placeholder="Stock inicial" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})}/><input type="number" placeholder="Stock mínimo" value={productForm.minimum} onChange={e=>setProductForm({...productForm,minimum:e.target.value})}/><input placeholder="Unidad" value={productForm.unit} onChange={e=>setProductForm({...productForm,unit:e.target.value})}/><input placeholder="Emoji" value={productForm.emoji} onChange={e=>setProductForm({...productForm,emoji:e.target.value})}/><label className="checkLine"><input type="checkbox" checked={productForm.kitchen} onChange={e=>setProductForm({...productForm,kitchen:e.target.checked})}/>Requiere preparación en cocina</label><button className="primary">Guardar producto</button></form></Card><Card title="Ajustar stock" icon="📦"><form className="businessForm" onSubmit={adjust}><select value={stockForm.productId} onChange={e=>setStockForm({...stockForm,productId:e.target.value})}><option value="">Selecciona producto</option>{snapshot.products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.stock}</option>)}</select><input type="number" placeholder="Cantidad (+ ingreso / - salida)" value={stockForm.quantity} onChange={e=>setStockForm({...stockForm,quantity:e.target.value})}/><input placeholder="Motivo" value={stockForm.reason} onChange={e=>setStockForm({...stockForm,reason:e.target.value})}/><button className="primary">Aplicar movimiento</button></form></Card></div><Card title="Inventario actual" icon="📋"><div className="inventoryTable"><div className="inventoryHead"><b>Producto</b><b>Categoría</b><b>Stock</b><b>Mínimo</b><b>Estado</b></div>{snapshot.products.map(p=><div key={p.id}><b>{p.emoji} {p.name}</b><span>{p.category}</span><span>{p.stock} {p.unit}</span><span>{p.minimum}</span><em className={p.stock<=p.minimum?'low':'ok'}>{p.stock<=p.minimum?'Reponer':'Disponible'}</em></div>)}</div></Card></>}

    {tab==='customers'&&<div className="grid2"><Card title="Registrar cliente" icon="👤"><form className="businessForm" onSubmit={addCustomer}><input placeholder="Nombre completo" value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/><input placeholder="Teléfono" value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/><button className="primary"><UserPlus size={16}/>Agregar cliente</button></form></Card><Card title="Clientes frecuentes" icon="⭐"><div className="customerList">{snapshot.customers.map(c=><div key={c.id}><b>{c.name}</b><span>{c.phone||'Sin teléfono'}</span><em>{c.visits} visitas · {money(c.total_spent)} · {c.points} puntos</em></div>)}</div></Card></div>}

    {tab==='workers'&&<div className="grid2"><Card title="Agregar trabajador" icon="🧑‍💼"><form className="businessForm" onSubmit={addWorker}><input placeholder="Usuario exacto, ej. CARLOS_2009" value={workerForm.username} onChange={e=>setWorkerForm({...workerForm,username:e.target.value.toUpperCase()})}/><select value={workerForm.role} onChange={e=>setWorkerForm({...workerForm,role:e.target.value})}><option value="manager">Administrador</option><option value="cashier">Caja</option><option value="cook">Cocina</option><option value="waiter">Mozo</option></select><button className="primary"><UserPlus size={16}/>Agregar acceso</button></form></Card><Card title="Equipo del negocio" icon="👥"><div className="workerList">{snapshot.workers.map(w=>{const person=profiles.find(p=>p.id===w.user_id);return <article key={w.id}><div><b>{person?.display_name||w.user_id}</b><span>@{person?.username||w.user_id}</span></div><select value={w.role} disabled={w.role==='owner'} onChange={e=>safe(()=>updateLocalBusinessWorker(businessId,w.user_id,e.target.value,w.status))}><option value="owner">Propietario</option><option value="manager">Administrador</option><option value="cashier">Caja</option><option value="cook">Cocina</option><option value="waiter">Mozo</option></select>{w.role!=='owner'&&<button className="dangerSoft" onClick={()=>safe(()=>updateLocalBusinessWorker(businessId,w.user_id,w.role,w.status==='active'?'inactive':'active'))}>{w.status==='active'?'Desactivar':'Activar'}</button>}</article>;})}</div></Card></div>}

    {tab==='expenses'&&<div className="grid2"><Card title="Registrar gasto" icon="💸"><form className="businessForm" onSubmit={addExpense}><input placeholder="Categoría" value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}/><input placeholder="Detalle" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})}/><input type="number" step="0.01" placeholder="Importe" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})}/><select value={expenseForm.payment_method} onChange={e=>setExpenseForm({...expenseForm,payment_method:e.target.value})}><option value="cash">Efectivo</option><option value="digital">Tarjeta/Yape</option></select><button className="primary">Guardar gasto</button></form></Card><Card title="Últimos gastos" icon="🧾"><div className="expenseList">{snapshot.expenses.slice(0,12).map(x=><article key={x.id}><div><b>{x.category}</b><span>{x.description}</span></div><strong>{money(x.amount)}</strong><small>{new Date(x.created_at).toLocaleString('es-PE')}</small></article>)}</div></Card></div>}

    {tab==='reports'&&<><div className="businessKpis"><span><WalletCards/><b>{money(snapshot.stats.today_total)}</b><small>Ventas del día</small></span><span><Banknote/><b>{money(snapshot.stats.cash)}</b><small>Efectivo</small></span><span><CreditCard/><b>{money(snapshot.stats.digital)}</b><small>Digital</small></span><span><Package/><b>{snapshot.inventory_movements.length}</b><small>Movimientos stock</small></span></div><div className="grid2"><Card title="Exportaciones" icon="📥"><div className="reportButtons"><button onClick={()=>downloadCsv(`ventas-${snapshot.business.name}.csv`,[['Comprobante','Fecha','Pago','Subtotal','IGV','Total','Recibido','Vuelto'],...snapshot.sales.map(x=>[x.receipt,new Date(x.created_at).toLocaleString('es-PE'),x.payment_method,x.subtotal,x.tax,x.total,x.cash_received,x.change])])}><Download size={16}/>Descargar ventas CSV</button><button onClick={()=>downloadCsv(`inventario-${snapshot.business.name}.csv`,[['Producto','Categoría','Stock','Mínimo','Unidad'],...snapshot.products.map(x=>[x.name,x.category,x.stock,x.minimum,x.unit])])}><Download size={16}/>Descargar inventario CSV</button><button onClick={()=>window.print()}><Printer size={16}/>Imprimir reporte / guardar PDF</button></div></Card><Card title="Resumen acumulado" icon="📊"><div className="cashSummary"><span>Ventas registradas<b>{snapshot.sales.length}</b></span><span>Total histórico<b>{money(snapshot.sales.reduce((a,x)=>a+Number(x.total||0),0))}</b></span><span>Gastos registrados<b>{money(snapshot.expenses.reduce((a,x)=>a+Number(x.amount||0),0))}</b></span><span>Saldo estimado<b>{money(snapshot.sales.reduce((a,x)=>a+Number(x.total||0),0)-snapshot.expenses.reduce((a,x)=>a+Number(x.amount||0),0))}</b></span></div></Card></div></>}

    {lastReceipt&&showReceipt&&<div className="receiptOverlay"><div className="receiptPaper receiptPaperPro"><div className="receiptRibbon">BOLETA DE VENTA</div><button className="receiptClose" onClick={()=>setShowReceipt(false)}>×</button><h2>{lastReceipt.business.trade_name||lastReceipt.business.name}</h2><p>RUC: {lastReceipt.business.ruc||'No registrado'}</p><p>{lastReceipt.business.address}</p><hr/><b>BOLETA {lastReceipt.receipt}</b><p>{new Date(lastReceipt.created_at).toLocaleString('es-PE')}</p><p>Cliente: {lastReceipt.customer_name||'Cliente ocasional'}</p><p>Pedido: {lastReceipt.table}</p><hr/>{lastReceipt.items.map(x=><div className="receiptLine" key={x.product_id}><span>{x.qty} × {x.name}</span><b>{money(x.qty*x.price)}</b></div>)}<hr/><div className="receiptLine"><span>Subtotal</span><b>{money(lastReceipt.subtotal)}</b></div><div className="receiptLine"><span>IGV incluido</span><b>{money(lastReceipt.tax)}</b></div><div className="receiptLine total"><span>TOTAL</span><b>{money(lastReceipt.total)}</b></div><div className="receiptLine"><span>Recibido</span><b>{money(lastReceipt.cash_received)}</b></div><div className="receiptLine"><span>Vuelto</span><b>{money(lastReceipt.change)}</b></div><p className="receiptThanks">Gracias por su compra.</p><button className="primary full" onClick={()=>window.print()}><Printer size={16}/>Imprimir boleta</button></div></div>}
  </div>;
}
