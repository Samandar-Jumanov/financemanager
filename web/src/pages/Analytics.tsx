import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartData, useStats } from '../hooks';
import { formatUZS, categoryColor } from '../utils';
import EmptyState from '../components/EmptyState';
import { ChartSkeleton, Skeleton } from '../components/Skeleton';

const fmt = (v: number) => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+'M' : v >= 1_000 ? (v/1_000).toFixed(0)+'K' : String(v);

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <div className="font-medium text-gray-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color:p.color }} className="flex gap-2">
          <span>{p.name==='income'?'Kirim':p.name==='expense'?'Chiqim':p.name}:</span>
          <span className="font-semibold">{formatUZS(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function PieSection({ title, data, offset }: { title:string; data:any[]; offset:number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-5">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Ma'lumot yo'q</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                {data.map((_:any,i:number)=><Cell key={i} fill={categoryColor(i+offset)}/>)}
              </Pie>
              <Tooltip formatter={(v:any)=>formatUZS(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2 overflow-hidden">
            {data.slice(0,6).map((c:any,i:number)=>(
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:categoryColor(i+offset) }}/>
                <span className="text-xs text-gray-600 truncate flex-1">{c.icon} {c.name}</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<'week'|'month'|'year'>('month');
  const { data:chart, loading } = useChartData(period);
  const { data:stats } = useStats(period);

  const daily      = chart?.daily      || [];
  const byCategory = chart?.byCategory || [];
  const expenseCats = byCategory.filter((c:any)=>c.type==='expense');
  const incomeCats  = byCategory.filter((c:any)=>c.type==='income');
  const isEmpty = !loading && daily.length === 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tahlil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pul oqimini tushunib oling</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1">
          {(['week','month','year'] as const).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${period===p?'bg-indigo-500 text-white shadow-sm':'text-gray-500 hover:text-gray-800'}`}>
              {p==='week'?'Bu hafta':p==='month'?'Bu oy':'Bu yil'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label:'Kirim', val:stats.income, color:'#16a34a', bg:'#f0fdf4' },
            { label:'Chiqim', val:stats.expenses, color:'#dc2626', bg:'#fef2f2' },
            { label:'Sof foyda', val:stats.net, color:'#4f6ef7', bg:'#eff2ff' },
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <div>
                <div className="text-xs text-gray-400 font-medium">{s.label}</div>
                <div className="text-base font-bold tabular-nums" style={{ color:s.color }}>{formatUZS(s.val)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEmpty ? (
        <EmptyState title="Tahlil uchun ma'lumot yo'q" description="Tranzaksiyalar qo'shilgandan keyin grafiklar ko'rinadi"/>
      ) : (
        <div className="space-y-6">
          {/* Area chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Kirim va chiqim dinamikasi</h2>
            {loading ? <ChartSkeleton height={260}/> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={daily} margin={{ top:5, right:5, bottom:5, left:10 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={d=>d?.slice(8)||d}/>
                  <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={fmt}/>
                  <Tooltip content={<TT/>}/>
                  <Area type="monotone" dataKey="income"  name="income"  stroke="#16a34a" strokeWidth={2} fill="url(#gi)" dot={false}/>
                  <Area type="monotone" dataKey="expense" name="expense" stroke="#dc2626" strokeWidth={2} fill="url(#ge)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie charts */}
          <div className="grid grid-cols-2 gap-6">
            {loading ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"><Skeleton width={160} height={16} className="mb-5"/><ChartSkeleton height={180}/></div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"><Skeleton width={140} height={16} className="mb-5"/><ChartSkeleton height={180}/></div>
              </>
            ) : (
              <>
                <PieSection title="Chiqim kategoriyalari" data={expenseCats} offset={0}/>
                <PieSection title="Kirim kategoriyalari"  data={incomeCats}  offset={5}/>
              </>
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Kunlik taqqoslama</h2>
            {loading ? <ChartSkeleton height={220}/> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={daily} margin={{ top:5, right:5, bottom:5, left:10 }} barSize={14} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={d=>d?.slice(8)||d}/>
                  <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={fmt}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="income"  name="income"  fill="#16a34a" radius={[4,4,0,0]}/>
                  <Bar dataKey="expense" name="expense" fill="#dc2626" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
