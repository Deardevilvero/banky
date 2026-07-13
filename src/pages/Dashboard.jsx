import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import TransactionCard from "../components/TransactionCard.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import HeatmapChart from "../components/HeatmapChart.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import AIWeeklyReport from "../components/AIWeeklyReport.jsx";
import DailyTip from "../components/DailyTip.jsx";
import BudgetSuggestionModal from "../components/BudgetSuggestionModal.jsx";
import BudgetAlertCard from "../components/BudgetAlertCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { celebrate } from "../utils/confetti.js";
import { weekKeys } from "../utils/dateHelpers.js";
import { useAuth } from "../context/AuthContext.jsx";

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [todayTxns, setTodayTxns] = useState([]);
  const [weekTxns, setWeekTxns] = useState([]);
  const [monthTxns, setMonthTxns] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const week = weekKeys();
      const start = week[0].key;
      const end = week[week.length - 1].key;

      const [todayRes, weekRes, monthRes, heatRes] = await Promise.all([
        api.get("/transactions/today"),
        api.get("/transactions", { params: { start, end } }),
        api.get("/transactions", { params: { start: monthStart() } }),
        api.get("/transactions/heatmap"),
      ]);

      setTodayTxns(todayRes.data);
      setWeekTxns(weekRes.data);
      setMonthTxns(monthRes.data);
      setHeatmap(heatRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const income = useMemo(
    () => monthTxns.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const expense = useMemo(
    () => monthTxns.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const net = income - expense;
  const savingsRate = income ? Math.max(0, Math.round((net / income) * 100)) : 0;

  const topCategory = useMemo(() => {
    const byCat = {};
    for (const t of monthTxns) {
      if (t.type !== "Expense") continue;
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    }
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return entries[0] ? { category: entries[0][0], total: entries[0][1] } : null;
  }, [monthTxns]);

  const overBudget =
    !alertDismissed &&
    user?.monthlyBudget &&
    expense > user.monthlyBudget * 0.9 &&
    topCategory;

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
        celebrate();
      }
      setFormOpen(false);
      setEditing(null);
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (t) => {
    await api.delete(`/transactions/${t._id}`);
    setDeleteTarget(null);
    await loadAll();
  };

  const acceptSuggestion = async () => {
    // In this boilerplate, "accepting" a budget suggestion just closes the
    // loop visually — wire this up to a real budgets endpoint when the
    // backend is connected.
  };

  if (loading) return <LoadingSpinner full />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Hey {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setSuggestOpen(true)}>
            <Sparkles size={14} />
            <span className="hidden sm:inline">Suggest a budget</span>
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={14} />
            Add transaction
          </button>
        </div>
      </div>

      <DailyTip />

      {overBudget && (
        <BudgetAlertCard
          category={topCategory.category}
          overspend={Math.round(expense - user.monthlyBudget)}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      <SummaryCards income={income} expense={expense} net={net} savingsRate={savingsRate} />

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium">Today's transactions</div>
            <div className="text-xs text-muted">
              {todayTxns.length} logged today
            </div>
          </div>
        </div>

        {todayTxns.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">💸</div>
            <div className="font-medium">Nothing logged today yet</div>
            <div className="text-sm text-muted mt-1">
              Add a transaction as it happens to keep your data accurate.
            </div>
            <button className="btn-primary mt-4" onClick={openAdd}>
              <Plus size={14} />
              Add transaction
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTxns.map((t) => (
              <TransactionCard
                key={t._id}
                transaction={t}
                onEdit={() => openEdit(t)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
          </div>
        )}
      </div>

      <AIWeeklyReport />

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="col-span-8">
          <WeeklyGrid transactions={weekTxns} />
        </div>
        <div className="col-span-4">
          <HeatmapChart data={heatmap} />
        </div>
      </div>

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

      <BudgetSuggestionModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onAccept={acceptSuggestion}
      />
    </div>
  );
}
