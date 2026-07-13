"""Seed demo user and 90 days of sample transactions on first run."""

import math
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.categories import CATEGORY_META
from app.models import Transaction, User

RECURRING = [
    {"category": "Rent", "amount": 1450, "day_of_month": 1, "description": "Monthly rent"},
    {"category": "Salary", "amount": 4200, "type": "Income", "day_of_month": 1, "description": "Paycheck"},
    {"category": "Subscriptions", "amount": 15.99, "day_of_month": 3, "description": "Streaming service"},
    {"category": "Subscriptions", "amount": 9.99, "day_of_month": 5, "description": "Cloud storage"},
    {"category": "Utilities", "amount": 120, "day_of_month": 8, "description": "Electricity & water"},
]

DAILY_POOL = [
    {"category": "Groceries", "min": 20, "max": 90, "description": "Grocery run", "freq": 0.35},
    {"category": "Dining", "min": 8, "max": 45, "description": "Lunch out", "freq": 0.4},
    {"category": "Transport", "min": 3, "max": 30, "description": "Rideshare / transit", "freq": 0.3},
    {"category": "Entertainment", "min": 10, "max": 60, "description": "Movies / streaming buy", "freq": 0.1},
    {"category": "Shopping", "min": 15, "max": 150, "description": "Online order", "freq": 0.15},
    {"category": "Health", "min": 10, "max": 80, "description": "Pharmacy", "freq": 0.08},
]


def _seeded_random(seed: int) -> float:
    return (math.sin(seed) * 10000) % 1


def seed_if_empty(db: Session) -> None:
    if db.query(User).first():
        return

    user = User(
        id="u_demo_alex",
        name="Alex Rivera",
        email="alex@example.com",
        password_hash=hash_password("demo1234"),
        avatar="A",
        morning_motivation=True,
        monthly_budget=2600.0,
    )
    db.add(user)
    db.flush()

    today = date.today()
    txns: list[Transaction] = []

    for i in range(89, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        dom = d.day

        for r in RECURRING:
            if dom == r["day_of_month"]:
                meta = CATEGORY_META[r["category"]]
                txns.append(
                    Transaction(
                        user_id=user.id,
                        amount=r["amount"],
                        type=r.get("type", "Expense"),
                        category=r["category"],
                        description=r["description"],
                        date=key,
                        icon=meta["icon"],
                        color=meta["color"],
                    )
                )

        for pi, p in enumerate(DAILY_POOL):
            seed = i * 97 + pi * 131
            if _seeded_random(seed) < p["freq"]:
                amt = round(p["min"] + _seeded_random(seed + 1) * (p["max"] - p["min"]), 2)
                meta = CATEGORY_META[p["category"]]
                txns.append(
                    Transaction(
                        user_id=user.id,
                        amount=amt,
                        type="Expense",
                        category=p["category"],
                        description=p["description"],
                        date=key,
                        icon=meta["icon"],
                        color=meta["color"],
                    )
                )

    txns.append(
        Transaction(
            user_id=user.id,
            amount=350,
            type="Income",
            category="Freelance",
            description="Logo design gig",
            date=(today - timedelta(days=12)).isoformat(),
            icon=CATEGORY_META["Freelance"]["icon"],
            color=CATEGORY_META["Freelance"]["color"],
        )
    )
    txns.append(
        Transaction(
            user_id=user.id,
            amount=120,
            type="Income",
            category="Investment",
            description="Dividend payout",
            date=(today - timedelta(days=22)).isoformat(),
            icon=CATEGORY_META["Investment"]["icon"],
            color=CATEGORY_META["Investment"]["color"],
        )
    )

    db.add_all(txns)
    db.commit()
