const STORAGE_KEY = 'mizona-v8-personal-finance-v30';

const DEFAULT_CATEGORIES = [
  { id: 'cat-food', name: 'Alimentación', type: 'expense', icon: '🍽️', monthlyLimit: 650 },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', icon: '🚌', monthlyLimit: 220 },
  { id: 'cat-school', name: 'Colegio e hijos', type: 'expense', icon: '🎒', monthlyLimit: 350 },
  { id: 'cat-home', name: 'Hogar y servicios', type: 'expense', icon: '🏠', monthlyLimit: 480 },
  { id: 'cat-health', name: 'Salud', type: 'expense', icon: '🩺', monthlyLimit: 180 },
  { id: 'cat-entertainment', name: 'Diversión', type: 'expense', icon: '🎮', monthlyLimit: 150 },
  { id: 'cat-savings', name: 'Ahorro', type: 'saving', icon: '🐷', monthlyLimit: 300 },
  { id: 'cat-income', name: 'Ingreso principal', type: 'income', icon: '💼', monthlyLimit: 0 },
  { id: 'cat-extra', name: 'Ingreso extra', type: 'income', icon: '💵', monthlyLimit: 0 }
];

const DEFAULT_ACCOUNTS = [
  { id: 'acc-cash', name: 'Efectivo', type: 'cash', initialBalance: 0, color: 'green' },
  { id: 'acc-bank', name: 'Cuenta bancaria', type: 'bank', initialBalance: 0, color: 'blue' },
  { id: 'acc-yape', name: 'Yape / Plin', type: 'wallet', initialBalance: 0, color: 'purple' }
];

const DEMO_TRANSACTIONS = [
  { id: 'tx-demo-1', userId: 'local-user-jose', type: 'income', categoryId: 'cat-income', accountId: 'acc-bank', amount: 3200, date: today(-5), description: 'Sueldo mensual', note: 'Ingreso de ejemplo', status: 'confirmed' },
  { id: 'tx-demo-2', userId: 'local-user-jose', type: 'expense', categoryId: 'cat-school', accountId: 'acc-yape', amount: 36, date: today(-2), description: 'Auxiliar, aseo y copias', note: 'Cuota del aula', status: 'confirmed' },
  { id: 'tx-demo-3', userId: 'local-user-jose', type: 'expense', categoryId: 'cat-food', accountId: 'acc-cash', amount: 82.5, date: today(-1), description: 'Mercado familiar', note: '', status: 'confirmed' },
  { id: 'tx-demo-4', userId: 'local-user-jose', type: 'saving', categoryId: 'cat-savings', accountId: 'acc-bank', amount: 150, date: today(0), description: 'Ahorro semanal', note: 'Meta familiar', status: 'confirmed' }
];

const DEFAULT_GOALS = [
  { id: 'goal-emergency', userId: 'local-user-jose', name: 'Fondo de emergencia', targetAmount: 2000, currentAmount: 450, dueDate: today(90), status: 'active' },
  { id: 'goal-school', userId: 'local-user-jose', name: 'Gastos escolares', targetAmount: 800, currentAmount: 120, dueDate: today(45), status: 'active' }
];

