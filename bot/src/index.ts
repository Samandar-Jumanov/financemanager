import 'dotenv/config';
import express from 'express';
import { Bot, webhookCallback, InlineKeyboard } from 'grammy';
import axios from 'axios';
import { transcribeVoice, parseIntent } from './ai';
import {
  createTransaction,
  updateTransaction,
  getStats,
  deleteTransaction,
  findCategoryByName,
  getCategories,
  getRecentTransactions,
  getTransactionsByCategory,
  getBudgetStatus,
  completeTelegramLink,
  getTokenForUser,
  evictToken,
} from './apiClient';
import {
  formatAmount,
  formatConfirmation,
  formatStats,
  formatTransaction,
  formatCategoryStats,
  formatBudgetAlert,
} from './formatter';
import { getSession, setSession, clearPending } from './session';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helper: check user is linked ─────────────────────────────────────────────
async function requireLinked(ctx: any): Promise<boolean> {
  const tid = String(ctx.from!.id);
  const token = await getTokenForUser(tid);
  if (!token) {
    await ctx.reply(
      `⚠️ *Hisob ulanmagan*\n\n` +
      `FinanceBot dashboardingizga ulanish uchun:\n\n` +
      `1️⃣  [Dashboard](${FRONTEND_URL}) ga kiring\n` +
      `2️⃣  Profil sahifasiga o'ting\n` +
      `3️⃣  *"Telegram ulanish"* tugmasini bosing\n` +
      `4️⃣  Ko'rsatilgan tokenni quyidagicha yuboring:\n\n` +
      `\`/link <token>\`\n\n` +
      `_Masalan: /link eyJhbGci..._`,
      { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
    );
    return false;
  }
  return true;
}

// ── /start ───────────────────────────────────────────────────────────────────
bot.command('start', async ctx => {
  const name = ctx.from?.first_name || 'Biznes egasi';
  const tid  = String(ctx.from!.id);
  const token = await getTokenForUser(tid);

  if (token) {
    await ctx.reply(
      `👋 *Xush kelibsiz qaytib, ${name}!*\n\n` +
      `Tranzaksiya yozish uchun shunchaki xabar yuboring:\n` +
      `• \`500 000 kirim savdo\`\n` +
      `• \`80 ming chiqim transport\`\n` +
      `• 🎙 Ovozli xabar\n\n` +
      `/help — to'liq qo'llanma`,
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(
      `👋 *Assalomu alaykum, ${name}!*\n\n` +
      `Men sizning moliya botingizman.\n\n` +
      `Boshlash uchun dashboardingizni ulang:\n\n` +
      `1️⃣  [Dashboard](${FRONTEND_URL}) ga kiring\n` +
      `2️⃣  Profil → *Telegram ulanish*\n` +
      `3️⃣  Token oling va: \`/link <token>\`\n\n` +
      `Allaqachon ulangan bo'lsangiz — shunchaki yozing!`,
      { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
    );
  }
});

// ── /link <token> ─────────────────────────────────────────────────────────────
bot.command('link', async ctx => {
  const parts = ctx.message?.text?.split(' ');
  const token = parts?.[1]?.trim();
  const tid   = String(ctx.from!.id);

  if (!token) {
    await ctx.reply(
      `🔗 *Hisob ulash*\n\n` +
      `Dashboard → Profil sahifasidan token oling va:\n\n` +
      `\`/link <token>\`\n\n` +
      `_Masalan: /link eyJhbGci..._`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const statusMsg = await ctx.reply('🔄 Tekshirilmoqda...');
  try {
    const result = await completeTelegramLink(token, tid);
    await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
    if (result.ok) {
      await ctx.reply(
        `✅ *Hisob muvaffaqiyatli ulandi!*\n\n` +
        `Xush kelibsiz, *${result.username}*!\n\n` +
        `Endi tranzaksiyalarni yozishingiz mumkin:\n` +
        `• \`500 000 kirim savdo\`\n` +
        `• \`80 ming chiqim transport\`\n` +
        `• 🎙 Ovozli xabar\n\n` +
        `/help — to'liq qo'llanma`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *Token noto'g'ri yoki muddati o'tgan*\n\n` +
        `Dashboard → Profil sahifasidan yangi token oling.\n` +
        `_(Token 15 daqiqa amal qiladi)_`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
    await ctx.reply('❌ Xatolik yuz berdi. Qaytadan urining.');
  }
});

// ── /unlink ─────────────────────────────────────────────────────────────────
// FIX (Bug 3): Moved BEFORE bot.catch() so the handler is guaranteed to be
// registered in grammy's middleware chain before the error boundary.
// Also: confirm_unlink now evicts the token locally even if the API call fails,
// so the user always gets a success message instead of silence.
bot.command('unlink', async ctx => {
  const tid = String(ctx.from!.id);
  const token = await getTokenForUser(tid);
  if (!token) {
    await ctx.reply(
      `⚠️ *Hisob hali ulanmagan.*\n\n/link buyrug'i bilan ulang.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  const keyboard = new InlineKeyboard()
    .text("✅ Ha, ajrat", 'confirm_unlink')
    .text("❌ Yo'q", 'cancel_unlink');
  await ctx.reply(
    "🔗 *Telegramni dashboarddan ajratmoqchimisiz?*\n\nAjratilgandan so'ng tranzaksiyalar saqlanmaydi.",
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

bot.callbackQuery('confirm_unlink', async ctx => {
  await ctx.answerCallbackQuery();
  const tid = String(ctx.from!.id);
  const token = await getTokenForUser(tid);
  if (!token) {
    await ctx.editMessageText(
      "⚠️ *Hisob allaqachon ajratilgan.*\n\nQayta ulash uchun: /link",
      { parse_mode: 'Markdown' }
    );
    return;
  }
  try {
    await axios.post(
      `${process.env.API_URL || 'http://localhost:3001/api'}/auth/telegram-unlink`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    );
  } catch (e: any) {
    // API call failed — log it but still evict locally so the user is unlinked in the bot.
    console.error('Unlink API error (non-fatal):', e?.message);
  }
  // Always evict the local token, regardless of API result
  evictToken(tid);
  await ctx.editMessageText(
    "✅ *Hisob ajratildi.*\n\nDashboard bilan aloqa uzildi.\nQayta ulash uchun: /link",
    { parse_mode: 'Markdown' }
  );
});

bot.callbackQuery('cancel_unlink', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('Bekor qilindi. Hisob hali ham ulangan ✅');
});

// ── /help ─────────────────────────────────────────────────────────────────────
bot.command('help', async ctx => {
  await ctx.reply(
    `📖 *Qo'llanma*\n\n` +
    `*Kirim yozish:*\n` +
    `\`500000 kirim savdo\`\n` +
    `\`2 mln tushum xizmat\`\n\n` +
    `*Chiqim yozish:*\n` +
    `\`80000 chiqim transport\`\n` +
    `\`1.5 mln maosh to'landi\`\n\n` +
    `*Savol berish:*\n` +
    `\`Bu oy qancha kirim bo'ldi?\`\n` +
    `\`Logistikaga necha sarf qildik?\`\n\n` +
    `*Buyruqlar:*\n` +
    `/hisobot — moliyaviy hisobot\n` +
    `/songi — oxirgi tranzaksiyalar\n` +
    `/byudjet — byudjet holati\n` +
    `/edit — oxirgi yozuvni tahrirlash\n` +
    `/bekor — oxirgi yozuvni o'chirish\n` +
    `/kategoriyalar — kategoriyalar\n` +
    `/unlink — hisobni ajratish\n` +
    `/link — dashboardga ulash`,
    { parse_mode: 'Markdown' }
  );
});

// ── /hisobot ─────────────────────────────────────────────────────────────────
bot.command('hisobot', async ctx => {
  if (!await requireLinked(ctx)) return;
  const keyboard = new InlineKeyboard()
    .text('📅 Bu oy', 'stats_month').text('📆 Bu hafta', 'stats_week').row()
    .text('🗓 Bu yil', 'stats_year').text("📋 So'nggi 5 ta", 'recent_txns');
  await ctx.reply('Qaysi hisobot kerak?', { reply_markup: keyboard });
});

bot.callbackQuery(/^stats_(month|week|year)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  const period = ctx.match[1] as 'month' | 'week' | 'year';
  try {
    const stats = await getStats(tid, period);
    await ctx.editMessageText(formatStats(stats, period), { parse_mode: 'Markdown' });
  } catch { await ctx.editMessageText("❌ Server bilan bog'lanib bo'lmadi."); }
});

bot.callbackQuery('recent_txns', async ctx => {
  await ctx.answerCallbackQuery();
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  try {
    const txns = await getRecentTransactions(tid, 5);
    if (!txns.length) { await ctx.editMessageText("Hali tranzaksiyalar yo'q."); return; }
    const lines = txns.map(formatTransaction).join('\n');
    await ctx.editMessageText(`📋 *So'nggi ${txns.length} ta:*\n\n${lines}`, { parse_mode: 'Markdown' });
  } catch { await ctx.editMessageText('❌ Xatolik yuz berdi.'); }
});

// ── /songi ───────────────────────────────────────────────────────────────────
bot.command('songi', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  try {
    const txns = await getRecentTransactions(tid, 10);
    if (!txns.length) {
      await ctx.reply("Hali tranzaksiyalar yo'q.\n\nBirinchi tranzaksiyani yozing: `500000 kirim savdo`", { parse_mode: 'Markdown' });
      return;
    }
    const lines = txns.map((tx: any, i: number) => `${i + 1}. ${formatTransaction(tx)}`).join('\n');
    await ctx.reply(`📋 *Oxirgi ${txns.length} ta:*\n\n${lines}`, { parse_mode: 'Markdown' });
  } catch { await ctx.reply('❌ Xatolik yuz berdi.'); }
});

// ── /byudjet ─────────────────────────────────────────────────────────────────
bot.command('byudjet', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  try {
    const items = await getBudgetStatus(tid);
    if (!items.length) {
      await ctx.reply('📋 Byudjet limitlari belgilanmagan.\n\nDashboard → Byudjet sahifasidan limitlarni belgilang.', { parse_mode: 'Markdown' });
      return;
    }
    const lines = items.map((item: any) => {
      const bar = buildBar(item.percentage);
      const st = item.status === 'exceeded' ? '🚨' : item.status === 'warning' ? '⚠️' : '✅';
      return `${st} *${item.category?.icon} ${item.category?.name}*\n${bar} ${item.percentage}%\n${formatAmount(item.spent)} / ${formatAmount(item.limitAmount)}`;
    }).join('\n\n');
    await ctx.reply(`🎯 *Byudjet holati — bu oy:*\n\n${lines}`, { parse_mode: 'Markdown' });
  } catch { await ctx.reply('❌ Xatolik yuz berdi.'); }
});

function buildBar(pct: number): string {
  const filled = Math.round(Math.min(pct, 100) / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

// ── /edit ─────────────────────────────────────────────────────────────────────
bot.command('edit', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  const session = getSession(ctx.from!.id);
  if (!session.lastTransactionId) {
    await ctx.reply("⚠️ Tahrirlash uchun tranzaksiya topilmadi.\nAvval biror tranzaksiya qo'shing.");
    return;
  }
  const keyboard = new InlineKeyboard()
    .text('💵 Miqdor', 'edit_field_amount').text('📂 Kategoriya', 'edit_field_category').row()
    .text('📝 Izoh', 'edit_field_note').text('❌ Bekor', 'edit_cancel');
  await ctx.reply(`✏️ *Oxirgi tranzaksiyani tahrirlash*\n\nQaysi maydonni o'zgartirmoqchisiz?`, { parse_mode: 'Markdown', reply_markup: keyboard });
});

bot.callbackQuery(/^edit_field_(amount|category|note)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const field = ctx.match[1] as 'amount' | 'category' | 'note';
  setSession(ctx.from!.id, { waitingForEditValue: true, editField: field });
  const prompts = { amount: '💵 Yangi miqdorni yozing (masalan: 750000):', category: '📂 Yangi kategoriyani yozing:', note: '📝 Yangi izohni yozing:' };
  await ctx.editMessageText(prompts[field]);
});

bot.callbackQuery('edit_cancel', async ctx => {
  await ctx.answerCallbackQuery();
  clearPending(ctx.from!.id);
  await ctx.editMessageText('Bekor qilindi.');
});

// ── /bekor ────────────────────────────────────────────────────────────────────
bot.command('bekor', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  const session = getSession(ctx.from!.id);
  if (!session.lastTransactionId) { await ctx.reply("⚠️ O'chirish uchun tranzaksiya topilmadi."); return; }
  const keyboard = new InlineKeyboard()
    .text("✅ Ha, o'chir", `confirm_del_${session.lastTransactionId}`)
    .text("❌ Yo'q", 'cancel_del');
  await ctx.reply("Oxirgi tranzaksiyani o'chirishni tasdiqlaysizmi?", { reply_markup: keyboard });
});

bot.callbackQuery(/^confirm_del_(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const tid = String(ctx.from!.id);
  try {
    await deleteTransaction(tid, ctx.match[1]);
    setSession(ctx.from!.id, { lastTransactionId: undefined });
    await ctx.editMessageText("✅ Tranzaksiya o'chirildi.");
  } catch { await ctx.editMessageText("❌ O'chirishda xatolik yuz berdi."); }
});

bot.callbackQuery('cancel_del', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('Bekor qilindi.');
});

// ── /kategoriyalar ────────────────────────────────────────────────────────────
bot.command('kategoriyalar', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;
  try {
    const cats = await getCategories(tid);
    const income  = cats.filter((c: any) => c.type === 'income'  || c.type === 'both');
    const expense = cats.filter((c: any) => c.type === 'expense' || c.type === 'both');
    await ctx.reply(
      `📂 *Kategoriyalar*\n\n` +
      `*✅ Kirim (${income.length} ta):*\n${income.map((c: any) => `${c.icon} ${c.name}`).join('\n')}\n\n` +
      `*🔴 Chiqim (${expense.length} ta):*\n${expense.map((c: any) => `${c.icon} ${c.name}`).join('\n')}`,
      { parse_mode: 'Markdown' }
    );
  } catch { await ctx.reply('❌ Xatolik yuz berdi.'); }
});

// ── Voice messages ────────────────────────────────────────────────────────────
// FIX (Bug 1): Voice messages now correctly flow into handleText() which triggers
// the pre-save confirmation (Bug 2 fix) and category selection keyboard.
// Previously the status message was deleted BEFORE handleText ran, causing ctx
// to lose reliable chat context in some grammy versions. Now we delete AFTER
// the transcript is shown, and handleText always runs with the correct ctx.
bot.on('message:voice', async ctx => {
  const tid = String(ctx.from!.id);
  if (!await requireLinked(ctx)) return;

  const statusMsg = await ctx.reply('🎙 _Ovoz tahlil qilinmoqda..._', { parse_mode: 'Markdown' });
  try {
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const audioRes = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 20000 });
    const transcript = await transcribeVoice(Buffer.from(audioRes.data), 'voice.ogg');

    // Show transcript so user can see what was understood, then remove the status bubble
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `🎙 _"${transcript}"_`,
      { parse_mode: 'Markdown' }
    );
    // Small pause so the transcript is readable before it's replaced by the confirmation
    await new Promise(r => setTimeout(r, 700));
    await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

    // Process through the normal flow: intent detection → confirm → save → category
    await handleText(ctx, transcript);
  } catch (e: any) {
    console.error('Voice error:', e?.message);
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      "❌ Ovozni tanib bo'lmadi. Matn yozing."
    ).catch(() => ctx.reply("❌ Ovozni tanib bo'lmadi. Matn yozing."));
  }
});

