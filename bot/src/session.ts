export interface PendingConfirm {
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  note?: string;
  date?: string;
}

export interface SessionData {
  lastTransactionId?: string;
  lastTransactionAmount?: number;
  lastTransactionType?: 'income' | 'expense';
  pendingType?: 'income' | 'expense';
  pendingNote?: string;
  pendingDate?: string;
  waitingForCategory?: boolean;
  waitingForAmount?: boolean;
  waitingForEditField?: boolean;
  waitingForEditValue?: boolean;
  editField?: 'amount' | 'category' | 'note';
  // Pre-save confirmation payload
  pendingConfirm?: PendingConfirm;
  // FIX (BUTTON_DATA_INVALID): Telegram limits callback_data to 64 bytes.
  // Two UUIDs alone = 77 bytes, which exceeds the limit.
  // We store a short-lived lookup map keyed by a 2-digit index here in session.
  // The button sends "cat_<idx>_<txId-first8chars>" (well under 64 bytes),
  // and the callback handler resolves the full categoryId from this map.
  categoryLookup?: Record<string, string>; // index string → full category UUID
  pendingTxId?: string;                    // full transaction UUID for category assignment
}

const sessions = new Map<number, SessionData>();

export function getSession(userId: number): SessionData {
  if (!sessions.has(userId)) sessions.set(userId, {});
  return sessions.get(userId)!;
}

export function setSession(userId: number, data: Partial<SessionData>) {
  sessions.set(userId, { ...getSession(userId), ...data });
}

export function clearPending(userId: number) {
  const s = getSession(userId);
  sessions.set(userId, {
    lastTransactionId: s.lastTransactionId,
    lastTransactionAmount: s.lastTransactionAmount,
    lastTransactionType: s.lastTransactionType,
  });
}