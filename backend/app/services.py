from datetime import date, timedelta

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.categories import CATEGORY_META
from app.models import Transaction, User
from app.schemas import CategoryStat, HeatmapDay, SummaryOut, StatsOut, transaction_to_out


def today_key() -> str:
    return date.today().isoformat()


def apply_category_defaults(data: dict) -> dict:
    category = data.get("category") or "Other"
    meta = CATEGORY_META.get(category, CATEGORY_META["Other"])
    data.setdefault("icon", meta["icon"])
    data.setdefault("color", meta["color"])
    data["category"] = category
    return data


def list_transactions(
    db: Session,
    user_id: str,
    *,
    start: str | None = None,
    end: str | None = None,
    category: str | None = None,
    type_: str | None = None,
    query: str | None = None,
) -> list:
    q = db.query(Transaction).filter(Transaction.user_id == user_id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category:
        q = q.filter(Transaction.category == category)
    if type_:
        q = q.filter(Transaction.type == type_)
    rows = q.order_by(Transaction.date.desc(), Transaction.created_at.desc()).all()
    if query:
        needle = query.lower()
        rows = [t for t in rows if needle in (t.description or "").lower()]
    return rows


def no_spend_streak(db: Session, user_id: str) -> int:
    spend_dates = {
        t.date
        for t in db.query(Transaction).filter(
            and_(Transaction.user_id == user_id, Transaction.type == "Expense")
        )
    }
    today = date.today()
    yesterday = today - timedelta(days=1)
    if today.isoformat() in spend_dates or yesterday.isoformat() in spend_dates:
        return 0
    cursor = yesterday - timedelta(days=1)
    streak = 0
    while cursor.isoformat() not in spend_dates:
        streak += 1
        cursor -= timedelta(days=1)
        if streak > 400:
            break
    return streak


def build_heatmap(db: Session, user_id: str) -> list[HeatmapDay]:
    end = date.today()
    days: list[HeatmapDay] = []
    for i in range(89, -1, -1):
        d = end - timedelta(days=i)
        key = d.isoformat()
        total = sum(
            t.amount
            for t in db.query(Transaction).filter(
                and_(Transaction.user_id == user_id, Transaction.date == key, Transaction.type == "Expense")
            )
        )
        days.append(HeatmapDay(date=key, count=round(total)))
    return days


def build_summary(
    db: Session,
    user: User,
    *,
    start: str | None = None,
    end: str | None = None,
) -> SummaryOut:
    rows = list_transactions(db, user.id, start=start, end=end)
    income = sum(t.amount for t in rows if t.type == "Income")
    expense = sum(t.amount for t in rows if t.type == "Expense")
    return SummaryOut(
        totalIncome=round(income, 2),
        totalExpense=round(expense, 2),
        netSavings=round(income - expense, 2),
        count=len(rows),
        noSpendStreak=no_spend_streak(db, user.id),
        budget=user.monthly_budget,
    )


def build_stats(db: Session, user_id: str) -> StatsOut:
    start30 = (date.today() - timedelta(days=29)).isoformat()
    rows = list_transactions(db, user_id, start=start30)
    by_category: dict[str, dict] = {}
    for t in rows:
        if t.type != "Expense":
            continue
        if t.category not in by_category:
            by_category[t.category] = {"category": t.category, "total": 0.0, "count": 0}
        by_category[t.category]["total"] += t.amount
        by_category[t.category]["count"] += 1

    per_category = []
    for c in by_category.values():
        meta = CATEGORY_META.get(c["category"], CATEGORY_META["Other"])
        per_category.append(
            CategoryStat(
                category=c["category"],
                total=round(c["total"], 2),
                count=c["count"],
                icon=meta["icon"],
                color=meta["color"],
            )
        )
    per_category.sort(key=lambda x: x.total, reverse=True)
    return StatsOut(perCategory=per_category)


def transactions_context(db: Session, user_id: str, days: int = 90) -> str:
    start = (date.today() - timedelta(days=days - 1)).isoformat()
    rows = list_transactions(db, user_id, start=start)
    if not rows:
        return "No transactions in the last 90 days."
    lines = []
    for t in rows[:200]:
        lines.append(f"{t.date} | {t.type} | {t.category} | ${t.amount:.2f} | {t.description}")
    return "\n".join(lines)
