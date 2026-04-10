import { useState } from 'react';
import { useCategories } from '../hooks';
import { categoriesApi } from '../api';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';

const ICONS = ['💰','🛠','📈','🤝','➕','🍽','🚗','📦','🏠','👷','📣','💡','🏛','➖','🎯','💼','🔧','📱','🌐','💳'];

export default function Categories() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: categories, refetch } = useCategories();
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [adding, setAdding] = useState(false);
  const [newData, setNewData] = useState({ name: '', type: 'expense', icon: '📦' });

  const income = categories.filter((c: any) => c.type === 'income' || c.type === 'both');
  const expense = categories.filter((c: any) => c.type === 'expense' || c.type === 'both');

  const saveEdit = async () => {
    try {
      await categoriesApi.update(editId!, editData);
      setEditId(null); refetch();
      toast.success('Yangilandi', 'Kategoriya muvaffaqiyatli yangilandi');
    } catch { toast.error('Xatolik', 'Yangilashda muammo yuz berdi'); }
  };

  const saveNew = async () => {
    if (!newData.name.trim()) return;
    try {
      await categoriesApi.create(newData);
      setAdding(false); setNewData({ name: '', type: 'expense', icon: '📦' }); refetch();
      toast.success("Qo'shildi", `"${newData.name}" kategoriyasi yaratildi`);
    } catch { toast.error('Xatolik', "Yaratishda muammo yuz berdi"); }
  };

  const handleDelete = async (cat: any) => {
    const ok = await confirm({
      title: `"${cat.name}" kategoriyasini o'chirish`,
      message: "Bu kategoriyaga biriktirilgan tranzaksiyalar kategoriyasiz qoladi.",
      confirmLabel: "Ha, o'chir",
      variant: 'danger',
      icon: 'trash',
    });
    if (!ok) return;
    try {
      await categoriesApi.delete(cat.id); refetch();
      toast.success("O'chirildi", `"${cat.name}" kategoriyasi o'chirildi`);
    } catch { toast.error('Xatolik', "O'chirishda muammo yuz berdi"); }
  };

  const CatRow = ({ cat }: { cat: any }) => (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
      {editId === cat.id ? (
        <>
          <select value={editData.icon} onChange={e => setEditData((d: any) => ({ ...d, icon: e.target.value }))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input type="text" value={editData.name} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-brand-500" />
          <select value={editData.type} onChange={e => setEditData((d: any) => ({ ...d, type: e.target.value }))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            <option value="income">Kirim</option>
            <option value="expense">Chiqim</option>
            <option value="both">Ikkalasi</option>
          </select>
          <button onClick={saveEdit} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600"><Check size={13} /></button>
          <button onClick={() => setEditId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500"><X size={13} /></button>
        </>
      ) : (
        <>
          <span className="text-xl w-8 text-center">{cat.icon}</span>
          <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
          {cat.isDefault && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md">standart</span>}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditId(cat.id); setEditData({ name: cat.name, type: cat.type, icon: cat.icon }); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
            {!cat.isDefault && (
              <button onClick={() => handleDelete(cat)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} ta kategoriya</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={16} /> Yangi kategoriya
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Yangi kategoriya</h3>
          <div className="flex gap-3 flex-wrap">
            <select value={newData.icon} onChange={e => setNewData(d => ({ ...d, icon: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500">
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input type="text" placeholder="Kategoriya nomi" value={newData.name}
              onChange={e => setNewData(d => ({ ...d, name: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" />
            <select value={newData.type} onChange={e => setNewData(d => ({ ...d, type: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500">
              <option value="income">Kirim</option>
              <option value="expense">Chiqim</option>
              <option value="both">Ikkalasi</option>
            </select>
            <button onClick={saveNew} className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600">Saqlash</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">Bekor</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {[
          { title: 'Kirim kategoriyalari', emoji: '✅', color: 'text-green-500', data: income },
          { title: 'Chiqim kategoriyalari', emoji: '🔴', color: 'text-red-500', data: expense },
        ].map(({ title, emoji, color, data }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className={`font-bold text-lg ${color}`}>{emoji}</span>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <span className="ml-auto text-xs text-gray-400">{data.length} ta</span>
            </div>
            {data.map((cat: any) => <CatRow key={cat.id} cat={cat} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
