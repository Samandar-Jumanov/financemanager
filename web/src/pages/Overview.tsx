import { useState } from 'react';
import { useStats, useTransactions, useCategories, useRealtime } from '../hooks';
import StatCard from '../components/StatCard';
import QuickAdd from '../components/QuickAdd';
import EmptyState from '../components/EmptyState';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';
import { formatUZS, formatDate, pctChange } from '../utils';
import { RefreshCw, Clock, Bot } from 'lucide-react';

const PERIOD_LABELS = {
  week:  'Oxirgi 7 kun',
  month: new Date().toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }),
  year:  `${new Date().getFullYear()} yil`,
};

export default function Overview() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useStats(period);
  const { data: txns, loading: txnsLoading, refetch: refetchTxns } = useTransactions({});
  const { data: categories } = useCategories();

  const refresh = () => { refetchStats(); refetchTxns(); };
  useRealtime(refresh); // live updates from bot
  const recent = txns.slice(0, 6);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asosiy sahifa</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {PERIOD_LABELS[period]} — joriy holat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>
                {{ week: 'Hafta', month: 'Oy', year: 'Yil' }[p]}
              </button>
            ))}
          </div>
          <button onClick={refresh}
            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw size={15} className={statsLoading ? 'animate-spin' : ''} />
          </button>
          <QuickAdd onCreated={refresh} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard label="Umumiy kirim" value={formatUZS(stats?.income ?? 0)}
          change={stats ? pctChange(stats.income, stats.prevIncome) : null}
          icon="✅" variant="income" loading={statsLoading} />
        <StatCard label="Umumiy chiqim" value={formatUZS(stats?.expenses ?? 0)}
          change={stats ? pctChange(stats.expenses, stats.prevExpenses) : null}
          icon="🔴" variant="expense" loading={statsLoading} />
        <StatCard label="Sof foyda" value={formatUZS(stats?.net ?? 0)}
          change={stats ? pctChange(stats.net, stats.prevNet) : null}
          icon="💰" variant="net" loading={statsLoading} />
      </div>

      {/* Main grid */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
              <Clock size={15} className="text-gray-400" /> So'nggi tranzaksiyalar
            </span>
            <a href="/transactions" className="text-xs text-indigo-500 font-medium hover:underline">
              Hammasini ko'rish →
            </a>
          </div>

          {txnsLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
              </tbody>
            </table>
          ) : recent.length === 0 ? (
            <EmptyState title="Tranzaksiyalar yo'q" description="Birinchi tranzaksiyangizni qo'shing" />
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {tx.category?.icon || tx.categoryIcon || (tx.type === 'income' ? '✅' : '🔴')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {tx.category?.name || tx.category || 'Kategoriyasiz'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {tx.note ? tx.note.slice(0, 36) : formatDate(tx.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${tx.source === 'bot' ? 'bg-purple-50 text-purple-500' : 'bg-gray-100 text-gray-400'}`}>
                      {tx.source === 'bot' ? '🤖' : '🌐'}
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          {/* Summary dark card */}
          <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#1a1d28 0%,#1e2135 100%)' }}>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
              {{ week: 'Bu hafta', month: 'Bu oy', year: 'Bu yil' }[period]}
            </div>
            {statsLoading ? (
              <>
                <Skeleton width={160} height={32} rounded="8px" className="mb-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <Skeleton width={80} height={12} className="mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="flex gap-2">
                  <Skeleton width="100%" height={56} rounded="12px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <Skeleton width="100%" height={56} rounded="12px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold tabular-nums mb-1">{formatUZS(stats?.net ?? 0)}</div>
                <div className="text-xs text-gray-400 mb-4">Sof foyda</div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: 'rgba(22,163,74,0.15)' }}>
                    <div className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>KIRIM</div>
                    <div className="text-sm font-bold text-white">{((stats?.income ?? 0) / 1_000_000).toFixed(1)}M</div>
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: 'rgba(220,38,38,0.15)' }}>
                    <div className="text-xs font-bold mb-1" style={{ color: '#f87171' }}>CHIQIM</div>
                    <div className="text-sm font-bold text-white">{((stats?.expenses ?? 0) / 1_000_000).toFixed(1)}M</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick add */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Tez qo'shish</div>
            <QuickAdd onCreated={refresh} />
          </div>

          {/* Bot shortcut */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4">
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Bot size={17} className="text-indigo-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-1">Telegram Bot</div>
                <div className="text-xs text-gray-500 leading-relaxed">Ovozli xabar orqali tranzaksiya qo'shing</div>
              </div>
            </div>
            <a href="https://t.me/your_bot_username" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center w-full mt-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
              Botni ochish →
            </a>
          </div>

          {/* Transaction count */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              {{ week: 'Bu hafta', month: 'Bu oy', year: 'Bu yil' }[period]} tranzaksiyalar
            </div>
            {statsLoading ? (
              <Skeleton width={60} height={40} rounded="8px" className="mb-1" />
            ) : (
              <div className="text-4xl font-bold text-gray-900 tabular-nums">
                {stats?.transactionCount ?? 0}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">ta yozuv</div>
          </div>
        </div>
      </div>
    </div>
  );
}