// ── Text messages ─────────────────────────────────────────────────────────────
bot.on('message:text', async ctx => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;

  const tid = String(ctx.from!.id);
  const session = getSession(ctx.from!.id);

  if (session.waitingForEditValue && session.editField) {
    if (!await requireLinked(ctx)) return;
    await handleEditValue(ctx, text);
    return;
  }

  if (session.waitingForAmount) {
    if (!await requireLinked(ctx)) return;
    const amount = parseFloat(text.replace(/[\s,]/g, ''));
    if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ Noto\'g\'ri miqdor. Raqam kiriting:'); return; }
    const { pendingType, pendingNote } = session;
    clearPending(ctx.from!.id);
    // After correcting the amount, go back to confirm flow
    await askConfirmBeforeSave(ctx, { amount, type: pendingType!, note: pendingNote });
    return;
  }

  if (!await requireLinked(ctx)) return;
  await handleText(ctx, text);
});

// ── Pre-save confirmation flow ────────────────────────────────────────────────
// FIX (Bug 2): Before saving any transaction, show a summary and require the
// user to tap "Confirm". Pending data is stored in session, not in callback data,
// so it works for any message length / category name.

async function askConfirmBeforeSave(
  ctx: any,
  data: { amount: number; type: 'income' | 'expense'; category?: string; note?: string; date?: string }
) {
  const typeEmoji = data.type === 'income' ? '✅' : '🔴';
  const typeLabel = data.type === 'income' ? 'Kirim' : 'Chiqim';
  const catLabel  = data.category || '— (keyinchalik tanlanadi)';

  setSession(ctx.from!.id, {
    pendingConfirm: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      note: data.note,
      date: data.date,
    },
  } as any);

  const keyboard = new InlineKeyboard()
    .text("✅ To'g'ri, saqlash", 'presave_confirm')
    .text('✏️ Miqdor xato', 'presave_edit_amount').row()
    .text('❌ Bekor', 'presave_cancel');

  await ctx.reply(
    `${typeEmoji} *Tasdiqlang:*\n\n` +
    `💵 Miqdor: *${formatAmount(data.amount)}*\n` +
    `📌 Tur: ${typeLabel}\n` +
    `📂 Kategoriya: ${catLabel}` +
    (data.note ? `\n📝 Izoh: _${data.note}_` : '') +
    `\n\nTo'g'rimi?`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
}

