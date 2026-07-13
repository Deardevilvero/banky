import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Brain,
  Flame,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Markdown from "../components/Markdown.jsx";
import { weekKeysFor } from "../utils/dateHelpers.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";

const PIE_COLORS = [
  "#f59e0b",
  "#fb923c",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#14b8a6",
];

const REPORT_CACHE_KEY = (weekStart) => `weekly-report-${weekStart}`;


export default function Insights() {
  const { theme } = useTheme();
  const { fmt } = useCurrency();
  const isDark = theme === "dark";
  const grid = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,15,27,0.08)";
  const tick = isDark ? "#8a8aa0" : "#6b6b78";
  const tooltipStyle = {
    background: isDark ? "rgba(20,20,36,0.95)" : "rgba(255,255,255,0.95)",
    border: `1px solid ${grid}`,
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? "#ebebf5" : "#13131b",
    backdropFilter: "blur(12px)",
  };

  const [transactions, setTransactions] = useState([]);
  const [noSpendStreak, setNoSpendStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const [report, setReport] = useState("");
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const thisWeek = useMemo(() => weekKeysFor(new Date()), []);
  const lastWeek = useMemo(() => weekKeysFor(subDays(new Date(), 7)), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const start = lastWeek[0].key;
        const end = thisWeek[6].key;
        const [txRes, summaryRes] = await Promise.all([
          api.get("/transactions", { params: { start, end } }),
          api.get("/transactions/summary"),
        ]);
        setTransactions(txRes.data);
        setNoSpendStreak(summaryRes.data.noSpendStreak || 0);

        const cached = localStorage.getItem(REPORT_CACHE_KEY(thisWeek[0].key));
        if (cached) {
          try {
            const { content, generatedAt } = JSON.parse(cached);
            setReport(content);
            setReportGeneratedAt(new Date(generatedAt));
          } catch {}
        } else {
          generateReport();
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.post("/ai/weekly-report");
      setReport(res.data.content);
      const now = new Date();
      setReportGeneratedAt(now);
      localStorage.setItem(
        REPORT_CACHE_KEY(thisWeek[0].key),
        JSON.stringify({ content: res.data.content, generatedAt: now })
      );
    } catch {
      setReport("Failed to generate the report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const thisWeekKeys = useMemo(() => new Set(thisWeek.map((d) => d.key)), [thisWeek]);
  const thisWeekTxns = useMemo(
    () => transactions.filter((t) => thisWeekKeys.has(t.date)),
    [transactions, thisWeekKeys]
  );
  const lastWeekTxns = useMemo(
    () => transactions.filter((t) => !thisWeekKeys.has(t.date)),
    [transactions, thisWeekKeys]
  );

  const thisWeekSpend = thisWeekTxns
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + t.amount, 0);
  const lastWeekSpend = lastWeekTxns
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + t.amount, 0);
  const thisWeekIncome = thisWeekTxns
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + t.amount, 0);

  const delta = thisWeekSpend - lastWeekSpend;
  const deltaPct = lastWeekSpend
    ? Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100)
    : thisWeekSpend > 0
    ? 100
    : 0;

  const dailyData = thisWeek.map((d) => {
    const amount = thisWeekTxns
      .filter((t) => t.date === d.key && t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    return { label: d.label, amount: Math.round(amount) };
  });

  const compareData = thisWeek.map((d, idx) => {
    const thisAmt = thisWeekTxns
      .filter((t) => t.date === d.key && t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    const lastAmt = lastWeekTxns
      .filter((t) => t.date === lastWeek[idx].key && t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    return { label: d.label, "This week": Math.round(thisAmt), "Last week": Math.round(lastAmt) };
  });

  const worstDay = [...dailyData].sort((a, b) => b.amount - a.amount)[0];

  const categoryData = useMemo(() => {
    const counts = {};
    for (const t of thisWeekTxns) {
      if (t.type !== "Expense") continue;
      counts[t.category] = (counts[t.category] || 0) + t.amount;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [thisWeekTxns]);

  if (loading) return <LoadingSpinner full />;

  const DeltaPill = () => {
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    // Spending less than last week is the "good" direction, so colors are inverted
    // relative to a typical growth metric.
    const color =
      delta < 0
        ? "text-emerald-500 bg-emerald-500/10"
        : delta > 0
        ? "text-rose-500 bg-rose-500/10"
        : "text-faint bg-[var(--chip-bg)]";
    const label =
      delta === 0
        ? "no change"
        : `${delta > 0 ? "+" : ""}${fmt(delta)} (${deltaPct > 0 ? "+" : ""}${deltaPct}%)`;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      >
        <Icon size={12} /> {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Weekly insights</h1>
          <p className="text-sm text-muted mt-0.5 inline-flex items-center gap-2">
            <CalendarRange size={14} />
            {format(thisWeek[0].date, "MMM d")} — {format(thisWeek[6].date, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-sm">
            <Flame size={14} className={noSpendStreak > 0 ? "text-orange-500" : "text-faint"} />
            <span className="font-medium">{noSpendStreak}</span>
            <span className="text-muted text-xs">no-spend day streak</span>
          </div>
        </div>
      </div>

      {/* AI weekly report */}
      <div className="card p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.25), transparent 60%)",
          }}
        />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
            <Brain size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">AI Weekly Report</div>
            <div className="text-xs text-muted">
              {reportGeneratedAt
                ? `Generated ${reportGeneratedAt.toLocaleTimeString()}`
                : "Personalised analysis of this week's spending"}
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="btn-ghost"
          >
            <RefreshCw size={14} className={reportLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
        <div className="mt-4 relative">
          {reportLoading && !report ? (
            <div className="text-sm text-muted flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Analysing your week...
            </div>
          ) : (
            <Markdown className="glass rounded-xl p-4 text-sm">{report}</Markdown>
          )}
        </div>
      </div>

      {/* This week vs last week */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-muted font-medium">Spent this week</div>
          <div className="text-2xl font-semibold mt-1">{fmt(thisWeekSpend)}</div>
          <div className="mt-2">
            <DeltaPill />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted font-medium">Income this week</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-500">
            {fmt(thisWeekIncome)}
          </div>
          <div className="text-xs text-muted mt-2">
            Net {fmt(thisWeekIncome - thisWeekSpend)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted font-medium">Biggest spend day</div>
          <div className="text-2xl font-semibold mt-1">
            {worstDay?.amount ? worstDay.label : "—"}
          </div>
          <div className="text-xs text-muted mt-2">
            {worstDay?.amount ? fmt(worstDay.amount) : "no data"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">This week vs last week</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: tick }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,15,27,0.04)" }}
                  contentStyle={tooltipStyle}
                  formatter={(v) => [fmt(v), ""]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: tick }} />
                <Bar dataKey="Last week" fill={isDark ? "#3f3f52" : "#d4d4dd"} radius={[4, 4, 0, 0]} />
                <Bar dataKey="This week" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-medium mb-3">Spending by category — this week</div>
          {categoryData.length === 0 ? (
            <div className="text-sm text-muted py-10 text-center">No expenses this week yet.</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke={isDark ? "rgba(255,255,255,0.06)" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(v), "Spent"]} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: tick }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <Sparkles size={14} className="text-brand-500" />
          Daily spend — this week
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: tick }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,15,27,0.04)" }}
                contentStyle={tooltipStyle}
                formatter={(v) => [fmt(v), "Spent"]}
              />
              <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
