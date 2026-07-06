
import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Plus, ShieldCheck, WalletCards } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import { isStudentProfile } from '../lib/permissions';

const money = value => `S/ ${Number(value || 0).toFixed(2)}`;
const baseExpenses = [
  { id: 'g1', date: '2026-07-03', category: 'Limpieza', detail: 'Compra de bolsas, escobas y guantes para faena comunitaria.', amount: 86.50, status: 'Aprobado', receipt: 'Boleta 001-245' },
  { id: 'g2', date: '2026-07-04', category: 'Seguridad', detail: 'Reparación de foco y cableado en ingreso principal.', amount: 132.00, status: 'Por revisar', receipt: 'Recibo simple' },
  { id: 'g3', date: '2026-07-05', category: 'Eventos', detail: 'Alquiler de sillas para reunión vecinal.', amount: 75.00, status: 'Aprobado', receipt: 'Factura F001-114' }
];
const contributions = [
  { id: 'a1', member: 'Mz. A Lt. 04', concept: 'Cuota julio', amount: 20, status: 'Pagado' },
  { id: 'a2', member: 'Mz. A Lt. 05', concept: 'Cuota julio', amount: 20, status: 'Pendiente' },
  { id: 'a3', member: 'Mz. B Lt. 02', concept: 'Apoyo faena', amount: 10, status: 'Pagado' }
];
const minutes = [
  { id: 'acta1', title: 'Acta de asamblea vecinal', date: '2026-07-01', summary: 'Acuerdos sobre limpieza, seguridad y alumbrado público.' },
  { id: 'acta2', title: 'Lista de asistencia', date: '2026-07-05', summary: 'Registro de participantes en faena comunitaria.' }
];

function exportJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function Committees({ setPage }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [expenses, setExpenses] = useState(baseExpenses);
  const [message, setMessage] = useState('');
  const totals = useMemo(() => {
    const income = contributions.filter(c => c.status === 'Pagado').reduce((sum, c) => sum + c.amount, 0);
    const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
    return { income, spent, balance: income - spent };
  }, [expenses]);

  if (isStudentProfile(profile)) return <div className="page"><Card title="Acceso protegido" icon="🛡️"><p>Las cuentas estudiantiles no pueden ver gastos, actas ni administración de comités.</p><button className="primary" onClick={() => setPage('campus')}>Volver a CampusHugo</button></Card></div>;

  const addExpense = () => {
    const next = { id: `g${Date.now()}`, date: new Date().toISOString().slice(0,10), category: 'Nuevo gasto', detail: 'Detalle pendiente de completar por tesorería.', amount: 0, status: 'Borrador', receipt: 'Sin comprobante' };
    setExpenses([next, ...expenses]);
    setMessage('Gasto agregado en modo local. En producción se guardará en Supabase y podrá exportarse a Excel/PDF.');
  };

  return <div className="page committeesPage">
    <section className="committeeHero">
      <div><p className="eyebrow">Plataforma para comités y juntas vecinales</p><h1>Comité Vecinal Los Pinos</h1><p>Transparencia de aportes, gastos, actas, eventos y documentos. Esta es la plataforma que ven los adultos responsables, no los niños.</p></div>
      <div className="committeeHeroStats"><span><b>{money(totals.income)}</b> Ingresos</span><span><b>{money(totals.spent)}</b> Gastos</span><span><b>{money(totals.balance)}</b> Saldo</span></div>
    </section>

    {message && <div className="localModeStrip"><ShieldCheck size={18}/><span>{message}</span><button onClick={() => setMessage('')}>×</button></div>}

    <Tabs active={tab} setActive={setTab} tabs={[{id:'dashboard',label:'Resumen',icon:'📊'},{id:'expenses',label:'Gastos',icon:'💸'},{id:'contributions',label:'Aportes',icon:'🧾'},{id:'minutes',label:'Actas y documentos',icon:'📁'}]}/>

    {tab === 'dashboard' && <div className="grid2">
      <Card title="Resumen del comité" icon="📊"><div className="committeeTotals"><span><b>{money(totals.income)}</b><small>Aportes cobrados</small></span><span><b>{money(totals.spent)}</b><small>Gastos registrados</small></span><span><b>{money(totals.balance)}</b><small>Saldo disponible</small></span></div><p className="muted">Ideal para rendición de cuentas en asambleas. Cada gasto puede tener detalle y comprobante.</p></Card>
      <Card title="Acciones rápidas" icon="⚙️"><div className="committeeActions"><button className="primary" onClick={addExpense}><Plus size={16}/> Registrar gasto</button><button onClick={() => exportJson('mizona-comite-los-pinos.json', { expenses, contributions, minutes })}><Download size={16}/> Descargar respaldo</button><button onClick={() => setTab('expenses')}><WalletCards size={16}/> Ver gastos</button><button onClick={() => setMessage('Exportación a Excel/PDF preparada para la versión con backend. En modo local se descarga JSON.')}><FileSpreadsheet size={16}/> Excel/PDF</button></div></Card>
    </div>}

    {tab === 'expenses' && <Card title="Gastos con detalle" icon="💸" action={<button className="primary" onClick={addExpense}>Agregar gasto</button>}><div className="committeeTable">{expenses.map(item => <article key={item.id}><b>{item.category}</b><span>{item.date}</span><span>{money(item.amount)}</span><em>{item.status}</em><p>{item.detail}</p><small>{item.receipt}</small></article>)}</div></Card>}

    {tab === 'contributions' && <Card title="Aportes vecinales" icon="🧾"><div className="committeeTable compact">{contributions.map(item => <article key={item.id}><b>{item.member}</b><span>{item.concept}</span><span>{money(item.amount)}</span><em>{item.status}</em></article>)}</div></Card>}

    {tab === 'minutes' && <Card title="Actas y documentos" icon="📁"><div className="committeeTable compact">{minutes.map(item => <article key={item.id}><b>{item.title}</b><span>{item.date}</span><p>{item.summary}</p><button>Ver detalle</button></article>)}</div></Card>}
  </div>;
}
