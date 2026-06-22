"""
Finance Repository — Data Access Layer.
Hanya query database. Tidak ada hitungan bisnis di sini.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from domains.finance.models import CashSession, PettyCashTransaction
from domains.sales.models import Transaction
from domains.observability.models import AuditEvent


def _coerce_uuid(value):
    if isinstance(value, UUID):
        return value
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


def get_open_session_by_cashier(db: Session, cashier_id):
    """Cek apakah kasir masih punya sesi menggantung."""
    cashier_uuid = _coerce_uuid(cashier_id)
    if cashier_uuid is None:
        return None

    return db.query(CashSession).filter(
        CashSession.cashier_id == cashier_uuid,
        CashSession.status == "open"
    ).first()


def get_open_session_by_id(db: Session, session_id):
    """Ambil sesi kasir berdasarkan ID (harus masih open)."""
    session_uuid = _coerce_uuid(session_id)
    if session_uuid is None:
        return None

    return db.query(CashSession).filter(
        CashSession.id == session_uuid,
        CashSession.status == "open"
    ).first()


def create_session(db: Session, cashier_id, store_id, opening_balance) -> CashSession:
    """Buat sesi kasir baru."""
    db_session = CashSession(
        cashier_id=cashier_id,
        store_id=store_id,
        opening_balance=opening_balance
    )
    db.add(db_session)
    return db_session


def list_cash_sessions(db: Session, limit: int = 50, offset: int = 0):
    """Ambil daftar sesi kasir terbaru untuk histori finance."""
    query = db.query(CashSession).order_by(CashSession.start_time.desc())
    total = query.count()
    return query.offset(offset).limit(limit).all(), total


def get_cash_session_by_id(db: Session, session_id):
    """Ambil sesi kasir berdasarkan ID tanpa batasan status."""
    session_uuid = _coerce_uuid(session_id)
    if session_uuid is None:
        return None
    return db.query(CashSession).filter(CashSession.id == session_uuid).first()


def sum_cash_sales(db: Session, session_id) -> float:
    """Total penjualan tunai untuk session tertentu."""
    session_uuid = _coerce_uuid(session_id)
    if session_uuid is None:
        return 0.0

    return db.query(func.sum(Transaction.total_amount)).filter(
        Transaction.cash_session_id == session_uuid,
        Transaction.payment_method == "CASH"
    ).scalar() or 0.0


def sum_petty_expenses(db: Session, session_id) -> float:
    """Total pengeluaran petty cash untuk session tertentu."""
    session_uuid = _coerce_uuid(session_id)
    if session_uuid is None:
        return 0.0

    return db.query(func.sum(PettyCashTransaction.amount)).filter(
        PettyCashTransaction.cash_session_id == session_uuid,
        PettyCashTransaction.type == "expense"
    ).scalar() or 0.0


def create_petty_cash(db: Session, cash_session_id, amount, description, type_str) -> PettyCashTransaction:
    """Simpan transaksi petty cash."""
    db_expense = PettyCashTransaction(
        cash_session_id=cash_session_id,
        amount=amount,
        description=description,
        type=type_str
    )
    db.add(db_expense)
    return db_expense


def close_session(db: Session, session: CashSession, end_time, expected, actual, difference):
    """Update sesi kasir menjadi closed."""
    session.end_time = end_time
    session.expected_closing_balance = expected
    session.actual_closing_balance = actual
    session.difference = difference
    session.status = "closed"


def create_audit_event(db: Session, store_nbr, event_type, event_data):
    """Catat audit event."""
    audit = AuditEvent(
        store_nbr=store_nbr,
        event_type=event_type,
        event_data=event_data
    )
    db.add(audit)
