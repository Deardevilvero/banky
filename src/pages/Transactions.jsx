import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import TransactionCard from "../components/TransactionCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { CATEGORIES, TYPES } from "../utils/constants.js";
import { useCurrency } from "../context/CurrencyContext.jsx";

export default function Transactions() {
  const { fmtExact } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (type !== "All" && t.type !== type) return false;
      if (q && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, query, category, type]);

  const totalIncome = filtered
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + t.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setFormOpen(true);
  };

  const save = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/transactions/${editing._id}`, data);
      } else {
        await api.post("/transactions", data);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (t) => {
    await api.delete(`/transactions/${t._id}`);
    setDeleteTarget(null);
    await load();
  };

  if (loading) return <LoadingSpinner full />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            All transactions
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Every transaction you've ever logged.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add transaction
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
            />
            <input
              className="input pl-9"
              placeholder="Search transactions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input md:w-48"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="inline-flex rounded-xl glass overflow-hidden text-sm">
            {["All", ...TYPES].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3.5 py-2.5 font-medium transition ${
                  t !== "All" ? "border-l divider" : ""
                } ${
                  type === t
                    ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                    : "text-soft hover:bg-[var(--surface-hover)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex gap-4 text-xs text-muted mt-3 pt-3 border-t divider">
            <span>{filtered.length} transactions</span>
            <span className="text-emerald-500">
              +{fmtExact(totalIncome)} income
            </span>
            <span className="text-rose-500">
              -{fmtExact(totalExpense)} expense
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <div className="font-medium">
            {transactions.length === 0 ? "No transactions yet" : "No transactions match your filter"}
          </div>
          <div className="text-sm text-muted mt-1">
            {transactions.length === 0
              ? "Add your first transaction to start tracking."
              : "Try clearing your search or filters."}
          </div>
          {transactions.length === 0 && (
            <button className="btn-primary mt-4" onClick={openAdd}>
              <Plus size={14} />
              Add transaction
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TransactionCard
              key={t._id}
              transaction={t}
              onEdit={() => openEdit(t)}
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit transaction" : "New transaction"}
      >
        <TransactionForm
          initial={editing}
          submitting={submitting}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={save}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete transaction?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-soft">
          This will permanently delete <b>{deleteTarget?.description}</b>. This can't be
          undone.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
            onClick={() => remove(deleteTarget)}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
