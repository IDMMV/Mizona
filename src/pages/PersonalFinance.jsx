import { useEffect, useMemo, useState } from 'react';
import { Download, PiggyBank, Plus, RefreshCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import {
  calculateFinanceSummary,
  deleteTransaction,
  exportFinanceJson,
  getMonthKey,
  importFinanceJson,
  listFinanceData,
  resetPersonalFinance,
  subscribePersonalFinance,
  upsertCategory,
  upsertGoal,
  upsertTransaction
} from '../lib/localPersonalFinance';

const money = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const addDays = days => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

const typeLabel = { income: 'Ingreso', expense: 'Gasto', saving: 'Ahorro' };
const typeIcon = { income: '⬆️', expense: '⬇️', saving: '🐷' };

function downloadText(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  const headers = ['fecha', 'tipo', 'categoria', 'cuenta', 'descripcion', 'monto', 'nota', 'comprobante'];
  const clean = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(key => clean(row[key])).join(','))].join('\n');
}

export default function PersonalFinance() {
  const { profile, dataMode, backendConnected } = useApp();
  const userId = profile?.id || 'local-user-jose';
  const [data, setData] = useState(() => listFinanceData(userId));
  const [tab, setTab] = useState('dashboard');
  const [month, setMonth] = useState(getMonthKey());
  const [message, setMessage] = useState('');
  const [tx, setTx] = useState({ type: 'expense', categoryId: 'cat-food', accountId: 'acc-cash', amount: '', date: today(), description: '', note: '', receiptRef: '' });
  const [goal, setGoal] = useState({ name: '', targetAmount: '', currentAmount: '', dueDate: addDays(60) });
  const [category, setCategory] = useState({ name: '', type: 'expense', icon: '💳', monthlyLimit: '' });
  const [importText, setImportText] = useState('');

  const refresh = () => setData(listFinanceData(userId));
  useEffect(() => { refresh(); const off = subscribePersonalFinance(() => refresh()); return off; }, [userId]);

  const summary = useMemo(() => calculateFinanceSummary(data, month), [data, month]);
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const expenseCategories = categories.filter(item => item.type === 'expense' || item.type === tx.type || tx.type === 'saving');

  const saveTransaction = event => {
    event.preventDefault();
    try {
      upsertTransaction(tx, userId);
      setTx({ ...tx, amount: '', description: '', note: '', receiptRef: '', date: today() });
      setMessage('Movimiento guardado solo para tu cuenta.');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveGoal = event => {
    event.preventDefault();
    try {
      upsertGoal(goal, userId);
      setGoal({ name: '', targetAmount: '', currentAmount: '', dueDate: addDays(60) });
      setMessage('Meta guardada.');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveCategory = event => {
    event.preventDefault();
    try {
      upsertCategory(category);
      setCategory({ name: '', type: 'expense', icon: '💳', monthlyLimit: '' });
      setMessage('Categoría creada.');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const exportJson = () => downloadText(`mizona-finanzas-${profile.username || userId}.json`, exportFinanceJson(userId));
  const exportCsv = () => {
    const rows = data.transactions.map(item => ({
      fecha: item.date,
      tipo: typeLabel[item.type] || item.type,
      categoria: categories.find(cat => cat.id === item.categoryId)?.name || item.categoryId,
      cuenta: accounts.find(account => account.id === item.accountId)?.name || item.accountId,
      descripcion: item.description,
      monto: item.amount,
      nota: item.note,
      comprobante: item.receiptRef
    }));
    downloadText(`mizona-finanzas-${profile.username || userId}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

  const importJson = event => {
    event.preventDefault();
    try {
      importFinanceJson(importText, userId);
      setImportText('');
      setMessage('Respaldo importado para tu usuario.');
      refresh();
    } catch (error) {
      setMessage('No se pudo importar. Revisa que sea un JSON válido.');
    }
  };

  return <div className="page personalFinancePage financeComiteStyle38">
    <section className="financeHero38">
      <div>
        <span className="eyebrow">MIS GASTOS</span>
        <h1>Control personal de ingresos, gastos y metas</h1>
        <p>Una vista más clara tipo comité: registra movimientos, consulta historial, revisa tu dashboard y exporta tu información.</p>
      </div>
      <div className="financeHeroCard38">
        <PiggyBank size={42}/>
        <b>{money(summary.balance)}</b>
        <span>Disponible del mes</span>
      </div>
    </section>

    <div className="financePrivacy financePrivacy38"><ShieldCheck/><div><b>Privado por usuario</b><span>{dataMode === 'cloud' && backendConnected ? 'Preparado para guardar en Supabase con RLS por propietario.' : 'En modo local se guarda separado por perfil en este navegador.'}</span></div><button className="ghost" onClick={exportCsv}><Download size={16}/> Exportar Excel</button></div>

    <Tabs value={tab} onChange={setTab} items={[{ id: 'dashboard', label: 'Dashboard' }, { id: 'movements', label: 'Registrar / consultar' }, { id: 'budgets', label: 'Presupuestos' }, { id: 'goals', label: 'Metas' }, { id: 'backup', label: 'Importar / exportar' }]}/>
    {message && <p className="accountMessage">{message}</p>}

    {tab === 'dashboard' && <>
      <div className="financeMonth"><label>Mes a revisar<input type="month" value={month} onChange={event => setMonth(event.target.value)}/></label></div>
      <div className="financeKpis">
        <span><b>{money(summary.income)}</b>Ingresos</span>
        <span><b>{money(summary.expenses)}</b>Gastos</span>
        <span><b>{money(summary.savings)}</b>Ahorro</span>
        <span className={summary.balance < 0 ? 'bad' : 'good'}><b>{money(summary.balance)}</b>Disponible</span>
      </div>
      <div className="grid2">
        <Card title="Agregar movimiento rápido" icon="➕">
          <form className="financeForm" onSubmit={saveTransaction}>
            <label>Tipo<select value={tx.type} onChange={event => setTx({ ...tx, type: event.target.value, categoryId: event.target.value === 'income' ? 'cat-income' : event.target.value === 'saving' ? 'cat-savings' : 'cat-food' })}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="saving">Ahorro</option></select></label>
            <label>Categoría<select value={tx.categoryId} onChange={event => setTx({ ...tx, categoryId: event.target.value })}>{categories.filter(cat => cat.type === tx.type || (tx.type === 'saving' && cat.type === 'saving')).map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select></label>
            <label>Cuenta<select value={tx.accountId} onChange={event => setTx({ ...tx, accountId: event.target.value })}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            <label>Monto<input type="number" min="0.10" step="0.10" value={tx.amount} onChange={event => setTx({ ...tx, amount: event.target.value })}/></label>
            <label>Fecha<input type="date" value={tx.date} onChange={event => setTx({ ...tx, date: event.target.value })}/></label>
            <label>Descripción<input placeholder="Ej. cuota del aula, mercado, pasaje" value={tx.description} onChange={event => setTx({ ...tx, description: event.target.value })}/></label>
            <label>Comprobante / operación<input placeholder="Yape, boleta, ticket, operación" value={tx.receiptRef} onChange={event => setTx({ ...tx, receiptRef: event.target.value })}/></label>
            <label>Nota<textarea value={tx.note} onChange={event => setTx({ ...tx, note: event.target.value })}/></label>
            <button><Plus size={16}/> Guardar movimiento</button>
          </form>
        </Card>
        <Card title="Cuentas" icon="💳">
          <div className="accountList">{summary.accountTotals.map(account => <article key={account.id}><span>{account.name}<small>{account.type}</small></span><b>{money(account.balance)}</b></article>)}</div>
        </Card>
      </div>
      <Card title="Gastos por categoría" icon="📊">
        <div className="budgetBars">{summary.byCategory.map(item => {
          const limit = Number(item.monthlyLimit || 0);
          const pct = limit ? Math.min(100, Math.round((item.total / limit) * 100)) : 0;
          return <article key={item.id} className={limit && item.total > limit ? 'over' : ''}>
            <div><b>{item.icon} {item.name}</b><span>{money(item.total)}{limit ? ` de ${money(limit)}` : ''}</span></div>
            <div className="progress"><i style={{ width: `${limit ? pct : 0}%` }}/></div>
          </article>;
        })}</div>
      </Card>
    </>}

    {tab === 'movements' && <>
      <div className="financeActions"><button onClick={exportCsv}><Download size={16}/> Exportar Excel CSV</button><button onClick={exportJson}><Download size={16}/> Respaldo JSON</button></div>
      <Card title="Historial personal" icon="🧾">
        <div className="financeTable">{data.transactions.map(item => {
          const cat = categories.find(category => category.id === item.categoryId);
          const account = accounts.find(acc => acc.id === item.accountId);
          return <article key={item.id}>
            <div className="txIcon">{typeIcon[item.type]}</div>
            <div><b>{item.description}</b><span>{item.date} · {cat?.icon} {cat?.name || item.categoryId} · {account?.name || item.accountId}</span>{item.receiptRef && <small>Comprobante: {item.receiptRef}</small>}</div>
            <strong className={item.type}>{item.type === 'income' ? '+' : '-'}{money(item.amount)}</strong>
            <button className="ghostDanger" onClick={() => { deleteTransaction(item.id, userId); refresh(); }}><Trash2 size={15}/></button>
          </article>;
        })}</div>
      </Card>
    </>}

    {tab === 'budgets' && <div className="grid2">
      <Card title="Límites mensuales" icon="📌">
        <div className="budgetBars">{categories.filter(item => item.type === 'expense').map(item => {
          const spent = summary.byCategory.find(cat => cat.id === item.id)?.total || 0;
          const limit = Number(item.monthlyLimit || 0);
          const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          return <article key={item.id} className={limit && spent > limit ? 'over' : ''}>
            <div><b>{item.icon} {item.name}</b><span>{money(spent)} / {money(limit)}</span></div>
            <div className="progress"><i style={{ width: `${pct}%` }}/></div>
            {limit && spent > limit && <em>Sobrepasaste este presupuesto.</em>}
          </article>;
        })}</div>
      </Card>
      <Card title="Crear categoría" icon="🧩">
        <form className="financeForm" onSubmit={saveCategory}>
          <label>Nombre<input value={category.name} onChange={event => setCategory({ ...category, name: event.target.value })}/></label>
          <label>Tipo<select value={category.type} onChange={event => setCategory({ ...category, type: event.target.value })}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="saving">Ahorro</option></select></label>
          <label>Emoji<input value={category.icon} onChange={event => setCategory({ ...category, icon: event.target.value })}/></label>
          <label>Límite mensual<input type="number" step="0.10" value={category.monthlyLimit} onChange={event => setCategory({ ...category, monthlyLimit: event.target.value })}/></label>
          <button>Guardar categoría</button>
        </form>
      </Card>
    </div>}

    {tab === 'goals' && <div className="grid2">
      <Card title="Mis metas" icon="🎯">
        <div className="goalList">{data.goals.map(item => {
          const pct = item.targetAmount ? Math.min(100, Math.round((Number(item.currentAmount || 0) / Number(item.targetAmount || 1)) * 100)) : 0;
          return <article key={item.id}><div><b>{item.name}</b><span>{money(item.currentAmount)} de {money(item.targetAmount)} · hasta {item.dueDate}</span></div><div className="progress"><i style={{ width: `${pct}%` }}/></div></article>;
        })}</div>
      </Card>
      <Card title="Crear meta" icon="🐷">
        <form className="financeForm" onSubmit={saveGoal}>
          <label>Nombre<input value={goal.name} onChange={event => setGoal({ ...goal, name: event.target.value })}/></label>
          <label>Monto objetivo<input type="number" min="1" step="0.10" value={goal.targetAmount} onChange={event => setGoal({ ...goal, targetAmount: event.target.value })}/></label>
          <label>Avance actual<input type="number" min="0" step="0.10" value={goal.currentAmount} onChange={event => setGoal({ ...goal, currentAmount: event.target.value })}/></label>
          <label>Fecha objetivo<input type="date" value={goal.dueDate} onChange={event => setGoal({ ...goal, dueDate: event.target.value })}/></label>
          <button>Guardar meta</button>
        </form>
      </Card>
    </div>}

    {tab === 'backup' && <div className="grid2">
      <Card title="Respaldar o llevar a Excel" icon="⬇️">
        <div className="financeBackupButtons"><button onClick={exportJson}><Download size={16}/> Descargar respaldo JSON</button><button onClick={exportCsv}><Download size={16}/> Descargar CSV para Excel</button><button className="dangerButton" onClick={() => { if (confirm('¿Borrar tus gastos personales de este perfil?')) { resetPersonalFinance(userId); refresh(); } }}><RefreshCcw size={16}/> Reiniciar mis finanzas</button></div>
      </Card>
      <Card title="Importar respaldo" icon="⬆️">
        <form className="financeForm" onSubmit={importJson}>
          <label>Pega tu JSON<textarea rows="9" value={importText} onChange={event => setImportText(event.target.value)} placeholder="Pega aquí un respaldo exportado desde MiZona"/></label>
          <button><Upload size={16}/> Importar</button>
        </form>
      </Card>
    </div>}
  </div>;
}
