import { useBudgets, useCategories } from '../hooks';
import { budgetApi } from '../api';
import { formatUZS } from '../utils';
import { useState } from 'react';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';

export default function Budgets() {
  const toast = useToast();
  const confirm = useConfirm();
  const { status, loading, refetch } = useBudgets();
  const { data: categories } = useCategories();
  const [adding, setAdding] = useState(false);
  const [newData, setNewData] = useState({ categoryId: '', limitAmount: '' });

  const expenseCats = categories.filter((c: any) => c.type === 'expense' || c.type === 'both');
  const usedIds = new Set(status.map((s: any) => s.category?.id));
  const available = expenseCats.filter((c: any) => !usedIds.has(c.id));

  const handleAdd = async () => {
    if (!newData.categoryId || !newData.limitAmount) return;
    try {
      await budgetApi.create({ categoryId: newData.categoryId, limitAmount: Number(newData.limitAmount) });
      setAdding(false); setNewData({ categoryId: '', limitAmount: '' }); refetch();
      toast.success("Limit qo'shildi", `${formatUZS(Number(newData.limitAmount))} limit belgilandi`);
    } catch { toast.error('Xatolik', "Limit qo'shishda muammo yuz berdi"); }
  };

  const handleDeleteBudget = async (item: any) => {
    const ok = await confirm({
      title: `"${item.category?.name}" limitini o'chirish`,
      message: 'Byudjet limiti o\'chiriladi. Tranzaksiyalar saqlanib qoladi.',
      confirmLabel: "Ha, o'chir",
      variant: 'danger',
      icon: 'trash',
    });
    if (!ok) return;
    try {
      await budgetApi.delete(item.id); refetch();
      toast.success("O'chirildi", 'Byudjet limiti o\'chirildi');
    } catch { toast.error('Xatolik', "O'chirishda muammo yuz berdi"); }
  };

  const statusIcon = (s: string) => {
    if (s === 'exceeded') return <XCircle size={16} className="text-red-500" />;
    if (s === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
    return <CheckCircle size={16} className="text-green-500" />;
  };
  const barColor = (pct: number) => pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Byudjet nazorati</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kategoriya bo'yicha oylik chiqim limiti</p>
        </div>
        {available.length > 0 && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            <Plus size={16} /> Limit qo'shish
          </button>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Target size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-medium text-amber-800">Byudjet nazorati nima?</div>
          <div className="text-xs text-amber-600 mt-0.5">Har bir kategoriya uchun oylik chiqim limiti belgilang. 80% ga yetganda ogohlantirish, 100% oshsa xabar beriladi.</div>
        </div>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Yangi limit</h3>
          <div className="flex gap-3">
            <select value={newData.categoryId} onChange={e => setNewData(d => ({ ...d, categoryId: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500">
              <option value="">Kategoriya tanlang</option>
              {available.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" placeholder="Limit (UZS)" value={newData.limitAmount}
              onChange={e => setNewData(d => ({ ...d, limitAmount: e.target.value }))}
              className="w-48 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" />
            <button onClick={handleAdd} className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600">Saqlash</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">Bekor</button>
          </div>
        </div>
      )}

      {status.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitlar belgilanmagan</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Kategoriyalar uchun oylik chiqim limiti belgilang</p>
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 mx-auto">
            <Plus size={16} /> Birinchi limitni qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {status.map((item: any) => (
            <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${item.status === 'exceeded' ? 'border-red-200' : item.status === 'warning' ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.category?.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.category?.name}</div>
                    <div className="text-xs text-gray-400">Bu oy</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(item.status)}
                  <button onClick={() => handleDeleteBudget(item)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${barColor(item.percentage)}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-gray-900">{formatUZS(item.spent)}</span>
                  <span className="text-gray-400"> / {formatUZS(item.limitAmount || item.limit)}</span>
                </div>
                <span className={`font-bold ${item.status === 'exceeded' ? 'text-red-500' : item.status === 'warning' ? 'text-amber-500' : 'text-green-600'}`}>
                  {item.percentage || item.pct}%
                </span>
              </div>
              {item.status === 'warning' && (
                <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⚠️ Limitning 80% ishlatildi. Ehtiyot bo'ling!</div>
              )}
              {item.status === 'exceeded' && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">🚨 Limit oshib ketdi!</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
