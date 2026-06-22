"""
Sales Service — Business Logic Layer.
Semua logika bisnis transaksi hidup di sini.
Bisa di-test tanpa menyalakan server.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timezone
from typing import Optional

from domains.sales.models import Transaction
from domains.sales import repository as sales_repo
from domains.sales.schemas import TransactionCreate, TransactionBatchCreate, TransactionSummaryResponse


from domains.inventory import repository as inv_repo
from domains.dataset.models import Store


def calculate_total_amount(items) -> float:
    """Hitung ulang total di sisi server — mencegah manipulasi harga dari client."""
    return sum(item.quantity * item.unit_price_at_time for item in items)


def create_single_transaction(db: Session, transaction_data: TransactionCreate):
    """
    [HARDENED] Buat satu transaksi baru dengan atomic stock deduction.
    Menggunakan Optimistic Locking untuk menangani Race Condition.
    """
    # 1. Resolve branch_id if only store_nbr is provided
    branch_id = transaction_data.branch_id
    if not branch_id and transaction_data.store_nbr:
        store = db.query(Store).filter(Store.store_nbr == transaction_data.store_nbr).first()
        if not store:
            raise ValueError(f"Store number {transaction_data.store_nbr} not found.")
        branch_id = store.id

    # 2. Idempotency check 
    if transaction_data.client_txn_id:
        existing = sales_repo.get_transaction_by_client_id(db, transaction_data.client_txn_id)
        if existing:
            return existing

    # 3. ATOMIC PROCESS: stock deduction + transaction creation share one session.
    # Repository commit persists both operations together.
    try:
        # A. Deduct Stock for each item
        for item in transaction_data.items:
            # Validasi Optimistic Locking di sini
            success = inv_repo.deduct_stock_atomic(
                db,
                str(item.product_id),
                transaction_data.store_nbr,
                item.quantity,
                item.version_at_transaction
            )
            if not success:
                # Inilah momen di mana kita melempar error 409 Conflict ke UI
                raise ValueError("STOK_CONFLICT")

        # B. Create Transaction Entry
        total = calculate_total_amount(transaction_data.items)
        # Override transactional_data branch_id untuk repository
        transaction_data.branch_id = branch_id

        return sales_repo.create_transaction(db, transaction_data, total)
            
    except ValueError as e:
        # Re-raise untuk di-catch oleh router (409 Conflict)
        raise e
    except Exception as e:
        raise e


def sync_offline_transactions(db: Session, batch: TransactionBatchCreate) -> dict:
    """
    Proses batch transaksi dari kasir yang sempat offline.
    Mengembalikan laporan sukses/gagal/duplicate per transaksi.
    Idempotent via client_txn_id — retry aman tanpa duplikat.
    """
    results = {"synced": 0, "failed": 0, "duplicate": 0, "details": []}
    
    for tx in batch.transactions:
        try:
            # Cek idempotency dulu sebelum create
            is_duplicate = False
            if tx.client_txn_id:
                existing = sales_repo.get_transaction_by_client_id(db, tx.client_txn_id)
                if existing:
                    is_duplicate = True
                    results["duplicate"] += 1
                    results["details"].append({
                        "status": "duplicate",
                        "client_txn_id": tx.client_txn_id,
                        "id": str(existing.id),
                    })
                    continue
            
            saved = create_single_transaction(db, tx)
            results["synced"] += 1
            results["details"].append({
                "status": "success",
                "client_txn_id": tx.client_txn_id,
                "id": str(saved.id),
            })
        except Exception as e:
            results["failed"] += 1
            results["details"].append({
                "status": "failed",
                "client_txn_id": getattr(tx, "client_txn_id", None),
                "error": str(e),
            })
            
    return results


def get_today_summary(db: Session, branch_id: Optional[str] = None) -> dict:
    """
    Hitung omzet hari ini menggunakan agregasi langsung tingkat DB.
    Memanfaatkan Index filter date untuk efisiensi query.
    """
    today_date = datetime.now(timezone.utc).date()
    
    query = db.query(
        func.count(Transaction.id).label("total_transactions"),
        func.sum(Transaction.total_amount).label("total_revenue")
    ).filter(Transaction.date == today_date)
    
    if branch_id:
        query = query.filter(Transaction.branch_id == branch_id)
        
    result = query.first()
    
    return {
        "date": today_date,
        "branch_id": branch_id or "GLOBAL",
        "total_transactions": result.total_transactions or 0,
        "total_revenue": result.total_revenue or 0.0
    }


def get_transaction_summary(
    db: Session,
    date_from: date,
    date_to: date,
    group_by: str = "day",
    store_nbr: Optional[int] = None,
) -> TransactionSummaryResponse:
    """Ringkasan transaksi untuk reporting dashboard dan tab penjualan."""
    if date_from > date_to:
        raise ValueError("date_from must be before or equal to date_to")

    normalized_group = group_by if group_by in {"day", "week", "month"} else "day"
    data = sales_repo.summarize_transactions(
        db,
        date_from=date_from,
        date_to=date_to,
        group_by=normalized_group,
        store_nbr=store_nbr,
    )
    return TransactionSummaryResponse(**data)