bot.callbackQuery('presave_confirm', async ctx => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from!.id);

  if (!session.pendingConfirm) {
    await ctx.editMessageText("⚠️ Tasdiqlash ma'lumoti topilmadi. Qaytadan yuboring.");
    return;
  }

  const { amount, type, category, note, date } = session.pendingConfirm;
  // Clear BEFORE saving to prevent double-tap double-save
  setSession(ctx.from!.id, { pendingConfirm: undefined } as any);

  await ctx.deleteMessage().catch(() => {});
  await saveTransaction(ctx, { amount, type, category, note, date });
});

bot.callbackQuery('presave_cancel', async ctx => {
  await ctx.answerCallbackQuery();
  setSession(ctx.from!.id, { pendingConfirm: undefined } as any);
  clearPending(ctx.from!.id);
  await ctx.editMessageText('❌ Bekor qilindi.');
});

bot.callbackQuery('presave_edit_amount', async ctx => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from!.id);
  if (!session.pendingConfirm) { await ctx.editMessageText("⚠️ Ma'lumot topilmadi."); return; }
  // Keep pendingConfirm but set waitingForAmount so the text handler picks it up
  setSession(ctx.from!.id, {
    waitingForAmount: true,
    pendingType: session.pendingConfirm.type,
    pendingNote: session.pendingConfirm.note,
    // Keep pendingConfirm so we can carry forward category/date after correction
  } as any);
  await ctx.editMessageText("💵 To'g'ri miqdorni kiriting (masalan: 500000 yoki 1.5 mln):");
});

