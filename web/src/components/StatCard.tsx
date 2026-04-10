import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface Props {
  label: string;
  value: string;
  change?: string | null;
  icon: string;
  variant?: 'default' | 'income' | 'expense' | 'net';
  loading?: boolean;
}

const iconBg = {
  default: 'bg-gray-100 text-gray-600',
  income:  'bg-green-50  text-green-600',
  expense: 'bg-red-50    text-red-600',
  net:     'bg-indigo-50 text-indigo-600',
};

export default function StatCard({ label, value, change, icon, variant = 'default', loading }: Props) {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-') && !change.startsWith('-0');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width={110} height={13} />
          <Skeleton width={36} height={36} rounded="12px" />
        </div>
        <Skeleton width={150} height={26} rounded="8px" className="mb-2" />
        <Skeleton width={90} height={11} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${iconBg[variant]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">{value}</div>
      {change ? (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
          {change} o'tgan davr bilan
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
