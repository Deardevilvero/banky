import { weekKeys } from "../utils/dateHelpers.js";
import { useCurrency } from "../context/CurrencyContext.jsx";


export default function WeeklyGrid({ transactions = [], days: customDays }) {
  const { fmt } = useCurrency();
  const days = customDays || weekKeys();
  const todayKey = new Date().toISOString().slice(0, 10);

  const byDay = days.map((d) => {
    const dayTxns = transactions.filter((t) => t.date === d.key);
    const spent = dayTxns
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    const income = dayTxns
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + t.amount, 0);
    return { ...d, spent, income, count: dayTxns.length };
  });

  const maxSpent = Math.max(1, ...byDay.map((d) => d.spent));

  if (!transactions.length) {
    return (
      <div className="card p-6 text-center text-muted text-sm">
        No transactions this week yet.
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="text-sm font-medium mb-4">This week</div>
      <div className="grid grid-cols-7 gap-2">
        {byDay.map((d) => {
          const barHeight = Math.max(6, Math.round((d.spent / maxSpent) * 72));
          const isToday = d.key === todayKey;
          return (
            <div key={d.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`text-xs font-medium ${
                  isToday ? "text-brand-600 dark:text-brand-300" : "text-muted"
                }`}
              >
                {d.label}
              </div>
              <div className="h-20 w-full flex items-end justify-center">
                <div
                  className="w-6 rounded-t-md transition-all"
                  style={{
                    height: barHeight,
                    background: d.spent
                      ? "linear-gradient(180deg, #fcd34d, #d97706)"
                      : "var(--chip-bg)",
                  }}
                  title={`${fmt(d.spent)} spent, ${d.count} transaction${d.count === 1 ? "" : "s"}`}
                />
              </div>
              <div className="text-xs font-semibold">{d.spent ? fmt(d.spent) : "—"}</div>
              <div className="text-[10px] text-faint">{d.short}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
