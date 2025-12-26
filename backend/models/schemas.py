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


class LoanBase(BaseModel):
    name: str
    initial_amount: float
    current_balance: float
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    start_date: datetime
    description: Optional[str] = None
    is_active: bool = True


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    name: Optional[str] = None
    current_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Loan(LoanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoanPaymentBase(BaseModel):
    loan_id: int
    date: datetime
    amount: float
    principal_amount: Optional[float] = None
    interest_amount: Optional[float] = None
    description: Optional[str] = None


class LoanPaymentCreate(LoanPaymentBase):
    pass


class LoanPayment(LoanPaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoanWithPayments(Loan):
    payments: list[LoanPayment] = []


class SavingsBase(BaseModel):
    name: str
    current_balance: float
    account_type: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class SavingsCreate(SavingsBase):
    pass


class SavingsUpdate(BaseModel):
    name: Optional[str] = None
    current_balance: Optional[float] = None
    account_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Savings(SavingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SavingsTransactionBase(BaseModel):
    savings_id: int
    date: datetime
    amount: float
    transaction_type: str = Field(..., pattern="^(deposit|withdrawal|interest)$")
    description: Optional[str] = None


class SavingsTransactionCreate(SavingsTransactionBase):
    pass


class SavingsTransaction(SavingsTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsWithTransactions(Savings):
    transactions: list[SavingsTransaction] = []
