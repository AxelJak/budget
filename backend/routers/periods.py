from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime

from database import get_db
from models.database import Transaction, Category
from models.schemas import Period as PeriodSchema
from services.period_calculator import PeriodCalculator

router = APIRouter(prefix="/api/periods", tags=["periods"])


@router.get("/current")
def get_current_period_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Hämta summering för aktuell löneperiod
    """
    calc = PeriodCalculator()
    start_date, end_date = calc.get_current_period()

    return _get_period_summary(db, start_date, end_date)


@router.get("/summary")
def get_period_summary(
    start_date: datetime = Query(..., description="Periodstart (ISO format)"),
    end_date: datetime = Query(..., description="Periodslut (ISO format)"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Hämta summering för specifik period
    """
    return _get_period_summary(db, start_date, end_date)


@router.get("/list")
def list_periods(
    limit: int = 12,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Lista de senaste perioderna med summering
    """
    calc = PeriodCalculator()
    current_start, current_end = calc.get_current_period()

    periods = []
    start_date, end_date = current_start, current_end

    for _ in range(limit):
        summary = _get_period_summary(db, start_date, end_date)
        periods.append(summary)

        # Gå till föregående period
        start_date, end_date = calc.get_previous_period(start_date)

    return periods


def _get_period_summary(
    db: Session,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """
    Beräkna summering för en period
    """
    calc = PeriodCalculator()

    # Hämta alla transaktioner i perioden
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        .all()
    )

    # Beräkna summor
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = abs(sum(t.amount for t in transactions if t.amount < 0))

    # Summera per kategori
    category_summary = {}
    total_fixed = 0.0
    total_variable = 0.0

    for transaction in transactions:
        if transaction.amount >= 0:  # Hoppa över inkomster
            continue

        category_id = transaction.category_id or 0  # 0 = okategoriserad
        amount = abs(transaction.amount)

        if category_id not in category_summary:
            category = None
            if category_id != 0:
                category = db.query(Category).filter(Category.id == category_id).first()

            category_summary[category_id] = {
                'category_id': category_id,
                'category_name': category.name if category else 'Okategoriserad',
                'category_type': category.type if category else 'variable',
                'total': 0.0,
                'budget_limit': category.budget_limit if category else None,
                'color': category.color if category else '#94a3b8'
            }

        category_summary[category_id]['total'] += amount

        # Summera fixed vs variable
        if category_id != 0:
            category = db.query(Category).filter(Category.id == category_id).first()
            if category and category.type == 'fixed':
                total_fixed += amount
            else:
                total_variable += amount
        else:
            total_variable += amount

    # Konvertera till lista
    categories = list(category_summary.values())

    # Sortera efter belopp
    categories.sort(key=lambda x: x['total'], reverse=True)

    return {
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'period_name': calc.format_period(start_date, end_date),
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_fixed': total_fixed,
        'total_variable': total_variable,
        'net': total_income - total_expenses,
        'categories': categories,
        'transaction_count': len(transactions)
    }
