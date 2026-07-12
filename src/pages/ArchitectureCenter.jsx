import { Bell, Boxes, CheckCircle2, Circle, Cloud, Compass, Database, FileText, Flame, KeyRound, MessageCircle, PackageCheck, Puzzle, ShieldCheck, Store, Truck, Users } from 'lucide-react';
import Card from '../components/Card';
import { hasSupabase } from '../lib/supabase';
import { firebaseEnabled, getFirebasePlan, getFirebasePublicConfig } from '../lib/firebaseConfig';
import { CORE_TABLES_3043, CORE_MODULES_3043, getCoreNextSteps } from '../lib/mizonaCore';

const supabaseTables = [
  ['market_orders', 'Pedidos registrados del Marketplace'],
  ['market_order_items', 'Productos por pedido'],
  ['market_order_status_logs', 'Historial de estados'],
  ['provider_reviews', 'Calificaciones de proveedores'],
  ['provider_claims', 'Reclamos y problemas'],
  ['provider_verifications', 'Verificación de proveedor'],
  ['chat_polls', 'Encuestas reales del chat'],
  ['chat_poll_votes', 'Votos de encuesta'],
  ['chat_events', 'Eventos creados desde chat'],
  ['notifications', 'Notificaciones internas'],
  ['firebase_devices', 'Tokens de dispositivos para push']
];

const nextPhases = [
  ['30.38', 'Encuestas reales en chat', MessageCircle],
  ['30.39', 'Eventos y recordatorios reales', Bell],
  ['30.40', 'Reclamos y moderación', ShieldCheck],
  ['30.41', 'Verificación de proveedores', Store],
  ['30.42', 'Notificaciones internas + Firebase Push', Flame],
  ['30.43', 'Ubicación en tiempo real', Truck]
];

export default function ArchitectureCenter({ setPage }) {
  const firebaseConfig = getFirebasePublicConfig();
  const firebasePlan = getFirebasePlan();

  return <div className="page architecturePage37">
    <section className="architectureHero37">
      <div>
        <p className="eyebrow">Etapa 30.37 · Arquitectura real</p>
        <h1>Supabase + Firebase sin mezclar funciones</h1>
        <p>Supabase será la base principal para datos, roles, pedidos, chat y marketplace. Firebase queda preparado para notificaciones push, analytics, errores, remote config y almacenamiento alternativo.</p>
        <div className="architectureHeroActions37">
          <button onClick={() => setPage?.('admin')}><ShieldCheck size={18}/> Centro de Control</button>
          <button className="secondary" onClick={() => setPage?.('marketplace')}><PackageCheck size={18}/> Marketplace</button>
        </div>
      </div>
      <div className="architectureStatus37">
        <article><Database/><b>Supabase</b><span>{hasSupabase ? 'Conectado / listo' : 'Variables pendientes'}</span></article>
        <article><Flame/><b>Firebase</b><span>{firebaseEnabled ? 'Configurado' : 'Preparado, faltan claves'}</span></article>
      </div>
    </section>

    <div className="architectureGrid37">
      <Card title="Qué va en Supabase" icon={<Circle size={18}/>}>
        <div className="architectureList37">
          <article><Users/><b>Usuarios, roles y permisos</b><span>Control real por usuario, negocio, conductor, adulto, alumno o invitado.</span></article>
          <article><PackageCheck/><b>Pedidos Marketplace</b><span>Cliente, proveedor y administrador ven el mismo pedido en tiempo real.</span></article>
          <article><Store/><b>Business y proveedores</b><span>Stock, pedidos, ventas, calificaciones, verificación y reclamos.</span></article>
          <article><MessageCircle/><b>Chat, encuestas y eventos</b><span>Mensajes, votos, asistencia, acuerdos y acciones del chat.</span></article>
        </div>
      </Card>

      <Card title="Qué va en Firebase" icon={<Flame size={18}/>}>
        <div className="firebasePlan37">
          {firebasePlan.map(item => <article key={item.area}>
            <Flame/><div><b>{item.area}</b><span>{item.use}</span></div><em>{item.status}</em>
          </article>)}
        </div>
      </Card>
    </div>

    <Card title="Tablas reales recomendadas para Supabase" icon={<Puzzle size={18}/>}>
      <p className="muted">Esta etapa deja documentada la estructura SQL para convertir los pedidos locales en pedidos reales sincronizados.</p>
      <div className="tablePlan37">
        {supabaseTables.map(([name,desc]) => <article key={name}><code>{name}</code><span>{desc}</span></article>)}
      </div>
    </Card>

    <Card title="Variables Firebase esperadas" icon={<KeyRound size={18}/>}>
      <div className="firebaseKeys37">
        {Object.entries(firebaseConfig).filter(([key]) => key !== 'enabled').map(([key,value]) => <article key={key}><KeyRound size={16}/><b>{key}</b><span>{value ? 'configurado' : 'pendiente'}</span></article>)}
      </div>
      <p className="muted">Firebase puede quedar desactivado sin romper la web. Cuando coloques las claves en Vercel, se activarán los módulos que usemos.</p>
    </Card>

    <Card title="Orden de desarrollo recomendado" icon={<Compass size={18}/>}>
      <div className="phaseGrid37">
        {nextPhases.map(([phase,title,Icon]) => <article key={phase}><Icon/><span>{phase}</span><b>{title}</b></article>)}
      </div>
    </Card>
    <Card title="Núcleo real 30.43 en Supabase" icon={<Boxes size={18}/>}>
      <p className="muted">Esta etapa deja una base oficial para que Chat, Marketplace, Business, Comités, Comunidad, Notificaciones y Archivos usen la misma estructura real.</p>
      <div className="coreGrid43">
        <article><b>{CORE_TABLES_3043.length}</b><span>Tablas principales mz_*</span></article>
        <article><b>{CORE_MODULES_3043.length}</b><span>Módulos oficiales</span></article>
        <article><b>RLS</b><span>Políticas por usuario, miembro y administrador</span></article>
        <article><b>Realtime</b><span>Mensajes, pedidos y notificaciones</span></article>
      </div>
      <div className="tablePlan37 coreTablePlan43">
        {CORE_TABLES_3043.map(name => <article key={name}><code>{name}</code><span>Tabla del núcleo real MiZona 30.43</span></article>)}
      </div>
    </Card>

    <Card title="Pasos para activar el núcleo real" icon={<CheckCircle2 size={18}/>}>
      <div className="phaseGrid37 coreSteps43">
        {getCoreNextSteps().map((step, index) => <article key={step}><span>{index + 1}</span><b>{step}</b></article>)}
      </div>
    </Card>

  </div>;
}
