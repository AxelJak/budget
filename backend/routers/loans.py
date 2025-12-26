from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.database import Loan, LoanPayment
from models.schemas import (
    Loan as LoanSchema,
    LoanCreate,
    LoanUpdate,
    LoanWithPayments,
    LoanPayment as LoanPaymentSchema,
    LoanPaymentCreate
)

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.get("/", response_model=List[LoanSchema])
def get_loans(active_only: bool = True, db: Session = Depends(get_db)):
    """
    Hämta alla lån
    """
    query = db.query(Loan)
    if active_only:
        query = query.filter(Loan.is_active == True)
    loans = query.order_by(Loan.name).all()
    return loans


@router.get("/{loan_id}", response_model=LoanWithPayments)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    """
    Hämta ett specifikt lån med betalningar
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Lån hittades inte")
    return loan


@router.post("/", response_model=LoanSchema)
def create_loan(loan: LoanCreate, db: Session = Depends(get_db)):
    """
    Skapa nytt lån
    """
    db_loan = Loan(**loan.model_dump())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.put("/{loan_id}", response_model=LoanSchema)
def update_loan(
    loan_id: int,
    loan_update: LoanUpdate,
    db: Session = Depends(get_db)
):
    """
    Uppdatera lån
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Lån hittades inte")

    update_data = loan_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(loan, field, value)

    db.commit()
    db.refresh(loan)
    return loan


@router.delete("/{loan_id}")
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    """
    Ta bort lån
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Lån hittades inte")

    db.delete(loan)
    db.commit()
    return {"message": "Lån borttaget"}


# --- Loan Payments ---

@router.get("/{loan_id}/payments", response_model=List[LoanPaymentSchema])
def get_loan_payments(loan_id: int, db: Session = Depends(get_db)):
    """
    Hämta betalningar för ett lån
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Lån hittades inte")

    payments = db.query(LoanPayment).filter(
        LoanPayment.loan_id == loan_id
    ).order_by(LoanPayment.date.desc()).all()
    return payments


@router.post("/payments", response_model=LoanPaymentSchema)
def create_loan_payment(payment: LoanPaymentCreate, db: Session = Depends(get_db)):
    """
    Registrera betalning på lån och uppdatera saldo
    """
    loan = db.query(Loan).filter(Loan.id == payment.loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Lån hittades inte")

    # Skapa betalning
    db_payment = LoanPayment(**payment.model_dump())
    db.add(db_payment)

    # Uppdatera lånesaldo (minska med amorteringsdelen)
    if payment.principal_amount:
        loan.current_balance -= payment.principal_amount
    else:
        # Om ingen amortering specificerats, använd hela beloppet
        loan.current_balance -= payment.amount

    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.delete("/payments/{payment_id}")
def delete_loan_payment(payment_id: int, db: Session = Depends(get_db)):
    """
    Ta bort betalning
    """
    payment = db.query(LoanPayment).filter(LoanPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Betalning hittades inte")

    # Återställ lånesaldo
    loan = db.query(Loan).filter(Loan.id == payment.loan_id).first()
    if loan:
        if payment.principal_amount:
            loan.current_balance += payment.principal_amount
        else:
            loan.current_balance += payment.amount

    db.delete(payment)
    db.commit()
    return {"message": "Betalning borttagen"}
