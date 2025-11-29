from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    name: str
    type: str = Field(..., pattern="^(income|fixed|variable)$")
    budget_limit: Optional[float] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(income|fixed|variable)$")
    budget_limit: Optional[float] = None
    color: Optional[str] = None


class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryRuleBase(BaseModel):
    category_id: int
    pattern: str
    pattern_type: str = "substring"
    priority: int = 0


class CategoryRuleCreate(CategoryRuleBase):
    pass


class CategoryRule(CategoryRuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: datetime
    description: str
    amount: float
    balance: Optional[float] = None
    category_id: Optional[int] = None
    account_name: str = "SEB"


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    description: Optional[str] = None


class Transaction(TransactionBase):
    id: int
    import_hash: str
    is_manually_categorized: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None

    class Config:
        from_attributes = True


class PeriodBase(BaseModel):
    start_date: datetime
    end_date: datetime


class Period(PeriodBase):
    id: int
    total_income: float
    total_expenses: float
    total_fixed: float
    total_variable: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImportResponse(BaseModel):
    imported: int
    duplicates: int
    errors: int
    message: str


class BulkCategorizeRequest(BaseModel):
    transaction_ids: list[int]
    category_id: Optional[int] = None
