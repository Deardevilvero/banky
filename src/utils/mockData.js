// ────────────────────────────────────────────────────────────────────────────
// Mock data for the UI boilerplate.
// Replace api/axios.js with a real axios client (or point it at the Python
// finance-tracker backend) and delete this file when you wire up the backend.
// ────────────────────────────────────────────────────────────────────────────
import { format, subDays } from "date-fns";
import { CATEGORY_META } from "./constants.js";

const todayKey = () => format(new Date(), "yyyy-MM-dd");

export const mockUser = {
  _id: "u_alex",
  name: "Alex Rivera",
  email: "alex@example.com",
  avatar: "A",
  morningMotivation: true,
  monthlyBudget: 2600,
};

let nextTxnId = 1;
const txn = (overrides) => ({
  _id: `t_${nextTxnId++}`,
  userId: mockUser._id,
  amount: 0,
  type: "Expense",
  category: "Other",
  description: "",
  date: todayKey(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Recurring "anchor" transactions that repeat every month, plus randomised
// day-to-day spending across the last 90 days, so every chart has something
// interesting to show out of the box.
const RECURRING = [
  { category: "Rent", amount: 1450, dayOfMonth: 1, description: "Monthly rent" },
  { category: "Salary", amount: 4200, type: "Income", dayOfMonth: 1, description: "Paycheck" },
  { category: "Subscriptions", amount: 15.99, dayOfMonth: 3, description: "Streaming service" },
  { category: "Subscriptions", amount: 9.99, dayOfMonth: 5, description: "Cloud storage" },
  { category: "Utilities", amount: 120, dayOfMonth: 8, description: "Electricity & water" },
];

const DAILY_POOL = [
  { category: "Groceries", min: 20, max: 90, description: "Grocery run", freq: 0.35 },
  { category: "Dining", min: 8, max: 45, description: "Lunch out", freq: 0.4 },
  { category: "Transport", min: 3, max: 30, description: "Rideshare / transit", freq: 0.3 },
  { category: "Entertainment", min: 10, max: 60, description: "Movies / streaming buy", freq: 0.1 },
  { category: "Shopping", min: 15, max: 150, description: "Online order", freq: 0.15 },
  { category: "Health", min: 10, max: 80, description: "Pharmacy", freq: 0.08 },
];

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const buildTransactions = () => {
  const out = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    const dom = d.getDate();

    for (const r of RECURRING) {
      if (dom === r.dayOfMonth) {
        out.push(
          txn({
            amount: r.amount,
            type: r.type || "Expense",
            category: r.category,
            description: r.description,
            date: key,
          })
        );
      }
    }

    DAILY_POOL.forEach((p, pi) => {
      const seed = i * 97 + pi * 131;
      const roll = seededRandom(seed);
      if (roll < p.freq) {
        const amtRoll = seededRandom(seed + 1);
        const amount = Math.round((p.min + amtRoll * (p.max - p.min)) * 100) / 100;
        out.push(
          txn({
            amount,
            type: "Expense",
            category: p.category,
            description: p.description,
            date: key,
          })
        );
      }
    });
  }

  // A couple of freelance income entries for variety
  out.push(txn({ amount: 350, type: "Income", category: "Freelance", description: "Logo design gig", date: format(subDays(today, 12), "yyyy-MM-dd") }));
  out.push(txn({ amount: 120, type: "Income", category: "Investment", description: "Dividend payout", date: format(subDays(today, 22), "yyyy-MM-dd") }));

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const mockTransactions = buildTransactions();

// ─── AI sample responses ──────────────────────────────────────────────────
export const mockAI = {
  weeklyReport: `This week you spent **$412** across 14 transactions, down 8% from last week's $448.

**Groceries** and **Dining** together made up over half your spending — dining out in particular crept up on Thursday and Friday, likely tied to the weekend. **Rent** and **Subscriptions** stayed exactly on schedule, no surprises there.

One pattern worth flagging: your last three Fridays have each included a $30+ takeout order. If that's intentional, no problem — but if you're trying to hit your savings goal, swapping one Friday takeout for a home-cooked meal would save roughly $100/month.

Income was steady with your regular paycheck landing on the 1st. Overall a reasonably controlled week — nothing alarming, just a couple of small optimizations available if you want them.`,
  recovery: `Your **Dining** spending crossed your budget for this category by $86 this month. That happens — budgets are guides, not report cards.

**Step 1:** Look at the next 7 days. Cap dining out at one meal instead of your usual three or four — that alone closes most of the gap.

**Step 2:** Move grocery shopping earlier in the week (Sun/Mon) so a stocked fridge makes cooking the easier default, not the effortful one.

**Step 3:** If a $86 overage happens again next month, it's worth just raising the budget to match reality rather than fighting it — a budget you blow past every month isn't doing its job.

Most overspending isn't a willpower problem, it's a friction problem. Small default changes tend to work better than strict rules.`,
  morning: `Good morning, Alex! You're at **$1,240 spent** this month with 18 days to go — you're pacing about 6% under budget, nice work. 💰 One thing to watch: **Dining** is already at 80% of its monthly budget. A couple of home-cooked dinners this week would keep you comfortably on track.`,
  chat: {
    default:
      "Hi — ask me anything about your spending. I have your last 90 days of transactions loaded as context.",
    "which category do i spend the most on":
      "**Groceries** is your top category over the last 30 days at roughly **$620**, followed by **Dining** at **$410** and **Rent** at **$1,450** (your single biggest fixed cost). Discretionary spending (dining + entertainment + shopping) makes up about 28% of total outflow.",
    "how much did i spend this month":
      "So far this month you've spent approximately **$2,180** across all categories, against income of **$4,200**. That puts your net savings at roughly **$2,020**, a savings rate of about 48%.",
    "am i on track with my budget":
      "You're tracking **under budget overall** — about 6% below your $2,600 monthly target. The one category running hot is **Dining**, currently at 80% of its allocation with over a week left in the month.",
  },
  suggestions: [
    {
      name: "Weekly grocery budget: $120",
      description: "Cap grocery spend per week to reduce impulse purchases.",
      category: "Groceries",
      icon: "🛒",
      reason:
        "Your grocery spend varies 2-3x week to week — a soft weekly cap smooths that out and typically saves 10-15%.",
    },
    {
      name: "Dining out budget: $150/month",
      description: "Set a firm ceiling on restaurants and takeout.",
      category: "Dining",
      icon: "🍽️",
      reason:
        "Dining is your fastest-growing discretionary category over the last 90 days — a visible cap tends to curb the drift.",
    },
    {
      name: "Auto-transfer $300 to savings on payday",
      description: "Move money to savings the moment income lands, before it can be spent.",
      category: "Investment",
      icon: "📈",
      reason:
        "You're consistently under budget — automating the surplus turns 'leftover money' into an actual savings habit.",
    },
  ],
};

export { CATEGORY_META };