// ── Category selection callback ───────────────────────────────────────────────
// FIX (BUTTON_DATA_INVALID): Telegram limits callback_data to 64 bytes.
// Two full UUIDs ("cat_<uuid>_<uuid>") = ~77 bytes — over the limit.
// Instead we store a short index→UUID lookup map in the session and use
// "cat_<2-digit-index>" as the callback data (~6 bytes).
bot.callbackQuery(/^cat_(\d+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const tid = String(ctx.from!.id);
  const idx = ctx.match[1];
  const session = getSession(ctx.from!.id);

  const categoryId = session.categoryLookup?.[idx];
  const txId = session.pendingTxId;

  if (!categoryId || !txId) {
    await ctx.reply('⚠️ Kategoriya ma\'lumoti topilmadi. Qaytadan urining.');
    return;
  }

  try {
    const tx = await updateTransaction(tid, txId, { categoryId });
    setSession(ctx.from!.id, { lastTransactionId: txId, categoryLookup: undefined, pendingTxId: undefined });
    clearPending(ctx.from!.id);
    await ctx.editMessageText(formatConfirmation(tx), { parse_mode: 'Markdown' });
    await checkBudgetAlerts(ctx, tid, tx);
  } catch { await ctx.reply('❌ Xatolik yuz berdi.'); }
});

