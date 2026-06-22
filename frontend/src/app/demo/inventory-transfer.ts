type DemoBranch = {
  id: string;
  name: string;
};

type DemoTransferHistoryItem = {
  id: string;
  date: string;
  from: string;
  to: string;
  product: string;
  qty: number;
  status: "done" | "pending";
};

type DemoInventoryTransfer = {
  branches: DemoBranch[];
  history: DemoTransferHistoryItem[];
};

export const DEMO_INVENTORY_TRANSFER: DemoInventoryTransfer = {
  branches: [
    { id: "1", name: "Lisna Fotocopy Digital - Rawasari" },
    { id: "2", name: "Lisna Fotocopy Digital - Cempaka Putih" },
    { id: "3", name: "Lisna Fotocopy Digital - Matraman" },
  ],
  history: [
    { id: "TRF-001", date: "2026-04-20", from: "Rawasari", to: "Cempaka Putih", product: "Kertas HVS A4 80gr", qty: 50, status: "done" },
    { id: "TRF-002", date: "2026-04-18", from: "Rawasari", to: "Matraman", product: "Tinta Printer Hitam", qty: 10, status: "done" },
    { id: "TRF-003", date: "2026-04-15", from: "Cempaka Putih", to: "Rawasari", product: "Kertas HVS F4 70gr", qty: 30, status: "pending" },
  ],
};
