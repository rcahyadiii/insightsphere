"""
Finance Service — Business Logic Layer.
Logika hitungan keuangan kasir: selisih, deteksi fraud, validasi sesi.
Bisa di-test secara murni tanpa database.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID

from domains.finance import repository as finance_repo
from domains.finance.schemas import CashSessionCreate, CashSessionClose, PettyCashCreate


def calculate_expected_balance(opening: float, cash_sales: float, petty_expenses: float) -> float:
    """Hitung saldo yang SEHARUSNYA ada di laci."""
    return opening + cash_sales - petty_expenses


def detect_fraud_type(difference: float) -> str:
    """Tentukan tipe audit event berdasarkan selisih uang."""
    if difference < 0:
        return "FRAUD_ALERT_CASH_SHORTAGE"
    elif difference > 0:
        return "CASH_OVERAGE"
    return "CASH_SESSION_CLOSED_NORMAL"


def open_shift(db: Session, session_data: CashSessionCreate):
    """Buka shift kasir baru. Tolak jika ada sesi menggantung."""
    existing = finance_repo.get_open_session_by_cashier(db, session_data.cashier_id)
    if existing:
        raise ValueError("Cannot open new session. Cashier has an active open session.")
    
    finance_repo.create_session(db, session_data.cashier_id, session_data.store_id, session_data.opening_balance)
    finance_repo.create_audit_event(db, store_nbr=1, event_type="CASH_SESSION_OPENED", event_data={
        "cashier_id": str(session_data.cashier_id),
        "opening_balance": session_data.opening_balance
    })
    
    db.commit()
    # Re-query the session to return it fresh
    session = finance_repo.get_open_session_by_cashier(db, session_data.cashier_id)
    return session


def list_cash_sessions(db: Session, limit: int = 50, offset: int = 0):
    items, total = finance_repo.list_cash_sessions(db, limit=limit, offset=offset)
    return {"items": items, "total": total}


def get_cash_session_detail(db: Session, session_id: UUID):
    session = finance_repo.get_cash_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Cash session not found")
    return session


def record_petty_cash(db: Session, expense_data: PettyCashCreate):
    """Catat pengeluaran petty cash. Pastikan sesi masih aktif."""
    db_session = finance_repo.get_open_session_by_id(db, expense_data.cash_session_id)
    if not db_session:
        raise ValueError("Active cash session not found.")
    
    finance_repo.create_petty_cash(
        db, expense_data.cash_session_id, 
        expense_data.amount, expense_data.description, expense_data.type
    )
    finance_repo.create_audit_event(db, store_nbr=1, event_type="PETTY_CASH_DEDUCTION", event_data={
        "cash_session_id": str(expense_data.cash_session_id),
        "amount": expense_data.amount,
        "desc": expense_data.description
    })
    
    db.commit()
    # Re-query to return refreshed petty cash
    return db.query(finance_repo.PettyCashTransaction).filter(
        finance_repo.PettyCashTransaction.cash_session_id == expense_data.cash_session_id
    ).order_by(finance_repo.PettyCashTransaction.created_at.desc()).first()


def close_shift(db: Session, session_id: str, close_data: CashSessionClose):
    """
    Tutup shift kasir dengan hitungan audit kaku.
    Expected = Opening + Cash Sales - Petty Cash Expenses
    Difference = Actual - Expected → detect fraud
    """
    db_session = finance_repo.get_open_session_by_id(db, session_id)
    if not db_session:
        raise ValueError("Cash session not found or already closed.")
    
    cash_sales = finance_repo.sum_cash_sales(db, db_session.id)
    petty_expenses = finance_repo.sum_petty_expenses(db, db_session.id)
    
    expected = calculate_expected_balance(db_session.opening_balance, cash_sales, petty_expenses)
    difference = close_data.actual_closing_balance - expected
    fraud_type = detect_fraud_type(difference)
    
    finance_repo.close_session(
        db, db_session, 
        end_time=datetime.now(timezone.utc),
        expected=expected,
        actual=close_data.actual_closing_balance,
        difference=difference
    )
    
    finance_repo.create_audit_event(db, store_nbr=1, event_type=fraud_type, event_data={
        "session_id": session_id,
        "expected": expected,
        "actual": close_data.actual_closing_balance,
        "difference": difference
    })
    
    db.commit()
    db.refresh(db_session)
    return db_session
