"""
AI brain for the finance tracker.

Uses Anthropic Claude when ANTHROPIC_API_KEY is set; otherwise falls back to
deterministic rule-based responses so the app works out of the box.
"""

from __future__ import annotations

import json
import re
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.categories import CATEGORIES, CATEGORY_META
from app.config import settings
from app.models import User
from app.services import build_stats, build_summary, list_transactions, today_key


def _has_ai() -> bool:
    return bool(settings.anthropic_api_key.strip())


def _call_claude(system: str, user_message: str, max_tokens: int = 1200) -> str:
    from anthropic import Anthropic

    client = Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    parts = [block.text for block in message.content if hasattr(block, "text")]
    return "\n".join(parts).strip()


# ─── Natural language transaction parsing ───────────────────────────────────


def parse_natural_language_entry(text: str) -> dict:
    """Parse free-text like 'spent $45 on groceries yesterday' into a transaction."""
    if _has_ai():
        try:
            system = (
                "You parse natural-language finance entries into JSON. "
                'Return ONLY valid JSON with keys: amount (number), type ("Expense" or "Income"), '
                f'category (one of {CATEGORIES}), description (string), date (YYYY-MM-DD). '
                f"Today is {today_key()}."
            )
            raw = _call_claude(system, text, max_tokens=300)
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return {
                    "amount": float(data["amount"]),
                    "type": data.get("type", "Expense"),
                    "category": data.get("category", "Other"),
                    "description": data.get("description", text.strip()),
                    "date": data.get("date", today_key()),
                }
        except Exception:
            pass

    return _parse_natural_language_local(text)


def _parse_natural_language_local(text: str) -> dict:
    lowered = text.lower()
    amount_match = re.search(r"(\d+(?:\.\d+)?)", lowered)
    if not amount_match:
        raise ValueError("Couldn't find an amount — try including a number.")
    amount = float(amount_match.group(1))
    is_income = bool(
        re.search(r"\b(got paid|salary|income|earned|received|freelance payment)\b", lowered)
    )
    category = "Other"
    for c in CATEGORIES:
        if c.lower() in lowered:
            category = c
            break
    if category == "Other":
        if re.search(r"grocer|supermarket|food shop", lowered):
            category = "Groceries"
        elif re.search(r"lunch|dinner|restaurant|takeout|coffee", lowered):
            category = "Dining"
        elif re.search(r"uber|taxi|gas|fuel|bus|train", lowered):
            category = "Transport"
        elif re.search(r"rent", lowered):
            category = "Rent"
        elif re.search(r"salary|paycheck|payroll", lowered):
            category = "Salary"
    txn_date = today_key()
    if "yesterday" in lowered:
        txn_date = (date.today() - timedelta(days=1)).isoformat()
    return {
        "amount": amount,
        "type": "Income" if is_income else "Expense",
        "category": "Salary" if is_income and category == "Other" else category,
        "description": text.strip(),
        "date": txn_date,
    }


def categorize_transaction(description: str, amount: float, txn_type: str = "Expense") -> str:
    if _has_ai():
        try:
            system = (
                f"Pick the best category from {CATEGORIES} for this transaction. "
                'Reply with ONLY the category name, nothing else.'
            )
            user_msg = f"Type: {txn_type}, Amount: ${amount:.2f}, Description: {description}"
            result = _call_claude(system, user_msg, max_tokens=50).strip()
            if result in CATEGORY_META:
                return result
        except Exception:
            pass
    lowered = description.lower()
    for c in CATEGORIES:
        if c.lower() in lowered:
            return c
    return "Other"


# ─── Insights & coaching ────────────────────────────────────────────────────


def generate_weekly_report(db: Session, user: User) -> str:
    end = date.today()
    start = (end - timedelta(days=6)).isoformat()
    end_key = end.isoformat()
    prev_start = (end - timedelta(days=13)).isoformat()
    prev_end = (end - timedelta(days=7)).isoformat()

    week_rows = list_transactions(db, user.id, start=start, end=end_key)
    prev_rows = list_transactions(db, user.id, start=prev_start, end=prev_end)
    context = _finance_context(db, user, week_rows, prev_rows)

    if _has_ai():
        try:
            return _call_claude(
                "You are a friendly personal finance coach. Write a concise weekly spending report "
                "in markdown. Highlight patterns, category breakdowns, and 1-2 actionable tips. "
                "Use **bold** for emphasis. Keep it under 250 words.",
                context,
            )
        except Exception:
            pass
    return _weekly_report_fallback(week_rows, prev_rows)


