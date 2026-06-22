type DemoCashType = "income" | "expense" | "adjustment" | "transfer";

type DemoCashEntry = {
  id: string;
  date: Date;
  type: DemoCashType;
  category: string;
  description: string;
  amount: number;
  operator: string;
  status: "completed" | "pending" | "cancelled";
  reference: string;
};

export const DEMO_CASH_ENTRIES: DemoCashEntry[] = [
  { id: "cas-1", date: new Date(2024, 2, 15, 9, 30), type: "income", category: "Penjualan", description: "Penjualan harian shift pagi", amount: 2500000, operator: "Rini Susanti", status: "completed", reference: "TX-2024-0412" },
  { id: "cas-2", date: new Date(2024, 2, 15, 14, 0), type: "expense", category: "Operasional", description: "Pembelian kertas dan tinta", amount: 850000, operator: "Budi Hartono", status: "completed", reference: "PO-2024-0324" },
  { id: "cas-3", date: new Date(2024, 2, 14, 10, 15), type: "income", category: "Penjualan", description: "Penjualan fotokopi dan print", amount: 1200000, operator: "Rini Susanti", status: "completed", reference: "TX-2024-0411" },
  { id: "cas-4", date: new Date(2024, 2, 14, 16, 30), type: "expense", category: "Gaji", description: "Gaji karyawan mingguan", amount: 3500000, operator: "Ahmad Faiz", status: "completed", reference: "PY-2024-0012" },
  { id: "cas-5", date: new Date(2024, 2, 13, 11, 0), type: "transfer", category: "Antar Kas", description: "Transfer ke rekening operasional", amount: 5000000, operator: "Ahmad Faiz", status: "completed", reference: "TRF-2024-0003" },
  { id: "cas-6", date: new Date(2024, 2, 13, 9, 0), type: "income", category: "Modal Masuk", description: "Modal tambahan dari pemilik", amount: 10000000, operator: "Ahmad Faiz", status: "completed", reference: "MDL-2024-0001" },
  { id: "cas-7", date: new Date(2024, 2, 12, 13, 45), type: "expense", category: "Peralatan", description: "Servis mesin fotokopi", amount: 1200000, operator: "Budi Hartono", status: "completed", reference: "SVC-2024-0005" },
  { id: "cas-8", date: new Date(2024, 2, 12, 15, 20), type: "adjustment", category: "Koreksi", description: "Koreksi selisih kasir", amount: -50000, operator: "Rini Susanti", status: "completed", reference: "ADJ-2024-0002" },
  { id: "cas-9", date: new Date(2024, 2, 11, 8, 30), type: "income", category: "Penjualan", description: "Penjualan awal bulan", amount: 3200000, operator: "Dewi Kusuma", status: "completed", reference: "TX-2024-0408" },
  { id: "cas-10", date: new Date(2024, 2, 11, 17, 0), type: "expense", category: "Operasional", description: "Bayar listrik dan internet", amount: 950000, operator: "Budi Hartono", status: "pending", reference: "BIL-2024-0003" },
  { id: "cas-11", date: new Date(2024, 2, 10, 12, 0), type: "income", category: "Lainnya", description: "Pendapatan jasa laminating", amount: 450000, operator: "Rini Susanti", status: "completed", reference: "TX-2024-0407" },
  { id: "cas-12", date: new Date(2024, 2, 10, 14, 30), type: "expense", category: "Operasional", description: "Pembelian toner printer", amount: 680000, operator: "Budi Hartono", status: "cancelled", reference: "PO-2024-0320" },
];
