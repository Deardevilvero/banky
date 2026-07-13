from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai_features import (
    chat_about_finances,
    generate_morning_message,
    generate_recovery_plan,
    generate_weekly_report,
    parse_natural_language_entry,
    suggest_budgets,
)
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import (
    AIContentResponse,
    ChatRequest,
    ParseTransactionRequest,
    ParseTransactionResponse,
    RecoveryPlanRequest,
    SuggestBudgetsRequest,
    SuggestBudgetsResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/weekly-report", response_model=AIContentResponse)
def weekly_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AIContentResponse(content=generate_weekly_report(db, user))


@router.post("/suggest-budgets", response_model=SuggestBudgetsResponse)
def budget_suggestions(
    body: SuggestBudgetsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = suggest_budgets(db, user, body.goals, body.spendingHabits, body.struggles)
    return SuggestBudgetsResponse(suggestions=items)


@router.post("/recovery-plan", response_model=AIContentResponse)
def recovery_plan(
    body: RecoveryPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIContentResponse(content=generate_recovery_plan(db, user, body.category))


@router.post("/chat", response_model=AIContentResponse)
def chat(body: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AIContentResponse(content=chat_about_finances(db, user, body.question))


@router.get("/morning", response_model=AIContentResponse)
def morning(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AIContentResponse(content=generate_morning_message(db, user))


@router.post("/parse-transaction", response_model=ParseTransactionResponse)
def parse_transaction(body: ParseTransactionRequest):
    result = parse_natural_language_entry(body.text)
    return ParseTransactionResponse(**result)
