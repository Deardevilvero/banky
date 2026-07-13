import { useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import api from "../api/axios.js";
import Markdown from "./Markdown.jsx";

export default function BudgetAlertCard({ category, overspend, onDismiss }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/recovery-plan", { category });
      setContent(res.data.content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl p-5 glass overflow-hidden animate-slide-up">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(244,114,182,0.22), transparent 55%), radial-gradient(circle at 100% 100%, rgba(239,68,68,0.15), transparent 55%)",
        }}
      />
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-soft hover:text-[var(--text)] z-10"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-6 relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            Over budget · {category}
          </div>
          <div className="mt-1 text-sm text-soft">
            You're roughly ${overspend.toLocaleString()} over your usual pace for{" "}
            {category} this month. No panic — let's tighten it back up.
          </div>

          {!content ? (
            <button className="mt-3 btn-primary" onClick={generate} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Building your plan...
                </>
              ) : (
                "Get a recovery plan"
              )}
            </button>
          ) : (
            <Markdown className="mt-3 glass rounded-xl p-4 text-sm">{content}</Markdown>
          )}
        </div>
      </div>
    </div>
  );
}
