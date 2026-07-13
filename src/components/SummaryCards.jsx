import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext.jsx";

const Card = ({ icon: Icon, label, value, iconBg, iconFg }) => (
  <div className="card p-4 flex items-center gap-3 overflow-hidden relative">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: iconBg, color: iconFg }}
    >
      <Icon size={18} />
    </div>
    <div>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  </div>
);

export default function SummaryCards({ income, expense, net, savingsRate }) {
  const { fmt } = useCurrency();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        icon={Wallet}
        label="Net this period"
        value={`${net < 0 ? "-" : ""}${fmt(net)}`}
        iconBg="rgba(99,102,241,0.15)"
        iconFg="#6366f1"
      />
      <Card
        icon={TrendingUp}
        label="Income"
        value={fmt(income)}
        iconBg="rgba(16,185,129,0.15)"
        iconFg="#10b981"
      />
      <Card
        icon={TrendingDown}
        label="Expenses"
        value={fmt(expense)}
        iconBg="rgba(239,68,68,0.15)"
        iconFg="#ef4444"
      />
      <Card
        icon={PiggyBank}
        label="Savings rate"
        value={`${savingsRate}%`}
        iconBg="rgba(245,158,11,0.15)"
        iconFg="#f59e0b"
      />
    </div>
  );
}
