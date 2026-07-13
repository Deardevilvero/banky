import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, addWeeks, isSameWeek } from "date-fns";
import api from "../api/axios.js";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { weekKeysFor } from "../utils/dateHelpers.js";
import { useCurrency } from "../context/CurrencyContext.jsx";

export default function Weekly() {
  const { fmt } = useCurrency();
  const [cursor, setCursor] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => weekKeysFor(cursor), [cursor]);
  const isCurrentWeek = isSameWeek(cursor, new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const start = days[0].key;
        const end = days[days.length - 1].key;
        const res = await api.get("/transactions", { params: { start, end } });
        setTransactions(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const dayTotals = days.map((d) => ({
    ...d,
    spend: transactions
      .filter((t) => t.date === d.key && t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0),
  }));
  const worstDay = [...dayTotals].sort((a, b) => b.spend - a.spend)[0];

  const byCategory = useMemo(() => {
    const out = {};
    for (const t of transactions) {
      if (t.type !== "Expense") continue;
      out[t.category] = (out[t.category] || 0) + t.amount;
    }
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  }, [transactions]);
  const topCategory = byCategory[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Weekly overview
          </h1>
          <p className="text-sm text-muted mt-0.5">
            See income, spending, and categories for any week at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary px-3"
            onClick={() => setCursor((d) => addWeeks(d, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass text-sm font-medium">
            <CalendarDays size={14} className="text-muted" />
            {format(days[0].date, "MMM d")} — {format(days[6].date, "MMM d, yyyy")}
          </div>
          <button
            className="btn-secondary px-3"
            onClick={() => setCursor((d) => addWeeks(d, 1))}
            disabled={isCurrentWeek}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentWeek && (
            <button className="btn-ghost" onClick={() => setCursor(new Date())}>
              Today
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">Net this week</div>
              <div
                className={`text-2xl font-semibold mt-1 ${
                  net < 0 ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {net < 0 ? "-" : ""}
                {fmt(Math.abs(net))}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {fmt(totalIncome)} in · {fmt(totalExpense)} out
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">Transactions</div>
              <div className="text-2xl font-semibold mt-1">{transactions.length}</div>
              <div className="text-xs text-muted mt-0.5">this week</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">Biggest spend day</div>
              <div className="text-2xl font-semibold mt-1">
                {worstDay?.spend ? worstDay.label : "—"}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {worstDay?.spend ? fmt(worstDay.spend) : "no data"}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">Top category</div>
              <div className="text-2xl font-semibold mt-1 truncate">
                {topCategory ? topCategory[0] : "—"}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {topCategory ? fmt(topCategory[1]) : "no data"}
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">📅</div>
              <div className="font-medium">No transactions this week</div>
              <div className="text-sm text-muted mt-1">
                Add a transaction to start filling in this week's overview.
              </div>
            </div>
          ) : (
            <WeeklyGrid transactions={transactions} days={days} />
          )}
        </>
      )}
    </div>
  );
}
