"""Development-only script to seed one POS mock product."""

from __future__ import annotations

from sqlalchemy import text

from core.database import engine
from scripts.dev.dev_script_guard import require_development_env


MOCK_PRODUCT_ID = "123e4567-e89b-12d3-a456-426614174000"


def main() -> None:
    require_development_env("seed_mock_product")

    with engine.connect() as conn:
        conn.execute(
            text(
                """
                INSERT INTO products (
                    id, sku, name, family, category, unit,
                    base_price, default_price, cost_price, is_active
                )
                VALUES (
                    :id, :sku, :name, :family, :category, :unit,
                    :base_price, :default_price, :cost_price, :is_active
                )
                ON CONFLICT (id) DO UPDATE SET
                    sku = EXCLUDED.sku,
                    name = EXCLUDED.name,
                    family = EXCLUDED.family,
                    category = EXCLUDED.category,
                    unit = EXCLUDED.unit,
                    base_price = EXCLUDED.base_price,
                    default_price = EXCLUDED.default_price,
                    cost_price = EXCLUDED.cost_price,
                    is_active = EXCLUDED.is_active;
                """
            ),
            {
                "id": MOCK_PRODUCT_ID,
                "sku": "DEV-MOCK-001",
                "name": "Mock Product",
                "family": "GROCERY I",
                "category": "Development",
                "unit": "pcs",
                "base_price": 25.50,
                "default_price": 25.50,
                "cost_price": 0.0,
                "is_active": True,
            },
        )
        conn.commit()
    print("Development mock product upserted.")


if __name__ == "__main__":
    main()
