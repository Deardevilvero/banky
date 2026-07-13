import { Receipt, Wallet } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext.jsx";


export default function CategoryStatsCard({ stat }) {
  const { fmtExact } = useCurrency();
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: `${stat.color}26`, color: stat.color }}
      >
        {stat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{stat.category}</div>
        <div className="text-xs text-muted">{stat.count} transactions (30d)</div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1" title="Total spent">
          <Wallet size={14} className="text-brand-500" />
          <span className="font-semibold">{fmtExact(stat.total)}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1" title="Average per transaction">
          <Receipt size={14} className="text-faint" />
          <span className="font-medium">{fmtExact(stat.total / Math.max(1, stat.count))} avg</span>
        </div>
      </div>
    </div>
  );
}