// ── Core text processing ──────────────────────────────────────────────────────
async function handleText(ctx: any, text: string) {
  const tid = String(ctx.from!.id);
  let intent;
  try { intent = await parseIntent(text); }
  catch { intent = { intent: 'unknown' as const }; }

  if (intent.intent === 'query_category' && intent.category) {
    try {
      const lower = text.toLowerCase();
      const period = lower.includes('hafta') ? 'week' : lower.includes('yil') ? 'year' : 'month';
      const result = await getTransactionsByCategory(tid, intent.category, period);
      if (!result) await ctx.reply(`❓ "${intent.category}" kategoriyasi topilmadi.\n/kategoriyalar — barcha kategoriyalar`);
      else await ctx.reply(formatCategoryStats(result, period), { parse_mode: 'Markdown' });
    } catch { await ctx.reply("❌ Ma'lumot olishda xatolik."); }
    return;
  }

  if (intent.intent === 'query') {
    try {
      const lower = text.toLowerCase();
      const period = lower.includes('hafta') ? 'week' : lower.includes('yil') ? 'year' : 'month';
      const stats = await getStats(tid, period);
      await ctx.reply(formatStats(stats, period), { parse_mode: 'Markdown' });
    } catch { await ctx.reply('❌ Hisobot olishda xatolik.'); }
    return;
  }

  if (intent.intent === 'delete_last') {
    const session = getSession(ctx.from!.id);
    if (session.lastTransactionId) {
      const keyboard = new InlineKeyboard()
        .text("✅ Ha, o'chir", `confirm_del_${session.lastTransactionId}`)
        .text("❌ Yo'q", 'cancel_del');
      await ctx.reply("Oxirgi tranzaksiyani o'chirishni tasdiqlaysizmi?", { reply_markup: keyboard });
    } else {
      await ctx.reply("⚠️ O'chirish uchun tranzaksiya topilmadi.");
    }
    return;
  }

  if (intent.intent === 'edit_last') {
    const session = getSession(ctx.from!.id);
    if (!session.lastTransactionId) { await ctx.reply('⚠️ Tahrirlash uchun tranzaksiya topilmadi.'); return; }
    const keyboard = new InlineKeyboard()
      .text('💵 Miqdor', 'edit_field_amount').text('📂 Kategoriya', 'edit_field_category').row()
      .text('📝 Izoh', 'edit_field_note').text('❌ Bekor', 'edit_cancel');
    await ctx.reply("✏️ Qaysi maydonni o'zgartirmoqchisiz?", { reply_markup: keyboard });
    return;
  }

  if (intent.intent === 'unknown') {
    if (intent.amount && intent.amount > 0) {
      setSession(ctx.from!.id, { pendingNote: text, ...(intent as any).date ? { pendingDate: (intent as any).date } : {} } as any);
      const keyboard = new InlineKeyboard()
        .text('✅ Kirim', `ambig_income_${intent.amount}`)
        .text('🔴 Chiqim', `ambig_expense_${intent.amount}`);
      await ctx.reply(`💰 *${formatAmount(intent.amount)}* — kirim yoki chiqimmi?`, { parse_mode: 'Markdown', reply_markup: keyboard });
    } else {
      await ctx.reply(
        "🤔 Tushunmadim. Masalan:\n\n`500000 kirim savdo`\n`80000 chiqim transport`\n`Bu oy qancha kirim bo'ldi?`\n\n/help",
        { parse_mode: 'Markdown' }
      );
    }
    return;
  }

  if (intent.intent === 'log_income' || intent.intent === 'log_expense') {
    if (!intent.amount || intent.amount <= 0) {
      const type = intent.intent === 'log_income' ? 'income' : 'expense';
      setSession(ctx.from!.id, { pendingType: type, pendingNote: text, waitingForAmount: true });
      await ctx.reply('💰 Miqdorni kiriting (masalan: `500000` yoki `1.5 mln`):', { parse_mode: 'Markdown' });
      return;
    }
    const type = intent.intent === 'log_income' ? 'income' : 'expense';
    // FIX (Bug 2): Show confirmation before saving — for BOTH text and voice
    await askConfirmBeforeSave(ctx, {
      amount: intent.amount,
      type,
      category: intent.category ?? undefined,
      note: intent.note !== text ? (intent.note ?? undefined) : undefined,
      date: (intent as any).date ?? undefined,
    });
  }
}

