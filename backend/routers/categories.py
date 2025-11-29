from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.database import Category, CategoryRule
from models.schemas import (
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate,
    CategoryRule as CategoryRuleSchema,
    CategoryRuleCreate
)

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """
    Hämta alla kategorier
    """
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@router.post("/", response_model=CategorySchema)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """
    Skapa ny kategori
    """
    # Kolla om kategorin redan finns
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategorin finns redan")

    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """
    Uppdatera kategori
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori hittades inte")

    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """
    Ta bort kategori
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori hittades inte")

    db.delete(category)
    db.commit()
    return {"message": "Kategori borttagen"}


# --- Category Rules ---

@router.get("/{category_id}/rules", response_model=List[CategoryRuleSchema])
def get_category_rules(category_id: int, db: Session = Depends(get_db)):
    """
    Hämta regler för en kategori
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori hittades inte")

    return category.rules


@router.post("/rules", response_model=CategoryRuleSchema)
def create_category_rule(rule: CategoryRuleCreate, db: Session = Depends(get_db)):
    """
    Skapa ny kategoriseringsregel
    """
    # Verifiera att kategorin finns
    category = db.query(Category).filter(Category.id == rule.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori hittades inte")

    db_rule = CategoryRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.delete("/rules/{rule_id}")
def delete_category_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Ta bort kategoriseringsregel
    """
    rule = db.query(CategoryRule).filter(CategoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regel hittades inte")

    db.delete(rule)
    db.commit()
    return {"message": "Regel borttagen"}
