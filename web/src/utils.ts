export function formatUZS(amount: number): string {
  if (amount === undefined || amount === null) return '0 UZS';
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' UZS';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function pctChange(current: number, prev: number): string | null {
  if (!prev) return null;
  const pct = ((current - prev) / prev * 100).toFixed(1);
  return `${Number(pct) > 0 ? '+' : ''}${pct}%`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

const COLORS = [
  '#4f6ef7','#16a34a','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#f97316','#64748b',
];
export function categoryColor(index: number): string {
  return COLORS[index % COLORS.length];
}