def generate_recovery_plan(db: Session, user: User, category: str | None = None) -> str:
    cat = category or "Dining"
    month_start = date.today().replace(day=1).isoformat()
    rows = list_transactions(db, user.id, start=month_start)
    cat_total = sum(t.amount for t in rows if t.type == "Expense" and t.category == cat)
    context = (
        f"User {user.name} is over budget in **{cat}** this month (${cat_total:.2f} spent). "
        f"Monthly budget: ${user.monthly_budget:.0f}."
    )
    if _has_ai():
        try:
            return _call_claude(
                "You are a supportive budget coach. The user overspent in a category. "
                "Write a short 3-step recovery plan in markdown. Be empathetic, practical, "
                "and avoid shame. Under 200 words.",
                context,
            )
        except Exception:
            pass
    return (
        f"Your **{cat}** spending crossed your budget this month (${cat_total:.0f} so far). "
        "That happens — budgets are guides, not report cards.\n\n"
        "**Step 1:** Look at the next 7 days. Cap discretionary spending in this category "
        "to one planned purchase instead of several impulse ones.\n\n"
        "**Step 2:** Stock up on essentials earlier in the week so the easier default "
        "isn't the expensive one.\n\n"
        "**Step 3:** If this keeps happening, consider raising the category budget to match "
        "reality — a budget you blow past every month isn't doing its job."
    )


def suggest_budgets(
    db: Session,
    user: User,
    goals: str = "",
    spending_habits: str = "",
    struggles: str = "",
) -> list[dict]:
    stats = build_stats(db, user.id)
    context = (
        f"User: {user.name}, monthly budget: ${user.monthly_budget:.0f}\n"
        f"Goals: {goals}\nHabits: {spending_habits}\nStruggles: {struggles}\n"
        f"Last 30 days by category: {[(c.category, c.total) for c in stats.perCategory]}"
    )
    if _has_ai():
        try:
            raw = _call_claude(
                "Suggest 3 personalized budget habits. Return ONLY a JSON array of objects with keys: "
                "name, description, category, icon (emoji), reason.",
                context,
                max_tokens=800,
            )
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception:
            pass
    return _default_suggestions(stats)


def chat_about_finances(db: Session, user: User, question: str) -> str:
    context = _finance_context(db, user)
    if _has_ai():
        try:
            return _call_claude(
                "You are a helpful personal finance assistant. Answer using the user's transaction "
                "data provided. Be specific with numbers. Use markdown for emphasis. Keep answers concise.",
                f"Transaction data:\n{context}\n\nQuestion: {question}",
            )
        except Exception:
            pass
    return _chat_fallback(db, user, question)


def generate_morning_message(db: Session, user: User) -> str:
    month_start = date.today().replace(day=1).isoformat()
    summary = build_summary(db, user, start=month_start)
    stats = build_stats(db, user.id)
    top_cat = stats.perCategory[0] if stats.perCategory else None
    context = (
        f"User: {user.name}. Month spend: ${summary.totalExpense:.0f}, "
        f"budget: ${user.monthly_budget:.0f}, net savings: ${summary.netSavings:.0f}. "
        f"Top category: {top_cat.category if top_cat else 'N/A'}."
    )
    if _has_ai():
        try:
            return _call_claude(
                "Write a brief, warm morning finance motivation message (2-3 sentences). "
                "Mention pacing vs budget. Use one emoji. Markdown ok.",
                context,
                max_tokens=200,
            )
        except Exception:
            pass
    pacing = (
        "under budget"
        if summary.totalExpense < user.monthly_budget * 0.8
        else "on track"
        if summary.totalExpense <= user.monthly_budget
        else "over pace"
    )
    watch = ""
    if top_cat and top_cat.total > user.monthly_budget * 0.2:
        watch = f" One thing to watch: **{top_cat.category}** is your biggest expense this month."
    return (
        f"Good morning, {user.name}! You're at **${summary.totalExpense:.0f} spent** this month "
        f"with a net of **${summary.netSavings:.0f}** — you're pacing **{pacing}**. 💰{watch}"
    )


# ─── Helpers ────────────────────────────────────────────────────────────────


