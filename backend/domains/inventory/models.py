"""
Domain Inventory — Product, Inventory (Stok per Cabang), StockMovement.
Master katalog produk dan pelacakan stok real-time multi-cabang.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from core.base_model import AbstractBase


class Product(AbstractBase):
    """
    Master Katalog Produk.
    Field `family` menjembatani ke prediksi ML (harus cocok dengan family di ai_prediction_logs).
    """
    __tablename__ = "products"
    
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, index=True)
    family = Column(String, nullable=False, index=True)      # Link ke ML: "GROCERY I", "BEVERAGES", dll
    category = Column(String, nullable=False, index=True)     # Label UI: "Sembako", "Minuman", dll
    unit = Column(String, nullable=False, default="pcs")      # "pcs", "kg", "liter"
    base_price = Column(Float, nullable=False)                # Harga jual normal
    default_price = Column(Float, nullable=True)              # Harga default untuk POS
    cost_price = Column(Float, nullable=False, default=0.0)   # Harga beli (HPP)
    supplier = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    image_url = Column(String, nullable=True)

    inventory_entries = relationship("Inventory", back_populates="product", uselist=True)

    __table_args__ = (
        Index('idx_product_family_category', 'family', 'category'),
    )


class Inventory(AbstractBase):
    """
    Stok per Produk per Cabang.
    Setiap baris = 1 produk di 1 toko. UNIQUE(product_id, store_nbr).
    """
    __tablename__ = "inventory"
    
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    store_nbr = Column(Integer, ForeignKey("stores.store_nbr"), nullable=False, index=True)
    current_stock = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, nullable=False, default=10)
    max_stock = Column(Integer, nullable=False, default=100)
    reorder_point = Column(Integer, nullable=False, default=20)
    location = Column(String, nullable=True)                  # "Rak A1", "Freezer F2"
    last_restock_date = Column(Date, nullable=True)
    version = Column(Integer, default=1, nullable=False)      # Optimistic Locking

    product = relationship("Product", back_populates="inventory_entries")
    movements = relationship("StockMovement", back_populates="inventory_entry", uselist=True)

    __table_args__ = (
        UniqueConstraint('product_id', 'store_nbr', name='uix_product_store'),
        Index('idx_inventory_store_product', 'store_nbr', 'product_id'),
    )


class StockMovement(AbstractBase):
    """
    Log setiap perubahan stok — audit trail tak terhapus.
    movement_type: IN (restok), OUT (penjualan), ADJUSTMENT (koreksi fisik), WASTE (rusak/kadaluarsa).
    """
    __tablename__ = "stock_movements"
    
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False, index=True)
    movement_type = Column(String, nullable=False, index=True)  # "IN", "OUT", "ADJUSTMENT", "WASTE"
    quantity = Column(Integer, nullable=False)                   # Positif = masuk, Negatif = keluar
    reason = Column(String, nullable=False)                      # "Restok dari supplier", "Penjualan POS"
    reference_id = Column(UUID(as_uuid=True), nullable=True)     # Link ke Transaction ID jika dari penjualan
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    inventory_entry = relationship("Inventory", back_populates="movements")
