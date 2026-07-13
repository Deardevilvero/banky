import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import api from "../api/axios.js";
import CategoryStatsCard from "../components/CategoryStatsCard.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import MonthlyBarChart from "../components/MonthlyBarChart.jsx";
import CategoryPieChart from "../components/CategoryPieChart.jsx";
import AIChat from "../components/AIChat.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext.jsx";

export default function Stats() {
  const { fmt } = useCurrency();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const statsRes = await api.get("/transactions/stats");
        setStats(statsRes.data);
        const end = new Date();
        const start = subDays(end, 29);
        const rangeRes = await api.get("/transactions", {
          params: {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
          },
        });
        setTransactions(rangeRes.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const daily = useMemo(() => {
    const end = new Date();
    const byDate = {};
    for (let i = 29; i >= 0; i--) {
      const d = subDays(end, i);
      byDate[format(d, "yyyy-MM-dd")] = 0;
    }
    for (const t of transactions) {
      if (t.type !== "Expense") continue;
      if (byDate[t.date] !== undefined) byDate[t.date] += t.amount;
    }
    return Object.entries(byDate).map(([k, v]) => ({
      label: format(parseISO(k), "MMM d"),
      amount: Math.round(v),
    }));
  }, [transactions]);

  const weekly = useMemo(() => {
    const end = new Date();
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(end, i);
      const key = format(d, "yyyy-MM-dd");
      const amount = transactions
        .filter((t) => t.date === key && t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0);
      out.push({ label: format(d, "EEE"), amount: Math.round(amount) });
    }
    return out;
  }, [transactions]);

  const categoryData = useMemo(() => {
    if (!stats) return [];
    return stats.perCategory.map((c) => ({ name: c.category, value: Math.round(c.total) }));
  }, [stats]);

  if (loading || !stats) return <LoadingSpinner full />;

  const sorted = [...stats.perCategory].sort((a, b) => b.total - a.total);
  const biggest = sorted[0];
  const totalSpend30d = sorted.reduce((s, c) => s + c.total, 0);
  const totalTxns30d = sorted.reduce((s, c) => s + c.count, 0);
  const smallestActive = [...stats.perCategory]
    .filter((c) => c.count > 0)
    .sort((a, b) => a.total - b.total)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-sm text-muted mt-0.5">
          Deep insights from your last 30 days of spending.
        </p>
      </div>

      {stats.perCategory.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">📊</div>
          <div className="font-medium">No data yet</div>
          <div className="text-sm text-muted mt-1">
            Log a few transactions to unlock statistics.
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {biggest && (
              <div className="card p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <TrendingDown size={14} className="text-rose-500" />
                  Biggest category
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl">{biggest.icon}</span>
                  <div>
                    <div className="font-semibold">{biggest.category}</div>
                    <div className="text-sm text-muted">{fmt(biggest.total)} over 30 days</div>
                  </div>
                </div>
              </div>
            )}
            <div className="card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Wallet size={14} className="text-emerald-500" />
                Total spent
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">💳</span>
                <div>
                  <div className="font-semibold">{fmt(totalSpend30d)}</div>
                  <div className="text-sm text-muted">{totalTxns30d} transactions</div>
                </div>
              </div>
            </div>
            {smallestActive && (
              <div className="card p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <TrendingUp size={14} className="text-amber-500" />
                  Lightest category
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl">{smallestActive.icon}</span>
                  <div>
                    <div className="font-semibold">{smallestActive.category}</div>
                    <div className="text-sm text-muted">{fmt(smallestActive.total)} over 30 days</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <WeeklyBarChart data={weekly} title="Spending — last 7 days" />
            <MonthlyBarChart data={daily} />
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
            <CategoryPieChart data={categoryData} />
            <div className="card p-5">
              <div className="text-sm font-medium mb-3">Top categories (30d)</div>
              <div className="space-y-3">
                {sorted.slice(0, 5).map((c) => {
                  const pct = Math.round((c.total / totalSpend30d) * 100);
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{c.icon}</span>
                          <span className="truncate">{c.category}</span>
                        </div>
                        <span className="text-muted text-xs">
                          {fmt(c.total)} · {pct}%
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: "var(--chip-bg)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">All categories</div>
            {sorted.map((c) => (
              <CategoryStatsCard key={c.category} stat={c} />
            ))}
          </div>
        </>
      )}

      <AIChat />
    </div>
  );
}
