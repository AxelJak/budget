from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.database import Savings, SavingsTransaction
from models.schemas import (
    Savings as SavingsSchema,
    SavingsCreate,
    SavingsUpdate,
    SavingsWithTransactions,
    SavingsTransaction as SavingsTransactionSchema,
    SavingsTransactionCreate
)

router = APIRouter(prefix="/api/savings", tags=["savings"])


@router.get("/", response_model=List[SavingsSchema])
def get_savings(active_only: bool = True, db: Session = Depends(get_db)):
    """
    Hämta alla sparkonton
    """
    query = db.query(Savings)
    if active_only:
        query = query.filter(Savings.is_active == True)
    savings = query.order_by(Savings.name).all()
    return savings


@router.get("/{savings_id}", response_model=SavingsWithTransactions)
def get_savings_account(savings_id: int, db: Session = Depends(get_db)):
    """
    Hämta ett specifikt sparkonto med transaktioner
    """
    savings = db.query(Savings).filter(Savings.id == savings_id).first()
    if not savings:
        raise HTTPException(status_code=404, detail="Sparkonto hittades inte")
    return savings


@router.post("/", response_model=SavingsSchema)
def create_savings(savings: SavingsCreate, db: Session = Depends(get_db)):
    """
    Skapa nytt sparkonto
    """
    db_savings = Savings(**savings.model_dump())
    db.add(db_savings)
    db.commit()
    db.refresh(db_savings)
    return db_savings


@router.put("/{savings_id}", response_model=SavingsSchema)
def update_savings(
    savings_id: int,
    savings_update: SavingsUpdate,
    db: Session = Depends(get_db)
):
    """
    Uppdatera sparkonto
    """
    savings = db.query(Savings).filter(Savings.id == savings_id).first()
    if not savings:
        raise HTTPException(status_code=404, detail="Sparkonto hittades inte")

    update_data = savings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(savings, field, value)

    db.commit()
    db.refresh(savings)
    return savings


@router.delete("/{savings_id}")
def delete_savings(savings_id: int, db: Session = Depends(get_db)):
    """
    Ta bort sparkonto
    """
    savings = db.query(Savings).filter(Savings.id == savings_id).first()
    if not savings:
        raise HTTPException(status_code=404, detail="Sparkonto hittades inte")

    db.delete(savings)
    db.commit()
    return {"message": "Sparkonto borttaget"}


# --- Savings Transactions ---

@router.get("/{savings_id}/transactions", response_model=List[SavingsTransactionSchema])
def get_savings_transactions(savings_id: int, db: Session = Depends(get_db)):
    """
    Hämta transaktioner för ett sparkonto
    """
    savings = db.query(Savings).filter(Savings.id == savings_id).first()
    if not savings:
        raise HTTPException(status_code=404, detail="Sparkonto hittades inte")

    transactions = db.query(SavingsTransaction).filter(
        SavingsTransaction.savings_id == savings_id
    ).order_by(SavingsTransaction.date.desc()).all()
    return transactions


@router.post("/transactions", response_model=SavingsTransactionSchema)
def create_savings_transaction(transaction: SavingsTransactionCreate, db: Session = Depends(get_db)):
    """
    Registrera transaktion på sparkonto och uppdatera saldo
    """
    savings = db.query(Savings).filter(Savings.id == transaction.savings_id).first()
    if not savings:
        raise HTTPException(status_code=404, detail="Sparkonto hittades inte")

    # Skapa transaktion
    db_transaction = SavingsTransaction(**transaction.model_dump())
    db.add(db_transaction)

    # Uppdatera saldo (positivt belopp = ökning, negativt = minskning)
    savings.current_balance += transaction.amount

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.delete("/transactions/{transaction_id}")
def delete_savings_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Ta bort transaktion
    """
    transaction = db.query(SavingsTransaction).filter(SavingsTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion hittades inte")

    # Återställ saldo
    savings = db.query(Savings).filter(Savings.id == transaction.savings_id).first()
    if savings:
        savings.current_balance -= transaction.amount

    db.delete(transaction)
    db.commit()
    return {"message": "Transaktion borttagen"}
