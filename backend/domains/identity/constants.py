"""Canonical identity role constants.

Values mirror the frontend role contract in `frontend/src/app/domain/constants.ts`.
"""

ROLE_ADMIN = "admin"
ROLE_OWNER = "owner"
ROLE_INVENTORY_MANAGER = "inventory_manager"
ROLE_CASHIER = "cashier"

ROLE_VALUES = (
    ROLE_ADMIN,
    ROLE_OWNER,
    ROLE_INVENTORY_MANAGER,
    ROLE_CASHIER,
)

ADMIN_OWNER_ROLES = (ROLE_ADMIN, ROLE_OWNER)
STORE_SCOPED_ROLES = (ROLE_CASHIER, ROLE_INVENTORY_MANAGER)
