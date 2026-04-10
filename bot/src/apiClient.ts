import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET || 'financebot_internal';

// ── Per-user token store ────────────────────────────────────────────────────
// In production consider Redis; in-memory is fine for single-instance bots.
const userTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Get or refresh a JWT for a specific Telegram user.
 * Returns null if the user has not linked their account yet.
 */
export async function getTokenForUser(telegramId: string): Promise<string | null> {
  const cached = userTokens.get(telegramId);
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  try {
    const res = await axios.post(`${API_URL}/auth/telegram-login`, {
      telegramId,
      botSecret: BOT_INTERNAL_SECRET,
    });
    if (!res.data.found) return null;   // user not linked yet
    const token = res.data.botToken as string;
    // Tokens are 365d — cache for 23h then refresh
    userTokens.set(telegramId, { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 });
    return token;
  } catch {
    return null;
  }
}

/** Save a bot token that was returned from /auth/telegram-link */
export function cacheToken(telegramId: string, token: string) {
  userTokens.set(telegramId, { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 });
}

/** Remove token on unlink */
export function evictToken(telegramId: string) {
  userTokens.delete(telegramId);
}

/** Create an axios instance pre-authorised for this user. Throws if not linked. */
async function api(telegramId: string): Promise<AxiosInstance> {
  const token = await getTokenForUser(telegramId);
  if (!token) throw new Error('NOT_LINKED');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Transaction APIs (all scoped to the calling user) ───────────────────────

export async function createTransaction(telegramId: string, data: {
  amount: number;
  type: 'income' | 'expense';
  categoryId?: string;
  note?: string;
  source?: string;
  telegramMessageId?: number;
  date?: string;          // ISO string — optional, defaults to now on server
}) {
  const client = await api(telegramId);
  const res = await client.post('/transactions', data);
  return res.data;
}

export async function updateTransaction(telegramId: string, id: string, data: {
  amount?: number; categoryId?: string; note?: string; type?: string;
}) {
  const client = await api(telegramId);
  const res = await client.put(`/transactions/${id}`, data);
  return res.data;
}

export async function getStats(telegramId: string, period = 'month') {
  const client = await api(telegramId);
  const res = await client.get(`/transactions/stats?period=${period}`);
  return res.data;
}

export async function getRecentTransactions(telegramId: string, limit = 5) {
  const client = await api(telegramId);
  const res = await client.get('/transactions', { params: { limit } });
  return Array.isArray(res.data) ? res.data.slice(0, limit)
       : Array.isArray(res.data?.data) ? res.data.data.slice(0, limit) : [];
}

export async function getTransactionsByCategory(telegramId: string, categoryName: string, period = 'month') {
  const client = await api(telegramId);
  const cats = await client.get('/categories');
  const cat = cats.data.find((c: any) =>
    c.name.toLowerCase() === categoryName.toLowerCase() ||
    c.name.toLowerCase().includes(categoryName.toLowerCase())
  );
  if (!cat) return null;

  const now = new Date();
  let from: Date;
  if (period === 'week')       { from = new Date(now); from.setDate(now.getDate() - 7); }
  else if (period === 'year')  { from = new Date(now.getFullYear(), 0, 1); }
  else                         { from = new Date(now.getFullYear(), now.getMonth(), 1); }

  const res = await client.get('/transactions', { params: { categoryId: cat.id, from: from.toISOString() } });
  const txs = Array.isArray(res.data) ? res.data
            : Array.isArray(res.data?.data) ? res.data.data : [];
  const total = txs.reduce((s: number, t: any) => s + Number(t.amount), 0);
  return { category: cat, total, count: txs.length, transactions: txs };
}

export async function deleteTransaction(telegramId: string, id: string) {
  const client = await api(telegramId);
  await client.delete(`/transactions/${id}`);
}

export async function getCategories(telegramId: string) {
  const client = await api(telegramId);
  const res = await client.get('/categories');
  return res.data;
}

export async function findCategoryByName(telegramId: string, name: string) {
  const cats = await getCategories(telegramId);
  if (!name) return null;
  const lower = name.toLowerCase();
  return cats.find((c: any) =>
    c.name.toLowerCase() === lower ||
    c.name.toLowerCase().includes(lower) ||
    lower.includes(c.name.toLowerCase())
  ) || null;
}

export async function getBudgetStatus(telegramId: string) {
  const client = await api(telegramId);
  const res = await client.get('/budgets/status');
  return res.data;
}

/** Complete the Telegram → Dashboard link. Called from /link command. */
export async function completeTelegramLink(linkToken: string, telegramId: string): Promise<{
  ok: boolean; username?: string; botToken?: string;
}> {
  try {
    const res = await axios.post(`${API_URL}/auth/telegram-link`, { linkToken, telegramId });
    if (res.data.ok) {
      cacheToken(telegramId, res.data.botToken);
    }
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'error';
    if (msg.includes('muddati') || msg.includes('noto\'g\'ri')) {
      return { ok: false };
    }
    throw e;
  }
}
