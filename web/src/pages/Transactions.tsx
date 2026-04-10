import { useState, useCallback } from 'react';
import { useTransactions, useCategories, useRealtime, MOCK_TRANSACTIONS } from '../hooks';
import { formatUZS, formatDate } from '../utils';
import { Search, Pencil, Trash2, Check, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionsApi } from '../api';
import QuickAdd from '../components/QuickAdd';
import EmptyState from '../components/EmptyState';
import { TableRowSkeleton } from '../components/Skeleton';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

function isDemoSession(): boolean {
  try { return JSON.parse(localStorage.getItem('user') || '{}')?.isDemo === true; } catch { return false; }
}

function buildClientCsv(txs: any[]): string {
  const header = ['ID','Tur','Miqdor (UZS)','Kategoriya','Izoh','Manba','Sana'];
  const rows = txs.map(tx => [
    tx.id,
    tx.type === 'income' ? 'Kirim' : 'Chiqim',
    Number(tx.amount).toFixed(0),
    tx.category?.name || tx.category || '',
    (tx.note || '').replace(/"/g, '""'),
    tx.source || 'web',
    new Date(tx.date).toISOString().replace('T',' ').slice(0,19),
  ]);
  return '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\r\n');
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 20;

export default function Transactions() {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({ type:'', categoryId:'', search:'', from:'', to:'' });
  const [page, setPage]       = useState(1);
  const [exporting, setExporting] = useState(false);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
  const { data: txs, total, pages, loading, refetch } = useTransactions(
    Object.keys(activeFilters).length ? activeFilters : undefined,
    page,
    PAGE_SIZE,
  );
  const { data: categories } = useCategories();
  useRealtime(refetch); // live updates

  const [editId, setEditId]   = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const resetPage = useCallback(() => setPage(1), []);

  const setFilter = (key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val }));
    resetPage();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Tranzaksiyani o'chirish",
      message: "Bu amalni ortga qaytarib bo'lmaydi. Tranzaksiya butunlay o'chiriladi.",
      confirmLabel: "Ha, o'chir",
      cancelLabel: 'Bekor',
      variant: 'danger',
      icon: 'trash',
    });
    if (!ok) return;
    try {
      if (!isDemoSession()) await transactionsApi.delete(id);
      toast.success("O'chirildi", "Tranzaksiya muvaffaqiyatli o'chirildi");
      refetch();
    } catch {
      toast.error("Xatolik", "O'chirishda muammo yuz berdi. Qaytadan urining.");
    }
  };

  const startEdit = (tx: any) => {
    setEditId(tx.id);
    setEditData({ amount: tx.amount, type: tx.type, categoryId: tx.categoryId || tx.category?.id || '', note: tx.note || '', date: tx.date ? tx.date.slice(0,10) : '' });
  };

  const saveEdit = async () => {
    try {
      if (!isDemoSession()) await transactionsApi.update(editId!, editData);
      setEditId(null);
      refetch();
      toast.success('Yangilandi', 'Tranzaksiya muvaffaqiyatli yangilandi');
    } catch {
      toast.error('Xatolik', 'Yangilashda muammo yuz berdi.');
    }
  };
  const handleExport = async () => {
    setExporting(true);
    try {
      const date = new Date().toISOString().slice(0,10);
      const filename = `tranzaksiyalar-${date}.csv`;
      if (isDemoSession()) {
        // Build CSV from all mock transactions client-side
        downloadBlob(buildClientCsv(MOCK_TRANSACTIONS), filename);
      } else {
        const token = localStorage.getItem('token');
        const base  = import.meta.env.VITE_API_URL || '/api';
        const params = new URLSearchParams();
        if (activeFilters.type)       params.set('type', activeFilters.type);
        if (activeFilters.categoryId) params.set('categoryId', activeFilters.categoryId);
        if (activeFilters.from)       params.set('from', activeFilters.from);
        if (activeFilters.to)         params.set('to', activeFilters.to);
        const res = await fetch(`${base}/transactions/export/csv?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        downloadBlob(text, filename);
      }
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tranzaksiyalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Yuklanmoqda...' : `${total} ta yozuv`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50">
            <Download size={15} />
            {exporting ? 'Yuklanmoqda...' : 'CSV yuklab olish'}
          </button>
          <QuickAdd onCreated={() => { refetch(); resetPage(); }} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Izoh bo'yicha qidirish..." value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" />
          </div>
          <select value={filters.type} onChange={e => setFilter('type', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400">
            <option value="">Barcha turlar</option>
            <option value="income">✅ Kirim</option>
            <option value="expense">🔴 Chiqim</option>
          </select>
          <select value={filters.categoryId} onChange={e => setFilter('categoryId', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400">
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
          <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
          {hasFilters && (
            <button onClick={() => { setFilters({ type:'', categoryId:'', search:'', from:'', to:'' }); resetPage(); }}
              className="px-3 py-2.5 text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {!loading && txs.length === 0 ? (
        <EmptyState title="Tranzaksiyalar topilmadi" description="Filtrlarni o'zgartiring yoki yangi tranzaksiya qo'shing" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Tur','Miqdor','Kategoriya','Izoh','Sana','Manba',''].map((h,i) => (
                  <th key={i} className={`text-left py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${i===0?'px-6':'px-4'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 6 }).map((_,i) => <TableRowSkeleton key={i} cols={7} />)
                : txs.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                    {editId === tx.id ? (
                      <>
                        <td className="px-6 py-3">
                          <select value={editData.type} onChange={e => setEditData((d:any)=>({...d,type:e.target.value}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                            <option value="income">Kirim</option>
                            <option value="expense">Chiqim</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={editData.amount} onChange={e => setEditData((d:any)=>({...d,amount:e.target.value}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-32" />
                        </td>
                        <td className="px-4 py-3">
                          <select value={editData.categoryId} onChange={e => setEditData((d:any)=>({...d,categoryId:e.target.value}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                            <option value="">—</option>
                            {categories.filter((c:any)=>c.type===editData.type||c.type==='both').map((c:any)=>(
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" value={editData.note} onChange={e => setEditData((d:any)=>({...d,note:e.target.value}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-32" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="date" value={editData.date} onChange={e => setEditData((d:any)=>({...d,date:e.target.value}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                        </td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={saveEdit} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100"><Check size={13}/></button>
                            <button onClick={()=>setEditId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={13}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${tx.type==='income'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>
                            {tx.type==='income'?'✅ Kirim':'🔴 Chiqim'}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-sm font-semibold tabular-nums ${tx.type==='income'?'text-green-600':'text-red-500'}`}>
                          {tx.type==='income'?'+':'-'}{formatUZS(tx.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1.5 text-sm text-gray-700">
                            {tx.category?.icon||tx.categoryIcon||'📦'} {tx.category?.name||tx.category||<span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 max-w-xs truncate">{tx.note||<span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-400">{formatDate(tx.date)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-md ${tx.source==='bot'?'bg-purple-50 text-purple-600':'bg-gray-100 text-gray-500'}`}>
                            {tx.source==='bot'?'🤖 bot':'🌐 web'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>startEdit(tx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={13}/></button>
                            <button onClick={()=>handleDelete(tx.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              }
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} / {total} ta
              </span>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={15}/>
                </button>
                {Array.from({length:Math.min(7,pages)},(_,i)=>{
                  let p: number;
                  if (pages<=7) p=i+1;
                  else if (page<=4) p=i+1;
                  else if (page>=pages-3) p=pages-6+i;
                  else p=page-3+i;
                  return (
                    <button key={p} onClick={()=>setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        page===p?'bg-indigo-500 text-white shadow-sm':'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={15}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
