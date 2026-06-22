"""
Sales Repository — Data Access Layer.
Hanya bertugas ngobrol dengan database. Tidak ada logika bisnis di sini.
"""
from typing import Optional
from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session, selectinload
from domains.sales.models import Transaction, TransactionItem
from domains.observability.models import AuditEvent
from domains.dataset.models import Store


def get_transactions_with_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    cashier_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """
    Mengambil data transaksi beserta item-nya (Eager Loading).
    Mencegah masalah query N+1.

    Filter opsional:
    - cashier_id : scope ke satu kasir (untuk /mine atau admin filter)
    - date_from  : tanggal awal (inklusif)
    - date_to    : tanggal akhir (inklusif)
    """
    q = db.query(Transaction).options(selectinload(Transaction.items))
    if cashier_id is not None:
        q = q.filter(Transaction.cashier_id == cashier_id)
    if date_from is not None:
        q = q.filter(Transaction.date >= date_from)
    if date_to is not None:
        q = q.filter(Transaction.date <= date_to)
    return q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


def get_transaction_by_client_id(db: Session, client_txn_id: str):
    """Ambil transaksi berdasarkan client_txn_id untuk cek idempotency."""
    return db.query(Transaction).filter(Transaction.client_txn_id == client_txn_id).first()


def summarize_transactions(
    db: Session,
    date_from: date,
    date_to: date,
    group_by: str = "day",
    store_nbr: Optional[int] = None,
) -> dict:
    """Ambil transaksi dalam range dan susun summary ringan untuk reporting."""
    query = (
        db.query(Transaction)
        .options(selectinload(Transaction.items))
        .filter(Transaction.date >= date_from, Transaction.date <= date_to)
    )
    if store_nbr is not None:
        query = query.join(Store, Transaction.branch_id == Store.id).filter(Store.store_nbr == store_nbr)

    transactions = query.order_by(Transaction.date.asc(), Transaction.time.asc()).all()

    total_revenue = 0.0
    total_items = 0
    series: dict[str, dict] = {}
    payment_methods: dict[str, dict] = {}

    for transaction in transactions:
        revenue = float(transaction.total_amount or 0)
        total_revenue += revenue
        total_items += sum(item.quantity for item in transaction.items)

        bucket = _summary_bucket(transaction.date, group_by)
        series_item = series.setdefault(bucket, {"date": bucket, "revenue": 0.0, "transactions": 0})
        series_item["revenue"] += revenue
        series_item["transactions"] += 1

        method = transaction.payment_method or "UNKNOWN"
        payment_item = payment_methods.setdefault(method, {"method": method, "count": 0, "total": 0.0})
        payment_item["count"] += 1
        payment_item["total"] += revenue

    return {
        "total_revenue": round(total_revenue, 2),
        "total_transactions": len(transactions),
        "total_items": total_items,
        "payment_methods": list(payment_methods.values()),
        "series": list(series.values()),
    }


def _summary_bucket(value: date, group_by: str) -> str:
    if group_by == "month":
        return value.strftime("%Y-%m")
    if group_by == "week":
        iso_year, iso_week, _ = value.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"
    return value.isoformat()


def create_transaction(db: Session, transaction_data, total_amount: float):
    """
    Menyimpan transaksi + items + audit event secara atomic.
    total_amount sudah dihitung oleh service layer.
    """
    try:
        db_transaction = Transaction(
            branch_id=transaction_data.branch_id,
            date=transaction_data.date,
            time=transaction_data.time,
            total_amount=total_amount,
            payment_method=transaction_data.payment_method,
            cashier_id=getattr(transaction_data, "cashier_id", None),
            cash_session_id=getattr(transaction_data, "cash_session_id", None),
            client_txn_id=getattr(transaction_data, "client_txn_id", None)
        )
        db.add(db_transaction)
        db.flush()
        
        db_items = [
            TransactionItem(
                transaction_id=db_transaction.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price_at_time=item.unit_price_at_time,
                subtotal=item.quantity * item.unit_price_at_time
            )
            for item in transaction_data.items
        ]
        db.add_all(db_items)
        
        audit_event = AuditEvent(
            event_type="TRANSACTION_CREATED",
            event_data={
                "branch_id": str(transaction_data.branch_id),
                "total_amount": total_amount,
                "items_count": len(transaction_data.items),
                "payment_method": transaction_data.payment_method,
                "client_txn_id": getattr(transaction_data, "client_txn_id", None)
            }
        )
        db.add(audit_event)
        
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    except Exception as e:
        db.rollback()
        raise e