def _finance_context(db: Session, user: User, week_rows=None, prev_rows=None) -> str:
    month_start = date.today().replace(day=1).isoformat()
    summary = build_summary(db, user, start=month_start)
    lines = [
        f"User: {user.name}",
        f"Monthly budget: ${user.monthly_budget:.0f}",
        f"Month income: ${summary.totalIncome:.0f}, expense: ${summary.totalExpense:.0f}, net: ${summary.netSavings:.0f}",
    ]
    if week_rows is not None:
        week_exp = sum(t.amount for t in week_rows if t.type == "Expense")
        lines.append(f"This week: {len(week_rows)} transactions, ${week_exp:.0f} expenses")
    if prev_rows is not None:
        prev_exp = sum(t.amount for t in prev_rows if t.type == "Expense")
        lines.append(f"Prior week expenses: ${prev_exp:.0f}")
    stats = build_stats(db, user.id)
    if stats.perCategory:
        lines.append("Top categories (30d): " + ", ".join(f"{c.category} ${c.total:.0f}" for c in stats.perCategory[:5]))
    return "\n".join(lines)


def _weekly_report_fallback(week_rows, prev_rows) -> str:
    week_exp = sum(t.amount for t in week_rows if t.type == "Expense")
    prev_exp = sum(t.amount for t in prev_rows if t.type == "Expense")
    delta = ((week_exp - prev_exp) / prev_exp * 100) if prev_exp else 0
    direction = "down" if delta < 0 else "up"
    return (
        f"This week you spent **${week_exp:.0f}** across {len(week_rows)} transactions, "
        f"{direction} {abs(delta):.0f}% from last week's **${prev_exp:.0f}**.\n\n"
        "Review your top categories in the Stats page to spot where money is going. "
        "Small recurring cuts (subscriptions, dining) often add up fastest."
    )


def _chat_fallback(db: Session, user: User, question: str) -> str:
    q = question.lower().strip()
    month_start = date.today().replace(day=1).isoformat()
    summary = build_summary(db, user, start=month_start)
    stats = build_stats(db, user.id)

    if "most" in q and "category" in q:
        if not stats.perCategory:
            return "No expense data yet for this month."
        top = stats.perCategory[0]
        second = stats.perCategory[1] if len(stats.perCategory) > 1 else None
        msg = f"**{top.category}** is your top category over the last 30 days at **${top.total:.0f}**"
        if second:
            msg += f", followed by **{second.category}** at **${second.total:.0f}**."
        return msg

    if "this month" in q or "spent" in q:
        return (
            f"So far this month you've spent **${summary.totalExpense:.0f}** against "
            f"income of **${summary.totalIncome:.0f}**, for net savings of **${summary.netSavings:.0f}**."
        )

    if "budget" in q or "on track" in q:
        pct = (summary.totalExpense / user.monthly_budget * 100) if user.monthly_budget else 0
        status = "under budget" if summary.totalExpense <= user.monthly_budget else "over budget"
        return (
            f"You're tracking **{status}** — about **{pct:.0f}%** of your "
            f"**${user.monthly_budget:.0f}** monthly target used so far."
        )

    return (
        "Hi — ask me about your spending, budgets, or top categories. "
        "I have your recent transactions loaded as context."
    )


def _default_suggestions(stats) -> list[dict]:
    suggestions = [
        {
            "name": "Weekly grocery budget: $120",
            "description": "Cap grocery spend per week to reduce impulse purchases.",
            "category": "Groceries",
            "icon": "🛒",
            "reason": "Grocery spend often varies week to week — a soft weekly cap smooths that out.",
        },
        {
            "name": "Dining out budget: $150/month",
            "description": "Set a firm ceiling on restaurants and takeout.",
            "category": "Dining",
            "icon": "🍽️",
            "reason": "Dining is a common discretionary drift category — a visible cap helps.",
        },
        {
            "name": "Auto-transfer to savings on payday",
            "description": "Move money to savings when income lands, before it can be spent.",
            "category": "Investment",
            "icon": "📈",
            "reason": "Automating surplus turns leftover money into an actual savings habit.",
        },
    ]
    if stats.perCategory:
        top = stats.perCategory[0]
        suggestions[0]["reason"] = (
            f"**{top.category}** is your highest spend (${top.total:.0f}/30d) — start there."
        )
    return suggestions
