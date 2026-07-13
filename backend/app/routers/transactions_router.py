from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Transaction, User
from app.schemas import (
    SummaryOut,
    TransactionCreate,
    TransactionOut,
    TransactionUpdate,
    transaction_to_out,
)
from app.services import (
    apply_category_defaults,
    build_heatmap,
    build_stats,
    build_summary,
    list_transactions,
    today_key,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
def get_transactions(
    start: str | None = Query(None),
    end: str | None = Query(None),
    category: str | None = Query(None),
    type: str | None = Query(None),
    query: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = list_transactions(
        db, user.id, start=start, end=end, category=category, type_=type, query=query
    )
    return [transaction_to_out(t) for t in rows]


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = apply_category_defaults(body.model_dump())
    txn = Transaction(
        user_id=user.id,
        amount=data["amount"],
        type=data.get("type") or "Expense",
        category=data["category"],
        description=data.get("description") or "",
        date=data.get("date") or today_key(),
        icon=data["icon"],
        color=data["color"],
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return transaction_to_out(txn)


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = db.get(Transaction, transaction_id)
    if txn is None or txn.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(txn, key, value)
    if "category" in updates and "icon" not in updates:
        meta = apply_category_defaults({"category": txn.category})
        txn.icon = meta["icon"]
        txn.color = meta["color"]
    db.commit()
    db.refresh(txn)
    return transaction_to_out(txn)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = db.get(Transaction, transaction_id)
    if txn is None or txn.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"message": "Deleted"}


@router.get("/today", response_model=list[TransactionOut])
def today_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = list_transactions(db, user.id, start=today_key(), end=today_key())
    return [transaction_to_out(t) for t in rows]


@router.get("/heatmap")
def heatmap(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_heatmap(db, user.id)


@router.get("/summary", response_model=SummaryOut)
def summary(
    start: str | None = Query(None),
    end: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_summary(db, user, start=start, end=end)


@router.get("/stats")
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_stats(db, user.id)
