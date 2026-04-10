# FinanceBot — Biznes Moliya Boshqaruvchi

**Telegram bot + Web dashboard** for SMBs in Uzbekistan.

## Architecture

```
financebot/
├── api/    NestJS REST API + SSE real-time (port 3001)
├── bot/    Grammy Telegram bot — voice/text NLP (port 3002)
└── web/    React + Vite dashboard (port 5173)
```

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- Groq API key → https://console.groq.com (free)
- Telegram Bot Token → @BotFather

### 1. Install dependencies

```bash
cd api && npm install
cd ../bot && npm install
cd ../web && npm install
```

### 2. Configure API

```bash
cp api/.env.example api/.env
```

Edit `api/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financebot
JWT_SECRET=any-long-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
BOT_INTERNAL_SECRET=financebot_internal   # must match bot
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE financebot;"
```

### 3. Configure Bot

```bash
cp bot/.env.example bot/.env
```

Edit `bot/.env`:
```env
TELEGRAM_BOT_TOKEN=your_token_from_botfather
GROQ_API_KEY=your_groq_key
API_URL=http://localhost:3001/api
BOT_INTERNAL_SECRET=financebot_internal   # must match api
FRONTEND_URL=http://localhost:5173
# BOT_WEBHOOK_URL=   ← leave empty for local dev (long polling)
PORT=3002
```

### 4. Configure Web

```bash
cp web/.env.example web/.env
```

Edit `web/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_BOT_USERNAME=your_bot_username
```

### 5. Run all three services

**Terminal 1 — API:**
```bash
cd api && npm run start:dev
```

**Terminal 2 — Bot:**
```bash
cd bot && npm run dev
```

**Terminal 3 — Web:**
```bash
cd web && npm run dev
# → http://localhost:5173
```

---

## Linking a Telegram account

After registering on the dashboard:

1. Open the dashboard → click your username → **Profil/Account**
2. Go to the **Telegram Bot** tab
3. Click **"Token yaratish"** → copy the `/link <token>` command
4. Send that command to your bot in Telegram
5. The bot confirms: ✅ Hisob ulanded

> The link token expires in **15 minutes**. Generate a new one if it expires.

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + link instructions |
| `/link <token>` | Link Telegram to dashboard account |
| `/hisobot` | Financial report (week/month/year) |
| `/songi` | Last 10 transactions |
| `/byudjet` | Budget status |
| `/edit` | Edit last transaction |
| `/bekor` | Delete last transaction |
| `/kategoriyalar` | List all categories |
| `/help` | Full command guide |

**Natural language (text or voice):**
```
500 000 kirim savdo
80 ming chiqim transport
1.5 mln maosh to'landi
Bu oy qancha kirim bo'ldi?
Logistikaga necha sarf qildik?
```

---

## Production Deploy

### API → Railway

1. New Project → Deploy from GitHub → root dir: `api`
2. Add PostgreSQL plugin (Railway provides `DATABASE_URL` automatically)
3. Environment variables:
```
JWT_SECRET          = (long random string)
BOT_INTERNAL_SECRET = financebot_internal
FRONTEND_URL        = https://your-web.vercel.app
ADMIN_USERNAME      = admin
ADMIN_PASSWORD      = (strong password)
```

### Bot → Railway

1. New service → root dir: `bot`
2. Environment variables:
```
TELEGRAM_BOT_TOKEN  = your_token
GROQ_API_KEY        = your_key
API_URL             = https://your-api.railway.app/api
BOT_INTERNAL_SECRET = financebot_internal
FRONTEND_URL        = https://your-web.vercel.app
BOT_WEBHOOK_URL     = https://your-bot.railway.app
```

### Web → Vercel

1. Import repo → root dir: `web`
2. Environment variables:
```
VITE_API_URL     = https://your-api.railway.app/api
VITE_BOT_USERNAME = your_bot_username
```

---

## What was fixed in this version

| # | Issue | Fix |
|---|-------|-----|
| 1 | `apiClient.ts` used hardcoded `admin/admin123` — all bot users' data went into one account | Rewrote `apiClient.ts` with per-user JWT cache; bot fetches tokens via `POST /auth/telegram-login` using `telegramId` + `BOT_INTERNAL_SECRET` |
| 2 | No `/link` command — no way to connect Telegram to dashboard | Added `POST /auth/telegram-link-token` (dashboard), `POST /auth/telegram-link` (bot), `/link <token>` bot command, Telegram tab in Account page |
| 3 | `useRealtime` import in Transactions — confirmed present in `hooks.ts`, no compile error | Verified — not broken |
| 4 | SSE broadcast was global (all users saw all events) | Rewrote SSE registry as `Map<userId, Set<Response>>` — each user only receives their own events |

---

## API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password

POST /api/auth/telegram-link-token   ← dashboard generates link token
POST /api/auth/telegram-link         ← bot completes linking
POST /api/auth/telegram-login        ← bot fetches JWT by telegramId
POST /api/auth/telegram-unlink       ← dashboard removes link

GET    /api/transactions             ?type= &categoryId= &from= &to= &search= &page= &limit=
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions/stats       ?period=week|month|year
GET    /api/transactions/chart       ?period=
GET    /api/transactions/stream      (SSE — per-user real-time)
GET    /api/transactions/export/csv  ?type= &categoryId= &from= &to=

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/budgets
GET    /api/budgets/status
POST   /api/budgets
DELETE /api/budgets/:id
```

Swagger UI: `http://localhost:3001/docs`

---

## Product Brief

FinanceBot is built for small and medium businesses in Uzbekistan who currently track cash flow through WhatsApp voice messages, paper notebooks, or scattered Excel files. It gives the finance team a Telegram bot they can speak to in natural Uzbek — voice or text — to log income and expenses instantly, while management gets a real-time web dashboard showing exactly where money is coming from and where it's going. V2 would add multi-user team access with role-based permissions (owner vs accountant), bank statement PDF import, and automated monthly email reports.

## What I'd Add with 3 More Days

With three more days I would add recurring transaction support (e.g. monthly rent auto-logs itself), a PDF/Excel export of the full financial report for accountants, SMS or email alerts when a budget limit is exceeded, a proper mobile-responsive layout for the dashboard, and the ability for the bot to handle group chats so an entire team can log transactions from one shared Telegram group without each person needing to link individually.

## Submission Checklist

- **GitHub repo** — see setup instructions above (README works end-to-end)
- **Telegram bot username** — set `TELEGRAM_BOT_TOKEN` from @BotFather, the bot's username is whatever you named it
- **Web dashboard** — deploy to Vercel (web/) + Railway (api/ + bot/) following the Production Deploy section above
- **Screen recording flow** — record: open bot → send voice message → see transaction appear in dashboard Overview in real time
- **Product brief** — see above
- **3 more days** — see above
