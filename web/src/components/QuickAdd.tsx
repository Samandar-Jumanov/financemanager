import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { transactionsApi } from '../api';
import { MOCK_CATEGORIES } from '../hooks';
import { useToast } from './Toast';

interface Props { onCreated: () => void; }

function isDemoSession(): boolean {
  try { return JSON.parse(localStorage.getItem('user') || '{}')?.isDemo === true; } catch { return false; }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuickAdd({ onCreated }: Props) {
  const toast = useToast();
  const [open, setOpen]           = useState(false);
  const [type, setType]           = useState<'income'|'expense'>('expense');
  const [amount, setAmount]       = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote]           = useState('');
  const [date, setDate]           = useState(todayStr());
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (isDemoSession()) { setCategories(MOCK_CATEGORIES); return; }
    import('../api').then(({ categoriesApi }) =>
      categoriesApi.getAll().then(setCategories).catch(() => setCategories(MOCK_CATEGORIES))
    );
  }, []);

  const filtered = categories.filter(c => c.type === type || c.type === 'both');

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount.replace(/\s/g, '')))) return;
    setLoading(true);
    try {
      if (!isDemoSession()) {
        await transactionsApi.create({
          amount: Number(amount.replace(/\s/g, '')),
          type,
          categoryId: categoryId || undefined,
          note: note || undefined,
          source: 'web',
          date: date ? new Date(date).toISOString() : undefined,
        });
      }
      const typeLabel = type === 'income' ? 'Kirim' : 'Chiqim';
      toast.success('Saqlandi!', `${typeLabel} — ${Number(amount.replace(/\s/g,'')).toLocaleString('uz-UZ')} UZS`);
      setAmount(''); setNote(''); setCategoryId(''); setDate(todayStr());
      setOpen(false);
      onCreated();
    } catch {
      toast.error('Xatolik', 'Saqlashda muammo yuz berdi. Qaytadan urining.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm">
        <Plus size={16} /> Tranzaksiya qo'shish
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Yangi tranzaksiya</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['income','expense'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setCategoryId(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              type===t ? (t==='income'?'bg-green-500 text-white':'bg-red-500 text-white') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {t==='income'?'✅ Kirim':'🔴 Chiqim'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <input type="text" placeholder="Miqdor (UZS)" value={amount} onChange={e=>setAmount(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        <select value={categoryId} onChange={e=>setCategoryId(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 bg-white">
          <option value="">Kategoriya tanlang</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <input type="text" placeholder="Izoh (ixtiyoriy)" value={note} onChange={e=>setNote(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sana</label>
          <input type="date" value={date} max={todayStr()} onChange={e=>setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <button onClick={handleSubmit} disabled={loading || !amount}
          className="w-full py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {loading ? 'Saqlanmoqda...' : isDemoSession() ? '✓ Demo (saqlanmaydi)' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
