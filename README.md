# AI Finance Tracker — UI

A React 19 + Vite + Tailwind 4 frontend, converted from the "AI Habit Tracker"
UI boilerplate into a finance tracker: transactions instead of habits,
budgets instead of streaks, spending insights instead of completion reports.
Same visual system (glassmorphism, dark/light theme, orbiting hero graphic,
recharts), new domain.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Log in with **any** email/password — auth
is mocked (see below), it accepts anything.

## What's mocked vs real

Like the original boilerplate, this ships with an in-memory mock API
(`src/api/axios.js` + `src/utils/mockData.js`) so every page renders
realistic data with zero backend running: 90 days of generated transactions,
recurring rent/salary/subscriptions, and canned AI responses.

**Nothing here calls a real AI model yet.** The natural-language "type it"
entry mode in `TransactionForm.jsx` uses a small local regex parser as a
stand-in. To make it real, wire it to Claude — see "Connecting the real
backend" below.

## What changed from the habit tracker

| Habit tracker concept | Finance tracker concept |
|---|---|
| Habit (name, category, frequency) | Transaction (amount, type, category, description, date) |
| Daily check-off / completion log | The transaction itself — no separate "log" |
| Streak (consecutive days completed) | No-spend streak (consecutive days with zero expenses) |
| Today's habits checklist | Today's transactions list |
| Weekly grid (habit × day checkmarks) | Weekly spend strip (daily totals as bars) |
| 90-day completion heatmap | 90-day spend-intensity heatmap |
| AI weekly report (encouragement) | AI weekly report (spending patterns) |
| Streak recovery coach | Budget-overrun recovery coach |
| AI habit suggestions | AI budget/savings suggestions |
| Stats: streaks & completions per habit | Stats: totals & averages per category |

Pages: `Dashboard`, `Transactions` (was `Habits`), `Weekly`, `Insights`,
`Stats`, plus unchanged `Landing`, `Login`, `Register`.

## Connecting the real backend

This pairs naturally with the Python finance-tracker backend
(`db.py` / `ai_features.py` from the earlier deliverable) or any REST API.
Two things to wire up:

1. **Replace `src/api/axios.js`** with a real axios client per the
   commented-out template at the top of that file — point `baseURL` at
   your backend and delete `src/utils/mockData.js`.

2. **Replace the routes it expects.** The mock currently understands:
   - `GET/POST/PUT/DELETE /transactions`, `/transactions/:id`
   - `GET /transactions/today`, `/transactions/heatmap`, `/transactions/summary`, `/transactions/stats`
   - `POST /ai/weekly-report`, `/ai/suggest-budgets`, `/ai/recovery-plan`, `/ai/chat`
   - `GET /ai/morning`
   - `GET/POST /auth/*`

   Map these to `ai_features.py`'s functions
   (`parse_natural_language_entry`, `categorize_transaction`,
   `chat_about_finances`, `generate_insights`) behind a small FastAPI/Flask
   layer, or adapt the route names to match an existing backend.

3. **Swap the "type it" parser.** In `TransactionForm.jsx`, replace the
   local regex parser with a call to `POST /ai/parse-transaction` backed by
   `ai_features.parse_natural_language_entry`.

## Structure

```
src/
├── api/axios.js              # mock backend (swap for real API client)
├── context/                  # Auth + Theme providers
├── components/                # all UI pieces (forms, cards, charts)
├── pages/                     # Dashboard, Transactions, Weekly, Insights, Stats, Landing, Login, Register
└── utils/
    ├── constants.js           # categories, icons, colors
    ├── mockData.js             # generated mock transactions + AI sample responses
    ├── dateHelpers.js          # date/streak math
    └── confetti.js             # celebration effect on adding a transaction
```
