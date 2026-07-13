import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCurrency } from "../context/CurrencyContext.jsx";


export default function TransactionCard({ transaction: t, onEdit, onDelete }) {
  const { fmtExact } = useCurrency();
  const [menu, setMenu] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuWidth = 140;
  const menuHeight = 92;

  useLayoutEffect(() => {
    if (!menu || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const flipUp = rect.bottom + menuHeight + 8 > window.innerHeight;
    setPos({
      top: flipUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: rect.right - menuWidth,
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const isIncome = t.type === "Income";

  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: `${t.color}26`, color: t.color }}
      >
        {t.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{t.description}</div>
          <span className="chip">{t.category}</span>
        </div>
        <div className="text-sm text-muted mt-0.5">{t.date}</div>
      </div>

      <div
        className={`font-semibold shrink-0 ${
          isIncome ? "text-emerald-500" : "text-[var(--text)]"
        }`}
      >
        {isIncome ? "+" : "-"}
        {fmtExact(t.amount)}
      </div>

      <div className="relative">
        <button
          ref={triggerRef}
          className="btn-ghost p-2"
          onClick={() => setMenu((m) => !m)}
          aria-label="Transaction options"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>

        {menu &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setMenu(false)} />
              <div
                className="fixed z-[110] glass-strong rounded-xl py-1 w-36 shadow-xl animate-fade-in"
                style={{ top: pos.top, left: pos.left }}
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-soft hover:bg-[var(--surface-hover)]"
                  onClick={() => {
                    setMenu(false);
                    onEdit();
                  }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10"
                  onClick={() => {
                    setMenu(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>,
            document.body
          )}
      </div>
    </div>
  );
}
