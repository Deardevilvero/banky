import { Link, Navigate } from "react-router-dom";
import {
  Sparkles,
  Flame,
  BarChart3,
  Brain,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import OrbitingCategories from "../components/OrbitingCategories.jsx";

const features = [
  {
    icon: CheckCircle2,
    title: "Track every transaction",
    desc: "Type it in plain English or use the quick form — amounts, categories, and dates parsed automatically.",
  },
  {
    icon: Brain,
    title: "AI weekly insights",
    desc: "Personalised reports on where your money went, what changed, and what to try next.",
  },
  {
    icon: Flame,
    title: "Budget recovery coach",
    desc: "When a category runs over budget, AI generates a gentle plan to get back on track.",
  },
  {
    icon: BarChart3,
    title: "Beautiful statistics",
    desc: "See patterns across days, weeks, categories — with an AI chat built-in.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg">AI Finance Tracker</span>
        </div>
        <nav className="flex items-center gap-2">
          <button onClick={toggle} className="btn-ghost p-2.5" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          <div className="lg:col-span-8 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-1.5 chip mb-5 bg-brand-500/15 text-brand-700 dark:text-brand-300">
              <Sparkles size={12} />
              AI-powered money coach
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
              Know where your money goes,
              <br />
              with an AI that actually{" "}
              <span className="bg-gradient-to-br from-brand-400 to-brand-700 bg-clip-text text-transparent">
                knows your spending
              </span>
              .
            </h1>
            <p className="mt-5 text-soft text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Log transactions in plain English, watch your budget in real
              time, and let AI turn your data into real, specific advice —
              not generic tips.
            </p>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-3">
              <Link to="/register" className="btn-primary px-5 py-3 text-base">
                Start free
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary px-5 py-3 text-base">
                I have an account
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center lg:-mr-36">
            <OrbitingCategories />
          </div>
        </div>

        <div className="mt-14 md:mt-20 grid md:grid-cols-2 gap-6">
          <div className="card p-6 relative overflow-hidden">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-2">
              Today
            </div>
            <div className="space-y-3">
              {[
                { icon: "🛒", name: "Grocery run", amount: "-$62.40", type: "Expense" },
                { icon: "🍽️", name: "Lunch with team", amount: "-$18.00", type: "Expense" },
                { icon: "💼", name: "Freelance payment", amount: "+$350.00", type: "Income" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl glass p-3">
                  <span className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    {t.icon}
                  </span>
                  <div className="flex-1 text-sm font-medium">{t.name}</div>
                  <div
                    className={`text-sm font-semibold ${
                      t.type === "Income" ? "text-emerald-500" : ""
                    }`}
                  >
                    {t.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.22), transparent 55%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-2">
                <Sparkles size={12} />
                AI Weekly Report
              </div>
              <p className="text-sm leading-relaxed">
                This week you spent <b>$412</b>, down 8% from last week.
                Dining crept up on Friday — swapping one takeout order for a
                home-cooked meal would save roughly $100/month. Rent and
                subscriptions stayed exactly on schedule.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Saved", value: "48%" },
                  { label: "This week", value: "$412" },
                  { label: "No-spend days", value: "3" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-3">
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-xs text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t divider">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-soft">
            Clean tracking, deep stats, and AI features that understand your
            actual spending.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-3">
                <f.icon size={18} />
              </div>
              <div className="font-medium">{f.title}</div>
              <div className="text-sm text-soft mt-1 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative p-10 text-center rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-2xl shadow-brand-500/30">
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background:
                "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.3), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Wallet size={18} />
              <Activity size={18} />
              <Sparkles size={18} />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Your first insight is 3 clicks away.
            </h2>
            <p className="mt-3 text-brand-100 max-w-lg mx-auto">
              Create your account, log a transaction, see it in your dashboard.
              That's the whole onboarding.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-brand-700 px-5 py-3 text-sm font-semibold hover:bg-brand-50 transition shadow-xl"
            >
              Create my account
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-faint border-t divider">
        Built with MERN · AI Finance Tracker © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
