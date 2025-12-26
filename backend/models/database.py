from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Category(Base):
    """Kategorier för transaktioner"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)  # 'income', 'fixed', 'variable'
    budget_limit = Column(Float, nullable=True)  # Budgettak per period
    color = Column(String, nullable=True)  # Hex-färg för visualisering
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="category")
    rules = relationship("CategoryRule", back_populates="category", cascade="all, delete-orphan")


class CategoryRule(Base):
    """Regler för automatisk kategorisering"""
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    pattern = Column(String, nullable=False)  # Text att matcha mot beskrivning
    pattern_type = Column(String, default="substring")  # 'substring' eller 'regex'
    priority = Column(Integer, default=0)  # Högre nummer = högre prioritet
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="rules")


class Transaction(Base):
    """Banktransaktioner"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    balance = Column(Float, nullable=True)  # Saldo efter transaktion
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    account_name = Column(String, default="SEB")  # För framtida multi-account support

    # För dubblettdetektering
    import_hash = Column(String, unique=True, index=True)  # Hash av datum+belopp+beskrivning

    # Metadata
    is_manually_categorized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="transactions")


class Period(Base):
    """Summering per löneperiod (25:e till 24:e)"""
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False)

    # Sammanfattning (cache för snabbare visning)
    total_income = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    total_fixed = Column(Float, default=0.0)
    total_variable = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Loan(Base):
    """Lån som ska spåras"""
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Huslån", "Billån", "Lån från pappa"
    initial_amount = Column(Float, nullable=False)  # Ursprungligt lånebelopp
    current_balance = Column(Float, nullable=False)  # Aktuellt saldo
    interest_rate = Column(Float, nullable=True)  # Ränta i procent (t.ex. 2.5)
    monthly_payment = Column(Float, nullable=True)  # Fast månadsbelopp
    start_date = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)  # För att kunna markera avslutade lån
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = relationship("LoanPayment", back_populates="loan", cascade="all, delete-orphan")


class LoanPayment(Base):
    """Betalningar på lån"""
    __tablename__ = "loan_payments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    principal_amount = Column(Float, nullable=True)  # Amortering
    interest_amount = Column(Float, nullable=True)  # Ränta
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="payments")


class Savings(Base):
    """Sparkonton"""
    __tablename__ = "savings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Gemensamt sparkonto"
    current_balance = Column(Float, nullable=False)
    account_type = Column(String, nullable=True)  # "Sparkonto", "Fond", etc.
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("SavingsTransaction", back_populates="savings_account", cascade="all, delete-orphan")


class SavingsTransaction(Base):
    """Transaktioner för sparkonton"""
    __tablename__ = "savings_transactions"

    id = Column(Integer, primary_key=True, index=True)
    savings_id = Column(Integer, ForeignKey("savings.id"), nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    amount = Column(Float, nullable=False)  # Positivt = insättning, Negativt = uttag
    transaction_type = Column(String, nullable=False)  # "deposit", "withdrawal", "interest"
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    savings_account = relationship("Savings", back_populates="transactions")