function today(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function uid(prefix = 'pf') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function monthKey(date = new Date()) {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentUserId() {
  try {
    const raw = sessionStorage.getItem('mizona-v8-active-local-profile-v14');
    if (raw) return raw;
  } catch {}
  return 'local-user-jose';
}

export function emptyFinanceState() {
  return {
    version: 30,
    categories: DEFAULT_CATEGORIES,
    accounts: DEFAULT_ACCOUNTS,
    transactions: DEMO_TRANSACTIONS,
    goals: DEFAULT_GOALS,
    recurring: [
      { id: 'rec-rent', userId: 'local-user-jose', name: 'Servicios del hogar', type: 'expense', categoryId: 'cat-home', amount: 180, dayOfMonth: 5, active: true },
      { id: 'rec-school', userId: 'local-user-jose', name: 'Cuota escolar mensual', type: 'expense', categoryId: 'cat-school', amount: 36, dayOfMonth: 25, active: true }
    ],
    alerts: [],
    updatedAt: new Date().toISOString()
  };
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return emptyFinanceState();
    const base = emptyFinanceState();
    return {
      ...base,
      ...saved,
      version: 30,
      categories: Array.isArray(saved.categories) && saved.categories.length ? saved.categories : base.categories,
      accounts: Array.isArray(saved.accounts) && saved.accounts.length ? saved.accounts : base.accounts,
      transactions: Array.isArray(saved.transactions) ? saved.transactions : [],
      goals: Array.isArray(saved.goals) ? saved.goals : [],
      recurring: Array.isArray(saved.recurring) ? saved.recurring : [],
      alerts: Array.isArray(saved.alerts) ? saved.alerts : []
    };
  } catch {
    return emptyFinanceState();
  }
}

function writeState(next) {
  const normalized = { ...next, version: 30, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('mizona-personal-finance-updated', { detail: normalized }));
  try { new BroadcastChannel('mizona-personal-finance-v30').postMessage({ type: 'updated' }); } catch {}
  return normalized;
}

export function subscribePersonalFinance(callback) {
  const listener = () => callback(readState());
  window.addEventListener('mizona-personal-finance-updated', listener);
  let channel;
  try {
    channel = new BroadcastChannel('mizona-personal-finance-v30');
    channel.onmessage = listener;
  } catch {}
  return () => {
    window.removeEventListener('mizona-personal-finance-updated', listener);
    if (channel) channel.close();
  };
}

export function listFinanceData(userId = currentUserId()) {
  const state = readState();
  const transactions = state.transactions.filter(item => item.userId === userId);
  const goals = state.goals.filter(item => item.userId === userId);
  const recurring = state.recurring.filter(item => item.userId === userId);
  return { ...state, transactions, goals, recurring, userId };
}

export function allFinanceState() {
  return readState();
}

export function upsertTransaction(values, userId = currentUserId()) {
  const state = readState();
  const amount = Number(values.amount || 0);
  if (!amount || amount <= 0) throw new Error('Ingresa un monto válido mayor a cero.');
  const tx = {
    id: values.id || uid('tx'),
    userId,
    type: values.type || 'expense',
    categoryId: values.categoryId || 'cat-food',
    accountId: values.accountId || 'acc-cash',
    amount,
    date: values.date || today(),
    description: String(values.description || '').trim() || 'Movimiento personal',
    note: String(values.note || '').trim(),
    receiptRef: String(values.receiptRef || '').trim(),
    status: values.status || 'confirmed',
    createdAt: values.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const exists = state.transactions.some(item => item.id === tx.id && item.userId === userId);
  const transactions = exists ? state.transactions.map(item => item.id === tx.id && item.userId === userId ? tx : item) : [tx, ...state.transactions];
  return writeState({ ...state, transactions });
}

export function deleteTransaction(id, userId = currentUserId()) {
  const state = readState();
  return writeState({ ...state, transactions: state.transactions.filter(item => !(item.id === id && item.userId === userId)) });
}

export function upsertGoal(values, userId = currentUserId()) {
  const state = readState();
  const goal = {
    id: values.id || uid('goal'),
    userId,
    name: String(values.name || '').trim() || 'Nueva meta',
    targetAmount: Number(values.targetAmount || 0),
    currentAmount: Number(values.currentAmount || 0),
    dueDate: values.dueDate || today(30),
    status: values.status || 'active',
    updatedAt: new Date().toISOString()
  };
  if (goal.targetAmount <= 0) throw new Error('La meta debe tener un monto objetivo mayor a cero.');
  const exists = state.goals.some(item => item.id === goal.id && item.userId === userId);
  const goals = exists ? state.goals.map(item => item.id === goal.id && item.userId === userId ? goal : item) : [goal, ...state.goals];
  return writeState({ ...state, goals });
}

export function upsertCategory(values) {
  const state = readState();
  const category = {
    id: values.id || uid('cat'),
    name: String(values.name || '').trim() || 'Nueva categoría',
    type: values.type || 'expense',
    icon: values.icon || '💳',
    monthlyLimit: Number(values.monthlyLimit || 0)
  };
  const exists = state.categories.some(item => item.id === category.id);
  const categories = exists ? state.categories.map(item => item.id === category.id ? category : item) : [...state.categories, category];
  return writeState({ ...state, categories });
}

export function calculateFinanceSummary(data, key = monthKey()) {
  const txs = data.transactions || [];
  const monthTx = txs.filter(item => monthKey(item.date) === key && item.status !== 'cancelled');
  const income = monthTx.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = monthTx.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savings = monthTx.filter(item => item.type === 'saving').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = income - expenses - savings;
  const byCategory = data.categories.map(cat => {
    const total = monthTx.filter(item => item.categoryId === cat.id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { ...cat, total, remaining: Number(cat.monthlyLimit || 0) - total };
  }).filter(item => item.total > 0 || item.monthlyLimit > 0);
  const accountTotals = data.accounts.map(account => {
    const incoming = txs.filter(item => item.accountId === account.id && item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const outgoing = txs.filter(item => item.accountId === account.id && item.type !== 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { ...account, balance: Number(account.initialBalance || 0) + incoming - outgoing };
  });
  return { income, expenses, savings, balance, byCategory, accountTotals, monthTx, monthKey: key };
}

export function exportFinanceJson(userId = currentUserId()) {
  const data = listFinanceData(userId);
  return JSON.stringify({ exportedAt: new Date().toISOString(), userId, data }, null, 2);
}

export function importFinanceJson(text, userId = currentUserId()) {
  const parsed = JSON.parse(text);
  const payload = parsed.data || parsed;
  const state = readState();
  const cleanTransactions = Array.isArray(payload.transactions) ? payload.transactions.map(item => ({ ...item, id: item.id || uid('tx'), userId })) : [];
  const cleanGoals = Array.isArray(payload.goals) ? payload.goals.map(item => ({ ...item, id: item.id || uid('goal'), userId })) : [];
  return writeState({
    ...state,
    categories: Array.isArray(payload.categories) && payload.categories.length ? payload.categories : state.categories,
    accounts: Array.isArray(payload.accounts) && payload.accounts.length ? payload.accounts : state.accounts,
    transactions: [...state.transactions.filter(item => item.userId !== userId), ...cleanTransactions],
    goals: [...state.goals.filter(item => item.userId !== userId), ...cleanGoals]
  });
}

export function resetPersonalFinance(userId = currentUserId()) {
  const state = readState();
  return writeState({
    ...state,
    transactions: state.transactions.filter(item => item.userId !== userId),
    goals: state.goals.filter(item => item.userId !== userId),
    recurring: state.recurring.filter(item => item.userId !== userId)
  });
}

export function getMonthKey(date = new Date()) {
  return monthKey(date);
}
