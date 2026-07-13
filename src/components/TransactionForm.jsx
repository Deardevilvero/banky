import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import api from "../api/axios.js";
import { CATEGORIES, CATEGORY_META } from "../utils/constants.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ initial, onSubmit, onCancel, submitting }) {
  const [mode, setMode] = useState("manual"); // "manual" | "nl"
  const [nlText, setNlText] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState("");

  const [form, setForm] = useState({
    amount: initial?.amount ?? "",
    type: initial?.type || "Expense",
    category: initial?.category || "Groceries",
    description: initial?.description || "",
    date: initial?.date || todayStr(),
  });

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    if (!form.description.trim()) return;
    const meta = CATEGORY_META[form.category] || CATEGORY_META.Other;
    onSubmit({
      ...form,
      amount: Number(form.amount),
      icon: meta.icon,
      color: meta.color,
    });
  };

  const parseNaturalLanguage = async () => {
    if (!nlText.trim()) return;
    setNlLoading(true);
    setNlError("");
    try {
      const res = await api.post("/ai/parse-transaction", { text: nlText.trim() });
      const parsed = res.data;
      setForm({
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        description: parsed.description,
        date: parsed.date,
      });
      setMode("manual");
    } catch (err) {
      setNlError(
        err.response?.data?.detail ||
          "Couldn't parse that — try including an amount, e.g. 'spent $45 on groceries yesterday'."
      );
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!initial && (
        <div className="inline-flex rounded-xl glass overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setMode("nl")}
            className={`px-3.5 py-2 font-medium transition inline-flex items-center gap-1.5 ${
              mode === "nl"
                ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                : "text-soft hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Sparkles size={13} /> Type it
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`px-3.5 py-2 font-medium transition border-l divider ${
              mode === "manual"
                ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                : "text-soft hover:bg-[var(--surface-hover)]"
            }`}
          >
            Manual form
          </button>
        </div>
      )}

      {mode === "nl" ? (
        <div className="space-y-3">
          <div>
            <label className="label">Describe the transaction</label>
            <input
              className="input"
              placeholder='e.g. "spent 45 on groceries yesterday"'
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              autoFocus
            />
            {nlError && <div className="text-xs text-rose-500 mt-1.5">{nlError}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={parseNaturalLanguage}
              disabled={nlLoading || !nlText.trim()}
            >
              {nlLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Reading...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Parse
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={set("amount")}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set("type")}>
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="e.g. Weekly grocery run"
              value={form.description}
              onChange={set("description")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                max={todayStr()}
                onChange={set("date")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : initial ? "Save changes" : "Add transaction"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