// ── Ambiguous callbacks ───────────────────────────────────────────────────────
bot.callbackQuery(/^ambig_(income|expense)_(\d+\.?\d*)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const type   = ctx.match[1] as 'income' | 'expense';
  const amount = parseFloat(ctx.match[2]);
  const session = getSession(ctx.from!.id);
  const note   = session.pendingNote;
  const date   = (session as any).pendingDate;
  clearPending(ctx.from!.id);
  await ctx.deleteMessage().catch(() => {});
  // FIX (Bug 2): Also show confirmation for ambiguous transactions
  await askConfirmBeforeSave(ctx, { amount, type, note, date });
});

// ── Save transaction (only called after user confirms) ───────────────────────
async function saveTransaction(ctx: any, data: { amount: number; type: 'income' | 'expense'; category?: string | null; note?: string; date?: string | null }) {
  const tid = String(ctx.from!.id);

  let tx: any;
  let categoryId: string | undefined;
  try {
    if (data.category) {
      const cat = await findCategoryByName(tid, data.category);
      if (cat) categoryId = cat.id;
    }

    tx = await createTransaction(tid, {
      amount: data.amount,
      type: data.type,
      categoryId,
      note: data.note,
      source: 'bot',
      date: data.date ? new Date(data.date).toISOString() : undefined,
      telegramMessageId: ctx.message?.message_id,
    });

    setSession(ctx.from!.id, { lastTransactionId: tx.id, lastTransactionAmount: data.amount, lastTransactionType: data.type });
    clearPending(ctx.from!.id);
  } catch (e: any) {
    console.error('createTransaction failed:', e?.response?.data || e?.message);
    await ctx.reply('❌ Saqlashda xatolik yuz berdi. Qaytadan urining.');
    return;
  }

  // FIX (Bug 1): Always show category selection keyboard when no category is known,
  // even for voice messages. Previously the category keyboard was only shown for
  // text — voice shared the same code path but the ctx.reply() call sometimes
  // failed silently due to the deleted status message context. Now saveTransaction
  // is always called after the status message is fully deleted, so ctx.reply()
  // reliably sends a new message.
  try {
    if (!categoryId) {
      const cats = await getCategories(tid);
      const filtered = cats.filter((c: any) => c.type === data.type || c.type === 'both').slice(0, 8);

      // FIX (BUTTON_DATA_INVALID): Build a session lookup map so callback data
      // only contains a short numeric index instead of two full UUIDs.
      // "cat_0" through "cat_7" = 5-6 bytes each — well within Telegram's 64-byte limit.
      const lookup: Record<string, string> = {};
      filtered.forEach((c: any, i: number) => { lookup[String(i)] = c.id; });
      setSession(ctx.from!.id, { categoryLookup: lookup, pendingTxId: tx.id } as any);

      const keyboard = new InlineKeyboard();
      filtered.forEach((c: any, i: number) => {
        keyboard.text(`${c.icon} ${c.name}`, `cat_${i}`);
        if ((i + 1) % 2 === 0) keyboard.row();
      });
      await ctx.reply(
        `✅ *${formatAmount(data.amount)}* (${data.type === 'income' ? 'Kirim' : 'Chiqim'}) saqlandi!\n\n📂 Kategoriyani tanlang:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    } else {
      await ctx.reply(formatConfirmation(tx), { parse_mode: 'Markdown' });
      await checkBudgetAlerts(ctx, tid, tx);
    }
  } catch (e: any) {
    console.error('Post-save UI error (non-fatal):', e?.message);
    const typeLabel = data.type === 'income' ? 'Kirim ✅' : 'Chiqim 🔴';
    await ctx.reply(
      `✅ *${formatAmount(data.amount)}* (${typeLabel}) saqlandi!\n\n_Kategoriya tanlash uchun /kategoriyalar_`,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
  }
}

async function checkBudgetAlerts(ctx: any, tid: string, tx: any) {
  if (tx.type !== 'expense' || !tx.categoryId) return;
  try {
    const budgets = await getBudgetStatus(tid);
    const alert = budgets.find((b: any) => b.category?.id === tx.categoryId && (b.status === 'warning' || b.status === 'exceeded'));
    if (alert) setTimeout(async () => { await ctx.reply(formatBudgetAlert(alert), { parse_mode: 'Markdown' }); }, 1000);
  } catch {}
}

async function handleEditValue(ctx: any, text: string) {
  const tid = String(ctx.from!.id);
  const session = getSession(ctx.from!.id);
  const { lastTransactionId, editField } = session;
  if (!lastTransactionId || !editField) { clearPending(ctx.from!.id); return; }
  try {
    let updateData: any = {};
    if (editField === 'amount') {
      const amount = parseFloat(text.replace(/[\s,]/g, ''));
      if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ Noto\'g\'ri miqdor. Qaytadan kiriting:'); return; }
      updateData.amount = amount;
    } else if (editField === 'category') {
      const cat = await findCategoryByName(tid, text);
      if (!cat) { await ctx.reply(`❓ "${text}" kategoriyasi topilmadi.\n/kategoriyalar`); return; }
      updateData.categoryId = cat.id;
    } else if (editField === 'note') {
      updateData.note = text;
    }
    const updated = await updateTransaction(tid, lastTransactionId, updateData);
    clearPending(ctx.from!.id);
    await ctx.reply(`✅ *Yangilandi!*\n\n${formatConfirmation(updated)}`, { parse_mode: 'Markdown' });
  } catch (e: any) {
    console.error('Edit error:', e?.message);
    await ctx.reply('❌ Yangilashda xatolik.');
    clearPending(ctx.from!.id);
  }
}

// ── Error handler (must be last middleware registration) ─────────────────────
bot.catch(err => { console.error('Bot unhandled error:', err.message || err); });

// ── Startup ───────────────────────────────────────────────────────────────────
const WEBHOOK_URL = process.env.BOT_WEBHOOK_URL;
const PORT = parseInt(process.env.PORT || '3002', 10);
const EVICT_SECRET = process.env.BOT_INTERNAL_SECRET || 'financebot_internal';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/',       (_req, res) => res.json({ status: 'ok' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/evict-token', (req, res) => {
    const { telegramId, secret } = req.body || {};
    if (secret !== EVICT_SECRET) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (telegramId) evictToken(String(telegramId));
    res.json({ ok: true });
  });

  return app;
}

async function main() {
  if (WEBHOOK_URL) {
    const app = buildApp();
    app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, webhookCallback(bot, 'express'));
    app.listen(PORT, async () => {
      const url = `${WEBHOOK_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
      await bot.api.setWebhook(url);
      console.log(`✅ Bot WEBHOOK mode — port ${PORT}, url: ${url}`);
    });
  } else {
    const app = buildApp();
    app.listen(PORT, () => console.log(`✅ Bot HTTP server — port ${PORT} (polling mode)`));
    await bot.api.deleteWebhook();
    bot.start();
    console.log('✅ Bot LONG POLLING mode (dev)');
  }
}

main().catch(err => { console.error('Startup error:', err); process.exit(1); });