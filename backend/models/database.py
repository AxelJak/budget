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
