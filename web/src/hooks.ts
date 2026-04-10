import { useState, useEffect, useCallback } from 'react';
import { transactionsApi, categoriesApi, budgetApi } from './api';

function isDemo(): boolean {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user)?.isDemo === true : false;
  } catch { return false; }
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByPeriod(txs: any[], period: 'week' | 'month' | 'year') {
  const now = new Date();
  let from: Date;
  if (period === 'week')  from = getWeekStart();
  else if (period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
  else from = new Date(now.getFullYear(), 0, 1);
  return txs.filter(tx => new Date(tx.date) >= from);
}

function prevPeriodTxs(period: 'week' | 'month' | 'year') {
  if (period === 'week')  return MOCK_TRANSACTIONS.slice(4, 9);
  if (period === 'month') return MOCK_TRANSACTIONS.slice(2, 8);
  return MOCK_TRANSACTIONS;
}

function computeStats(txs: any[], prevTxs: any[]) {
  const sum = (arr: any[], type: string) =>
    arr.filter(t => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
  return {
    income:           sum(txs, 'income'),
    expenses:         sum(txs, 'expense'),
    net:              sum(txs, 'income') - sum(txs, 'expense'),
    prevIncome:       sum(prevTxs, 'income'),
    prevExpenses:     sum(prevTxs, 'expense'),
    prevNet:          sum(prevTxs, 'income') - sum(prevTxs, 'expense'),
    transactionCount: txs.length,
    transactions:     txs,
  };
}

export interface PaginatedResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function useTransactions(filters?: any, page = 1, limit = 50) {
  const [result, setResult] = useState<PaginatedResult>({ data: [], total: 0, page: 1, limit, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemo()) {
      let txs = [...MOCK_TRANSACTIONS];
      if (filters?.type)       txs = txs.filter(t => t.type === filters.type);
      if (filters?.search)     txs = txs.filter(t => t.note?.toLowerCase().includes(filters.search.toLowerCase()));
      if (filters?.from)       txs = txs.filter(t => new Date(t.date) >= new Date(filters.from));
      if (filters?.to)         txs = txs.filter(t => new Date(t.date) <= new Date(filters.to));
      if (filters?.categoryId) txs = txs.filter(t => t.category === filters.categoryId);
      const total = txs.length;
      const start = (page - 1) * limit;
      setResult({ data: txs.slice(start, start + limit), total, page, limit, pages: Math.ceil(total / limit) });
      setLoading(false);
      return;
    }
    try {
      const res = await transactionsApi.getAll({ ...filters, page, limit });
      // Handle both paginated {data, total, ...} and legacy plain array
      if (Array.isArray(res)) {
        setResult({ data: res, total: res.length, page: 1, limit: res.length, pages: 1 });
      } else {
        setResult(res);
      }
    } catch {
      setResult({ data: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length, page: 1, limit, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), page, limit]);

  useEffect(() => { fetch(); }, [fetch]);
  // backwards-compat: expose data directly as well
  return { ...result, loading, error, refetch: fetch };
}

export function useStats(period: 'week' | 'month' | 'year' = 'month') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemo()) {
      const current = filterByPeriod(MOCK_TRANSACTIONS, period);
      const prev    = prevPeriodTxs(period);
      setData(computeStats(current, prev));
      setLoading(false);
      return;
    }
    try {
      const res = await transactionsApi.getStats(period);
      setData(res);
    } catch {
      setData(computeStats(MOCK_TRANSACTIONS, prevPeriodTxs(period)));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data: data || computeStats(MOCK_TRANSACTIONS, prevPeriodTxs(period)), loading, refetch: fetch };
}

export function useChartData(period: 'week' | 'month' | 'year' = 'month') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo()) {
      const txs = filterByPeriod(MOCK_TRANSACTIONS, period);
      const dailyMap: Record<string, any> = {};
      for (const tx of txs) {
        const key = new Date(tx.date).toISOString().split('T')[0];
        if (!dailyMap[key]) dailyMap[key] = { date: key, income: 0, expense: 0 };
        dailyMap[key][tx.type === 'income' ? 'income' : 'expense'] += tx.amount;
      }
      const catMap: Record<string, any> = {};
      for (const tx of txs) {
        const key = tx.category;
        if (!catMap[key]) catMap[key] = { name: tx.category, icon: tx.categoryIcon, value: 0, type: tx.type };
        catMap[key].value += tx.amount;
      }
      setData({
        daily:      Object.values(dailyMap).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        byCategory: Object.values(catMap).sort((a: any, b: any) => b.value - a.value),
      });
      setLoading(false);
      return;
    }
    transactionsApi.getChart(period)
      .then(setData)
      .catch(() => setData(MOCK_CHART))
      .finally(() => setLoading(false));
  }, [period]);

  return { data: data || MOCK_CHART, loading };
}

