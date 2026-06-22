# Legacy Migration Scripts (DEPRECATED)

> **Status**: Skrip-skrip migrasi manual di folder ini telah dikonsolidasikan ke dalam
> Alembic revision `b2f9c1a3d4e5_consolidate_manual_migrations.py`.
>
> **Jangan dijalankan lagi**. Gunakan Alembic sebagai satu-satunya sumber kebenaran:
>
> ```bash
> cd backend
> alembic upgrade head
> ```

## Skrip yang Sudah Dikonsolidasikan

| Skrip Lama                       | Konsolidasi Alembic                                |
| -------------------------------- | -------------------------------------------------- |
| `migrate_2fa.py`                 | `b2f9c1a3d4e5` â†’ kolom 2FA pada `users`            |
| `migrate_add_tax_columns.py`     | `b2f9c1a3d4e5` â†’ `tax_rate`, `tax_amount`          |
| `migrate_inventory_version.py`   | `b2f9c1a3d4e5` â†’ `inventory.version`               |
| `migrate_offline_sync.py`        | `b2f9c1a3d4e5` â†’ `transactions.client_txn_id`      |

## Catatan

- Operasi pada revisi konsolidasi bersifat **idempotent** (`ADD COLUMN IF NOT EXISTS`).
- Aman dijalankan di environment yang sudah pernah menerapkan skrip manual.
- Skrip lama dipertahankan sementara untuk referensi historis sebelum dihapus.
