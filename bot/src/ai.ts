import axios from 'axios';
import FormData from 'form-data';

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

export interface ParsedIntent {
  intent: 'log_income' | 'log_expense' | 'query' | 'query_category' | 'delete_last' | 'edit_last' | 'unknown';
  amount?: number;
  category?: string;
  note?: string;
  query?: string;
  date?: string | null;
  editField?: 'amount' | 'category' | 'note';
  editValue?: string;
}

export async function transcribeVoice(audioBuffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append('file', audioBuffer, { filename, contentType: 'audio/ogg' });
  form.append('model', 'whisper-large-v3');
  form.append('language', 'uz');
  form.append('response_format', 'text');

  const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${GROQ_API_KEY}` },
    timeout: 30000,
    // Force axios NOT to parse the response as JSON — Groq returns plain text for
    // response_format=text but sometimes sends Content-Type: application/json which
    // causes axios to auto-parse it into an object, breaking .trim().
    transformResponse: [(data) => data],
  });

  // FIX: Groq may return either a plain string or a JSON object { text: "..." }.
  // Handle both cases robustly.
  const raw = res.data;
  if (typeof raw === 'string') {
    // Try to parse as JSON first (in case axios still parsed it despite transformResponse)
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.text === 'string') return parsed.text.trim();
    } catch { /* not JSON — treat as plain text */ }
    return raw.trim();
  }
  if (raw && typeof raw === 'object') {
    if (typeof raw.text === 'string') return raw.text.trim();
  }
  throw new Error(`Unexpected transcription response: ${JSON.stringify(raw)}`);
}

export async function parseIntent(text: string): Promise<ParsedIntent> {
  const systemPrompt = `Sen O'zbek biznes moliya botining AI yordamchisisisan. Foydalanuvchi xabarini tahlil qilib, qat'iy JSON qaytarasan.\n\nKATEGORIYALAR:\nKirim: Savdo, Xizmat, Investitsiya, Qarz olindi, Boshqa kirim\nChiqim: Oziq-ovqat, Transport, Logistika, Ijara, Maosh, Marketing, Kommunal, Soliq, Boshqa chiqim\n\nINTENT QOIDALARI:\n- "log_income": kirim/daromad/tushum/olingan/received/income/sotildi\n- "log_expense": chiqim/xarajat/sarflandi/to'landi/expense/paid/berildi/ketdi\n- "query": hisobot/necha/qancha/ko'rsat/ko'rsatsin - umumiy savol\n- "query_category": ma'lum kategoriya bo'yicha savol (masalan: "logistikaga necha sarf qildik", "savdo kirim bu oy")\n- "delete_last": o'chir/bekor/delete/undo\n- "edit_last": o'zgartir/tahrir/edit/xato/noto'g'ri - oxirgi tranzaksiyani tahrirlash\n- "unknown": boshqa\n\nSANA: "bugun"=bugungi, "kecha"=kechagi, "2 kun oldin"=2 kun oldin. Aytilmagan=null.\n\nMIQDOR: raqam + so'm/ming/mln/mlrd ni hisobga ol:\n- "500 ming" = 500000\n- "1.5 mln" = 1500000\n- "2 mlrd" = 2000000000\n- "50,000" = 50000\n\nFaqat JSON qaytar, boshqa hech narsa yo'q:`;

  const userPrompt = `Xabar: "${text}"\n\nJSON:\n{\n  "intent": "log_income"|"log_expense"|"query"|"query_category"|"delete_last"|"edit_last"|"unknown",\n  "amount": number|null,\n  "category": string|null,\n  "note": string|null,\n  "query": string|null,\n  "date": "YYYY-MM-DD"|null,\n  "editField": "amount"|"category"|"note"|null,\n  "editValue": string|null\n}`;

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      },
    );

    const raw = res.data.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Post-process amount multipliers missed by LLM
    if (parsed.amount && text.toLowerCase().includes('mln')) {
      if (parsed.amount < 1000) parsed.amount *= 1_000_000;
    }
    if (parsed.amount && text.toLowerCase().includes('mlrd')) {
      if (parsed.amount < 1000) parsed.amount *= 1_000_000_000;
    }
    if (parsed.amount && (text.toLowerCase().includes('ming') || text.toLowerCase().includes(' k '))) {
      if (parsed.amount < 1000) parsed.amount *= 1_000;
    }

    return parsed;
  } catch (e: any) {
    console.error('AI parse error:', e?.message);
    return fallbackParse(text);
  }
}

function fallbackParse(text: string): ParsedIntent {
  const lower = text.toLowerCase();

  let amount: number | undefined;
  const mlnMatch  = text.match(/(\d+\.?\d*)\s*mln/i);
  const mingMatch = text.match(/(\d+\.?\d*)\s*ming/i);
  const mlrdMatch = text.match(/(\d+\.?\d*)\s*mlrd/i);
  const plainMatch = text.match(/[\d\s,]+/);

  if (mlrdMatch)       amount = parseFloat(mlrdMatch[1])  * 1_000_000_000;
  else if (mlnMatch)   amount = parseFloat(mlnMatch[1])   * 1_000_000;
  else if (mingMatch)  amount = parseFloat(mingMatch[1])  * 1_000;
  else if (plainMatch) amount = parseFloat(plainMatch[0].replace(/\s|,/g, ''));

  const incomeWords  = ['kirim', 'daromad', 'tushdi', 'olindi', 'olingan', 'received', 'income', 'sotildi', 'topildi', 'tushum'];
  const expenseWords = ['chiqim', 'xarajat', 'sarflandi', "to'landi", 'tolandi', 'expense', 'paid', 'berildi', 'ketdi', 'sarf'];
  const queryWords   = ['?', 'qancha', 'necha', 'hisobot', "ko'rsat", 'ayt'];
  const deleteWords  = ["o'chir", 'ochir', 'delete', 'bekor', 'undo', 'xato edi'];
  const editWords    = ["o'zgartir", 'ozgartir', 'tahrir', 'edit', "noto'g'ri", 'xato'];

  if (deleteWords.some(w => lower.includes(w))) return { intent: 'delete_last' };
  if (editWords.some(w => lower.includes(w)))   return { intent: 'edit_last' };
  if (incomeWords.some(w => lower.includes(w)))  return { intent: 'log_income',  amount, note: text };
  if (expenseWords.some(w => lower.includes(w))) return { intent: 'log_expense', amount, note: text };
  if (queryWords.some(w => lower.includes(w)))   return { intent: 'query', query: text };
  if (amount && amount > 0) return { intent: 'unknown', amount, note: text };
  return { intent: 'unknown' };
}