export function useCategories() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemo()) { setData(MOCK_CATEGORIES); setLoading(false); return; }
    try {
      const res = await categoriesApi.getAll();
      setData(res);
    } catch {
      setData(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useBudgets() {
  const [data, setData]     = useState<any[]>([]);
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemo()) { setData(MOCK_BUDGETS); setStatus(MOCK_BUDGET_STATUS); setLoading(false); return; }
    try {
      const [b, s] = await Promise.all([budgetApi.getAll(), budgetApi.getStatus()]);
      setData(b); setStatus(s);
    } catch {
      setData(MOCK_BUDGETS); setStatus(MOCK_BUDGET_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, status, loading, refetch: fetch };
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS = [
  { id:'1',  type:'income',  amount:12500000, category:'Savdo',         categoryIcon:'💰', note:'Yanvar oylik tushum',       date:new Date(Date.now()-1*3600000).toISOString(),   source:'bot' },
  { id:'2',  type:'expense', amount:  850000, category:'Logistika',     categoryIcon:'📦', note:'Yetkazib berish xarajati',  date:new Date(Date.now()-3*3600000).toISOString(),   source:'bot' },
  { id:'3',  type:'income',  amount: 4300000, category:'Xizmat',        categoryIcon:'🛠', note:"Konsultatsiya to'lovi",     date:new Date(Date.now()-5*3600000).toISOString(),   source:'web' },
  { id:'4',  type:'expense', amount: 2100000, category:'Maosh',         categoryIcon:'👷', note:"Oy oxiri maoshi",           date:new Date(Date.now()-1*86400000).toISOString(),  source:'bot' },
  { id:'5',  type:'income',  amount: 7800000, category:'Savdo',         categoryIcon:'💰', note:'Online savdo',              date:new Date(Date.now()-1*86400000).toISOString(),  source:'web' },
  { id:'6',  type:'expense', amount:  460000, category:'Marketing',     categoryIcon:'📣', note:'Instagram reklama',         date:new Date(Date.now()-2*86400000).toISOString(),  source:'bot' },
  { id:'7',  type:'expense', amount: 3200000, category:'Ijara',         categoryIcon:'🏠', note:'Ofis ijarasi',              date:new Date(Date.now()-3*86400000).toISOString(),  source:'web' },
  { id:'8',  type:'income',  amount: 5500000, category:'Xizmat',        categoryIcon:'🛠', note:"Loyiha to'lovi",            date:new Date(Date.now()-3*86400000).toISOString(),  source:'bot' },
  { id:'9',  type:'expense', amount:  320000, category:'Boshqa chiqim', categoryIcon:'➖', note:'Ofis xarajatlari',          date:new Date(Date.now()-4*86400000).toISOString(),  source:'web' },
  { id:'10', type:'income',  amount: 9100000, category:'Savdo',         categoryIcon:'💰', note:'Ulgurji buyurtma',          date:new Date(Date.now()-5*86400000).toISOString(),  source:'bot' },
  { id:'11', type:'expense', amount:  750000, category:'Kommunal',      categoryIcon:'💡', note:'Elektr va gaz',             date:new Date(Date.now()-6*86400000).toISOString(),  source:'web' },
  { id:'12', type:'income',  amount: 3200000, category:'Investitsiya',  categoryIcon:'📈', note:'Dividendlar',               date:new Date(Date.now()-7*86400000).toISOString(),  source:'bot' },
];

export const MOCK_STATS = computeStats(MOCK_TRANSACTIONS, MOCK_TRANSACTIONS.slice(3));

export const MOCK_CHART = {
  daily: [
    { date:new Date(Date.now()-8*86400000).toISOString().split('T')[0], income:4200000, expense:1100000 },
    { date:new Date(Date.now()-7*86400000).toISOString().split('T')[0], income:0,        expense: 850000 },
    { date:new Date(Date.now()-6*86400000).toISOString().split('T')[0], income:7800000, expense:      0 },
    { date:new Date(Date.now()-5*86400000).toISOString().split('T')[0], income:0,        expense:2100000 },
    { date:new Date(Date.now()-4*86400000).toISOString().split('T')[0], income:3100000, expense: 460000 },
    { date:new Date(Date.now()-3*86400000).toISOString().split('T')[0], income:9100000, expense:3200000 },
    { date:new Date(Date.now()-2*86400000).toISOString().split('T')[0], income:5500000, expense: 320000 },
    { date:new Date(Date.now()-1*86400000).toISOString().split('T')[0], income:4300000, expense: 750000 },
    { date:new Date(Date.now()           ).toISOString().split('T')[0], income:5200000, expense:      0 },
  ],
  byCategory: [
    { name:'Savdo',         icon:'💰', value:29400000, type:'income'  },
    { name:'Xizmat',        icon:'🛠', value: 9800000, type:'income'  },
    { name:'Investitsiya',  icon:'📈', value: 3200000, type:'income'  },
    { name:'Ijara',         icon:'🏠', value: 3200000, type:'expense' },
    { name:'Maosh',         icon:'👷', value: 2100000, type:'expense' },
    { name:'Logistika',     icon:'📦', value:  850000, type:'expense' },
    { name:'Kommunal',      icon:'💡', value:  750000, type:'expense' },
    { name:'Marketing',     icon:'📣', value:  460000, type:'expense' },
    { name:'Boshqa chiqim', icon:'➖', value:  320000, type:'expense' },
  ],
};

export const MOCK_CATEGORIES = [
  { id:'1',  name:'Savdo',         type:'income',  icon:'💰', isDefault:true },
  { id:'2',  name:'Xizmat',        type:'income',  icon:'🛠', isDefault:true },
  { id:'3',  name:'Investitsiya',  type:'income',  icon:'📈', isDefault:true },
  { id:'4',  name:"Qarz olindi",   type:'income',  icon:'🤝', isDefault:true },
  { id:'5',  name:'Boshqa kirim',  type:'income',  icon:'➕', isDefault:true },
  { id:'6',  name:'Oziq-ovqat',    type:'expense', icon:'🍽', isDefault:true },
  { id:'7',  name:'Transport',     type:'expense', icon:'🚗', isDefault:true },
  { id:'8',  name:'Logistika',     type:'expense', icon:'📦', isDefault:true },
  { id:'9',  name:'Ijara',         type:'expense', icon:'🏠', isDefault:true },
  { id:'10', name:'Maosh',         type:'expense', icon:'👷', isDefault:true },
  { id:'11', name:'Marketing',     type:'expense', icon:'📣', isDefault:true },
  { id:'12', name:'Kommunal',      type:'expense', icon:'💡', isDefault:true },
  { id:'13', name:'Soliq',         type:'expense', icon:'🏛', isDefault:true },
  { id:'14', name:'Boshqa chiqim', type:'expense', icon:'➖', isDefault:true },
];

export const MOCK_BUDGETS = [
  { id:'1', categoryId:'9',  category:{ name:'Ijara',     icon:'🏠' }, limitAmount:4000000, period:'month' },
  { id:'2', categoryId:'8',  category:{ name:'Logistika', icon:'📦' }, limitAmount:2000000, period:'month' },
  { id:'3', categoryId:'11', category:{ name:'Marketing', icon:'📣' }, limitAmount:1000000, period:'month' },
  { id:'4', categoryId:'10', category:{ name:'Maosh',     icon:'👷' }, limitAmount:5000000, period:'month' },
];

export const MOCK_BUDGET_STATUS = [
  { id:'1', category:{ name:'Ijara',     icon:'🏠' }, limitAmount:4000000, spent:3200000, remaining: 800000, percentage:80, status:'warning' },
  { id:'2', category:{ name:'Logistika', icon:'📦' }, limitAmount:2000000, spent: 850000, remaining:1150000, percentage:43, status:'ok'      },
  { id:'3', category:{ name:'Marketing', icon:'📣' }, limitAmount:1000000, spent: 460000, remaining: 540000, percentage:46, status:'ok'      },
  { id:'4', category:{ name:'Maosh',     icon:'👷' }, limitAmount:5000000, spent:2100000, remaining:2900000, percentage:42, status:'ok'      },
];

// ── Real-time SSE hook ────────────────────────────────────────────────────────
export function useRealtime(onUpdate: () => void) {
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('token');
    if (!token) return;

    // SSE connection with auth token in URL param (EventSource doesn't support headers)
    const url = `${apiUrl}/transactions/stream?token=${encodeURIComponent(token)}`;
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(url);

      es.onmessage = (event) => {
        if (!event.data || event.data.trim() === '') return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transaction' || msg.type === 'deleted') {
            onUpdate();
          }
        } catch {}
      };

      es.onerror = () => {
        es?.close();
        // Reconnect after 5s
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);
}
