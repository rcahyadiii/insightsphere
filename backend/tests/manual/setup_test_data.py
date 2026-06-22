#!/usr/bin/env python3
"""
Setup test data untuk comprehensive test 100% passed
"""

import requests
import sys
import uuid

BASE_URL = "http://localhost:8000"
ADMIN_USER = "faiz"
ADMIN_PASS = "1234"

class TestDataSetup:
    def __init__(self):
        self.token = None
        self.branch_id = None
        self.store_nbr = None
        self.product_id = None
        self.inventory_id = None
        self.user_id = None
        
    def login(self):
        """Login dan dapatkan token"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": ADMIN_USER, "password": ADMIN_PASS},
            timeout=10
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            print("✓ Login successful")
            return True
        print(f"✗ Login failed: {response.status_code}")
        return False
    
    def get_headers(self):
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
    
    def setup_store_and_branch(self):
        """Setup store dan branch"""
        # Get existing stores
        response = requests.get(f"{BASE_URL}/stores/", headers=self.get_headers(), timeout=10)
        if response.status_code == 200 and response.json():
            stores = response.json()
            self.store_nbr = stores[0]["store_nbr"]
            self.branch_id = stores[0].get("id", str(uuid.uuid4()))
            print(f"✓ Using existing store_nbr: {self.store_nbr}")
            return True
        
        # Create store if not exists
        store_data = {
            "store_nbr": 1,
            "branch_name": "Test Branch",
            "address": "Test Address",
            "phone": "1234567890",
            "is_active": True
        }
        response = requests.post(
            f"{BASE_URL}/stores/",
            json=store_data,
            headers=self.get_headers(),
            timeout=10
        )
        if response.status_code in [200, 201]:
            self.store_nbr = response.json().get("store_nbr", 1)
            self.branch_id = response.json().get("id")
            print(f"✓ Created store_nbr: {self.store_nbr}")
            return True
        
        # Default fallback
        self.store_nbr = 1
        self.branch_id = str(uuid.uuid4())
        print(f"⚠ Using default store_nbr: {self.store_nbr}")
        return True
    
    def setup_product(self):
        """Setup product"""
        # Check existing products
        response = requests.get(
            f"{BASE_URL}/inventory/products?limit=1",
            headers=self.get_headers(),
            timeout=10
        )
        if response.status_code == 200 and response.json():
            products = response.json()
            self.product_id = products[0]["id"]
            print(f"✓ Using existing product: {self.product_id}")
            return True
        
        # Create product
        product_data = {
            "sku": f"TEST-{uuid.uuid4().hex[:8]}",
            "name": "Test Product for Smoke Test",
            "family": "GROCERY I",
            "category": "Test Category",
            "unit": "pcs",
            "base_price": 10000.0,
            "cost_price": 8000.0,
            "supplier": "Test Supplier"
        }
        response = requests.post(
            f"{BASE_URL}/inventory/products",
            json=product_data,
            headers=self.get_headers(),
            timeout=10
        )
        if response.status_code in [200, 201]:
            self.product_id = response.json()["id"]
            print(f"✓ Created product: {self.product_id}")
            return True
        
        print(f"✗ Failed to create product: {response.status_code}")
        return False
    
    def setup_inventory(self):
        """Setup inventory record"""
        # Check existing inventory
        response = requests.get(
            f"{BASE_URL}/inventory/stock?limit=1&store_nbr={self.store_nbr}",
            headers=self.get_headers(),
            timeout=10
        )
        if response.status_code == 200 and response.json():
            inventory = response.json()
            if len(inventory) > 0:
                self.inventory_id = inventory[0]["id"]
                print(f"✓ Using existing inventory: {self.inventory_id}")
                return True
        
        print("⚠ No inventory record (will skip stock movement test)")
        return True  # Not critical
    
    def get_user_id(self):
        """Get current user ID"""
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers=self.get_headers(),
            timeout=10
        )
        if response.status_code == 200:
            self.user_id = response.json().get("id")
            print(f"✓ Got user_id: {self.user_id}")
            return True
        return False
    
    def setup(self):
        """Run all setup"""
        print("=" * 60)
        print("Setting up test data...")
        print("=" * 60)
        
        if not self.login():
            return False
        
        if not self.setup_store_and_branch():
            return False
        
        if not self.setup_product():
            return False
        
        self.setup_inventory()
        self.get_user_id()
        
        print("=" * 60)
        print("Setup complete!")
        print("=" * 60)
        
        # Save test data to file for comprehensive test
        import json
        test_data = {
            "token": self.token,
            "branch_id": self.branch_id,
            "store_nbr": self.store_nbr,
            "product_id": self.product_id,
            "inventory_id": self.inventory_id,
            "user_id": self.user_id
        }
        with open("test_data.json", "w") as f:
            json.dump(test_data, f)
        print("✓ Test data saved to test_data.json")
        
        return True

if __name__ == "__main__":
    setup = TestDataSetup()
    success = setup.setup()
    sys.exit(0 if success else 1)
