from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models.database import Transaction, Category
from models.schemas import Transaction as TransactionSchema, TransactionUpdate, ImportResponse
from services.csv_parser import parse_seb_csv
from services.categorizer import TransactionCategorizer
from services.period_calculator import PeriodCalculator

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("/import", response_model=ImportResponse)
async def import_csv(
    file: UploadFile = File(...),
    auto_categorize: bool = True,
    db: Session = Depends(get_db)
):
    """
    Importera transaktioner från SEB CSV-fil
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Endast CSV-filer är tillåtna")

    try:
        # Läs fil
        content = await file.read()
        content_str = content.decode('utf-8')

        # Parsa CSV
        transactions_data = parse_seb_csv(content_str)

        imported = 0
        duplicates = 0
        errors = 0

        # Initiera kategoriserare om auto_categorize är på
        categorizer = TransactionCategorizer(db) if auto_categorize else None

        for trans_data in transactions_data:
            try:
                # Kolla om transaktionen redan finns (dubblettcheck)
                existing = db.query(Transaction).filter(
                    Transaction.import_hash == trans_data['import_hash']
                ).first()

                if existing:
                    duplicates += 1
                    continue

                # Kategorisera automatiskt om möjligt
                if categorizer and not trans_data.get('category_id'):
                    category_id = categorizer.categorize(trans_data['description'])
                    trans_data['category_id'] = category_id

                # Skapa transaktion
                transaction = Transaction(**trans_data)
                db.add(transaction)
                imported += 1

            except Exception as e:
                errors += 1
                print(f"Error importing transaction: {e}")
                continue

        db.commit()

        return ImportResponse(
            imported=imported,
            duplicates=duplicates,
            errors=errors,
            message=f"Importerade {imported} transaktioner, {duplicates} dubbletter hoppades över, {errors} fel"
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fel vid import: {str(e)}")


@router.get("/", response_model=List[TransactionSchema])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Hämta transaktioner med filtrering
    """
    query = db.query(Transaction).order_by(Transaction.date.desc())

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    transactions = query.offset(skip).limit(limit).all()
    return transactions


@router.get("/current-period", response_model=List[TransactionSchema])
def get_current_period_transactions(db: Session = Depends(get_db)):
    """
    Hämta transaktioner för aktuell löneperiod (25:e till 24:e)
    """
    calc = PeriodCalculator()
    start_date, end_date = calc.get_current_period()

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        .order_by(Transaction.date.desc())
        .all()
    )

    return transactions


@router.get("/{transaction_id}", response_model=TransactionSchema)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Hämta en specifik transaktion
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion hittades inte")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    learn: bool = Query(True, description="Skapa regel från manuell kategorisering"),
    db: Session = Depends(get_db)
):
    """
    Uppdatera en transaktion (t.ex. ändra kategori)
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion hittades inte")

    # Uppdatera fält
    if transaction_update.category_id is not None:
        old_category = transaction.category_id
        transaction.category_id = transaction_update.category_id
        transaction.is_manually_categorized = True

        # Lär från manuell kategorisering
        if learn and transaction_update.category_id != old_category:
            categorizer = TransactionCategorizer(db)
            categorizer.learn_from_manual_categorization(
                transaction.description,
                transaction_update.category_id
            )

    if transaction_update.description is not None:
        transaction.description = transaction_update.description

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Ta bort en transaktion
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion hittades inte")

    db.delete(transaction)
    db.commit()
    return {"message": "Transaktion borttagen"}
