from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    _id: str
    name: str
    email: str
    avatar: str
    morningMotivation: bool
    monthlyBudget: float

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
    token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=4)


class ProfileUpdate(BaseModel):
    name: str | None = None
    morningMotivation: bool | None = None
    monthlyBudget: float | None = None


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    type: Literal["Expense", "Income"] = "Expense"
    category: str = "Other"
    description: str = ""
    date: str | None = None
    icon: str | None = None
    color: str | None = None


class TransactionUpdate(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    type: Literal["Expense", "Income"] | None = None
    category: str | None = None
    description: str | None = None
    date: str | None = None
    icon: str | None = None
    color: str | None = None


class TransactionOut(BaseModel):
    _id: str
    userId: str
    amount: float
    type: str
    category: str
    description: str
    date: str
    icon: str
    color: str
    createdAt: str


class HeatmapDay(BaseModel):
    date: str
    count: int


class SummaryOut(BaseModel):
    totalIncome: float
    totalExpense: float
    netSavings: float
    count: int
    noSpendStreak: int
    budget: float


class CategoryStat(BaseModel):
    category: str
    total: float
    count: int
    icon: str
    color: str


class StatsOut(BaseModel):
    perCategory: list[CategoryStat]


class ChatRequest(BaseModel):
    question: str


class AIContentResponse(BaseModel):
    content: str


class SuggestBudgetsRequest(BaseModel):
    goals: str = ""
    spendingHabits: str = ""
    struggles: str = ""


class BudgetSuggestion(BaseModel):
    name: str
    description: str
    category: str
    icon: str
    reason: str


class SuggestBudgetsResponse(BaseModel):
    suggestions: list[BudgetSuggestion]


class RecoveryPlanRequest(BaseModel):
    category: str | None = None


class ParseTransactionRequest(BaseModel):
    text: str


class ParseTransactionResponse(BaseModel):
    amount: float
    type: Literal["Expense", "Income"]
    category: str
    description: str
    date: str


def user_to_out(user) -> UserOut:
    return UserOut(
        _id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        morningMotivation=user.morning_motivation,
        monthlyBudget=user.monthly_budget,
    )


def transaction_to_out(txn) -> TransactionOut:
    return TransactionOut(
        _id=txn.id,
        userId=txn.user_id,
        amount=txn.amount,
        type=txn.type,
        category=txn.category,
        description=txn.description,
        date=txn.date,
        icon=txn.icon,
        color=txn.color,
        createdAt=txn.created_at.isoformat() if isinstance(txn.created_at, datetime) else str(txn.created_at),
    )
