"""
Seed 12 Produk + Stok Awal sesuai PRD.
Jalankan: python -m domains.inventory.seed
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.database import SessionLocal, engine, Base
from domains.dataset.models import Store
from domains.inventory.models import Product, Inventory

PRODUCTS = [
    {"sku": "SKU-001", "name": "Beras Premium 5kg",      "family": "GROCERY I",     "category": "Sembako",  "unit": "pcs", "base_price": 75000,  "cost_price": 62000,  "supplier": "PT Beras Nusantara"},
    {"sku": "SKU-002", "name": "Teh Botol Sosro 350ml",  "family": "BEVERAGES",     "category": "Minuman",  "unit": "pcs", "base_price": 5500,   "cost_price": 4200,   "supplier": "PT Sinar Sosro"},
    {"sku": "SKU-003", "name": "Indomie Goreng",         "family": "GROCERY I",     "category": "Sembako",  "unit": "pcs", "base_price": 3500,   "cost_price": 2800,   "supplier": "PT Indofood"},
    {"sku": "SKU-004", "name": "Chitato Original 68g",   "family": "GROCERY II",    "category": "Snack",    "unit": "pcs", "base_price": 12000,  "cost_price": 9500,   "supplier": "PT Indofood"},
    {"sku": "SKU-005", "name": "Aqua 600ml",             "family": "BEVERAGES",     "category": "Minuman",  "unit": "pcs", "base_price": 4000,   "cost_price": 2500,   "supplier": "PT Danone"},
    {"sku": "SKU-006", "name": "Susu Ultra 1L",          "family": "DAIRY",         "category": "Dairy",    "unit": "pcs", "base_price": 18500,  "cost_price": 15000,  "supplier": "PT Ultra Jaya"},
    {"sku": "SKU-007", "name": "Nugget Fiesta 500g",     "family": "FROZEN FOODS",  "category": "Frozen",   "unit": "pcs", "base_price": 42000,  "cost_price": 35000,  "supplier": "PT Charoen Pokphand"},
    {"sku": "SKU-008", "name": "Roti Tawar Sari Roti",   "family": "BREAD/BAKERY", "category": "Bakery",   "unit": "pcs", "base_price": 16000,  "cost_price": 12500,  "supplier": "PT Nippon Indosari"},
    {"sku": "SKU-009", "name": "Apel Fuji 1kg",          "family": "PRODUCE",       "category": "Buah",     "unit": "kg",  "base_price": 45000,  "cost_price": 38000,  "supplier": "CV Buah Segar"},
    {"sku": "SKU-010", "name": "Daging Ayam 1kg",        "family": "MEATS/POULTRY","category": "Daging",   "unit": "kg",  "base_price": 38000,  "cost_price": 32000,  "supplier": "PT Japfa"},
    {"sku": "SKU-011", "name": "Minyak Goreng 2L",       "family": "GROCERY I",     "category": "Sembako",  "unit": "pcs", "base_price": 32000,  "cost_price": 27000,  "supplier": "PT Wilmar"},
    {"sku": "SKU-012", "name": "Gula Pasir 1kg",         "family": "GROCERY I",     "category": "Sembako",  "unit": "kg",  "base_price": 15000,  "cost_price": 12000,  "supplier": "PT Sugar Group"},
]

# Stok awal per produk di Store #1 (variasi status untuk demo UI)
INVENTORY_STORE_1 = [
    {"sku": "SKU-001", "current_stock": 45,  "min_stock": 20, "max_stock": 100, "reorder_point": 30, "location": "Rak A1"},
    {"sku": "SKU-002", "current_stock": 120, "min_stock": 50, "max_stock": 200, "reorder_point": 80, "location": "Rak B2"},
    {"sku": "SKU-003", "current_stock": 8,   "min_stock": 100,"max_stock": 500, "reorder_point": 150,"location": "Rak A3"},   # CRITICAL
    {"sku": "SKU-004", "current_stock": 85,  "min_stock": 30, "max_stock": 150, "reorder_point": 50, "location": "Rak C1"},
    {"sku": "SKU-005", "current_stock": 250, "min_stock": 100,"max_stock": 400, "reorder_point": 150,"location": "Rak B1"},
    {"sku": "SKU-006", "current_stock": 5,   "min_stock": 20, "max_stock": 80,  "reorder_point": 30, "location": "Chiller D1"}, # CRITICAL
    {"sku": "SKU-007", "current_stock": 18,  "min_stock": 15, "max_stock": 60,  "reorder_point": 25, "location": "Freezer F1"}, # LOW
    {"sku": "SKU-008", "current_stock": 12,  "min_stock": 15, "max_stock": 50,  "reorder_point": 20, "location": "Rak D2"},    # CRITICAL
    {"sku": "SKU-009", "current_stock": 35,  "min_stock": 10, "max_stock": 40,  "reorder_point": 15, "location": "Rak E1"},    # OVERSTOCK-ish
    {"sku": "SKU-010", "current_stock": 0,   "min_stock": 10, "max_stock": 30,  "reorder_point": 15, "location": "Chiller D2"}, # OUT_OF_STOCK
    {"sku": "SKU-011", "current_stock": 60,  "min_stock": 25, "max_stock": 100, "reorder_point": 40, "location": "Rak A2"},
    {"sku": "SKU-012", "current_stock": 130, "min_stock": 30, "max_stock": 120, "reorder_point": 50, "location": "Rak A4"},    # OVERSTOCK
]


def seed_products_and_inventory():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        store = db.query(Store).filter(Store.store_nbr == 1).first()
        if not store:
            store = Store(
                store_nbr=1,
                city="Demo City",
                state="Demo State",
                type="D",
                cluster=1,
            )
            db.add(store)
            db.flush()
        
        print("[products] Memastikan 12 produk demo tersedia di tabel 'products'...")
        product_map = {}
        for p in PRODUCTS:
            db_product = db.query(Product).filter(Product.sku == p["sku"]).first()
            if not db_product:
                db_product = Product(**p)
                db.add(db_product)
                db.flush()
                print(f"  OK {p['sku']} - {p['name']}")
            else:
                print(f"  SKIP {p['sku']} - sudah ada")
            product_map[p["sku"]] = db_product.id
        
        print(f"\n[inventory] Memastikan stok awal tersedia di Store #1...")
        created_inventory = 0
        for inv in INVENTORY_STORE_1:
            product_id = product_map.get(inv["sku"])
            if not product_id:
                continue

            existing_inv = db.query(Inventory).filter(
                Inventory.product_id == product_id,
                Inventory.store_nbr == 1,
            ).first()
            if existing_inv:
                print(f"  SKIP {inv['sku']} - stok sudah ada")
            else:
                db_inv = Inventory(
                    product_id=product_id,
                    store_nbr=1,
                    current_stock=inv["current_stock"],
                    min_stock=inv["min_stock"],
                    max_stock=inv["max_stock"],
                    reorder_point=inv["reorder_point"],
                    location=inv["location"],
                )
                db.add(db_inv)
                created_inventory += 1
                print(f"  OK {inv['sku']} - Stok: {inv['current_stock']} @ {inv['location']}")
        
        db.commit()
        print(f"\nSeed inventory selesai. Produk target: {len(PRODUCTS)}, stok baru: {created_inventory}.")
        
    except Exception as e:
        db.rollback()
        print(f"Seed gagal: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_and_inventory()
