export function formatAmount(amount: number): string {
  if (!amount && amount !== 0) return '0 UZS';
  const n = Math.round(Number(amount));
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' mlrd UZS';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' mln UZS';
  if (n >= 1_000) return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
  return n + ' UZS';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatConfirmation(tx: any): string {
  const emoji = tx.type === 'income' ? '✅' : '🔴';
  const typeLabel = tx.type === 'income' ? 'Kirim' : 'Chiqim';
  const cat = tx.category?.name || 'Kategoriyasiz';
  const icon = tx.category?.icon || '📦';
  const note = tx.note ? `\n📝 _${escMd(tx.note)}_` : '';
  const date = formatDate(tx.date || new Date());

  return `${emoji} *Saqlandi!*\n\n` +
    `💵 Miqdor: *${formatAmount(tx.amount)}*\n` +
    `📌 Tur: ${typeLabel}\n` +
    `${icon} Kategoriya: ${cat}\n` +
    `📅 Sana: ${date}` +
    `${note}\n\n` +
    `_Xato bo'lsa:_ /bekor`;
}

export function formatStats(stats: any, period: string): string {
  const label = period === 'week' ? 'bu hafta' : period === 'year' ? 'bu yil' : 'bu oy';
  const netEmoji = (stats.net ?? 0) >= 0 ? '💚' : '🔴';

  const pct = (curr: number, prev: number) => {
    if (!prev || prev === 0) return '';
    const p = ((curr - prev) / prev * 100).toFixed(0);
    return ` (${Number(p) > 0 ? '+' : ''}${p}%)`;
  };

  const income = stats.income ?? 0;
  const expenses = stats.expenses ?? 0;
  const net = stats.net ?? 0;
  const count = stats.transactionCount ?? 0;

  return `📊 *Moliyaviy hisobot — ${label}*\n\n` +
    `✅ Kirim: *${formatAmount(income)}*${pct(income, stats.prevIncome)}\n` +
    `🔴 Chiqim: *${formatAmount(expenses)}*${pct(expenses, stats.prevExpenses)}\n` +
    `${netEmoji} Sof foyda: *${formatAmount(net)}*\n` +
    `📋 Tranzaksiyalar: *${count} ta*\n\n` +
    `_Oldingi davr bilan taqqoslandi_`;
}

export function formatTransaction(tx: any): string {
  const emoji = tx.type === 'income' ? '✅' : '🔴';
  const cat = tx.category?.name || tx.category || '—';
  const icon = tx.category?.icon || '📦';
  const note = tx.note ? ` · _${escMd(tx.note.slice(0, 30))}_` : '';
  return `${emoji} ${icon} ${cat} — *${formatAmount(tx.amount)}*${note}`;
}

export function formatCategoryStats(data: { category: any; total: number; count: number }, period: string): string {
  const label = period === 'week' ? 'bu hafta' : period === 'year' ? 'bu yil' : 'bu oy';
  const emoji = data.category.type === 'income' ? '✅' : '🔴';
  return `${emoji} *${data.category.icon} ${data.category.name}* — ${label}\n\n` +
    `💵 Jami: *${formatAmount(data.total)}*\n` +
    `📋 Tranzaksiyalar: *${data.count} ta*`;
}

export function formatBudgetAlert(item: any): string {
  const pct = item.percentage;
  const emoji = pct >= 100 ? '🚨' : '⚠️';
  return `${emoji} *Byudjet ogohlantirish!*\n\n` +
    `${item.category?.icon || '📦'} *${item.category?.name}*\n` +
    `Sarflandi: *${formatAmount(item.spent)}* / ${formatAmount(item.limitAmount)}\n` +
    `📊 ${pct}% ishlatildi`;
}

// Escape special Markdown chars for Markdown mode (not V2)
function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
