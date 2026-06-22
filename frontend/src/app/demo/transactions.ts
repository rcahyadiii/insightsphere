export type DemoPaymentMethod = "CASH" | "QRIS";

export interface DemoTransaction {
  id: string;
  date: string;
  time: string;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalItems: number;
  total: number;
  paymentMethod: DemoPaymentMethod;
  cashReceived: number;
  change: number;
  cashierName: string;
  branchName: string;
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "TXN-20260422-001",
    date: "2026-04-22",
    time: "14:32:15",
    items: [
      { productName: "Print Dokumen B&W A4", sku: "PR-BW", quantity: 25, unitPrice: 500, subtotal: 12500 },
      { productName: "Fotokopi A4", sku: "FK-A4", quantity: 15, unitPrice: 300, subtotal: 4500 },
    ],
    totalItems: 40,
    total: 17000,
    paymentMethod: "CASH",
    cashReceived: 20000,
    change: 3000,
    cashierName: "Kasir-01",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260422-002",
    date: "2026-04-22",
    time: "13:18:44",
    items: [
      { productName: "Cetak Foto 4R", sku: "CF-4R", quantity: 5, unitPrice: 3500, subtotal: 17500 },
      { productName: "Laminasi A4", sku: "LM-A4", quantity: 2, unitPrice: 5000, subtotal: 10000 },
    ],
    totalItems: 7,
    total: 27500,
    paymentMethod: "QRIS",
    cashReceived: 27500,
    change: 0,
    cashierName: "Kasir-02",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260422-003",
    date: "2026-04-22",
    time: "11:05:22",
    items: [
      { productName: "Print Warna A4", sku: "PR-WN", quantity: 8, unitPrice: 1500, subtotal: 12000 },
      { productName: "Jilid Spiral A4", sku: "JL-SP", quantity: 1, unitPrice: 8000, subtotal: 8000 },
    ],
    totalItems: 9,
    total: 20000,
    paymentMethod: "CASH",
    cashReceived: 20000,
    change: 0,
    cashierName: "Kasir-01",
    branchName: "Cabang #2 - Barat",
  },
  {
    id: "TXN-20260421-001",
    date: "2026-04-21",
    time: "16:45:11",
    items: [
      { productName: "Cetak Foto 3x4 cm", sku: "CF-3X4", quantity: 10, unitPrice: 2000, subtotal: 20000 },
      { productName: "Scan Dokumen A4", sku: "SC-A4", quantity: 5, unitPrice: 2000, subtotal: 10000 },
      { productName: "Print Dokumen B&W A4", sku: "PR-BW", quantity: 20, unitPrice: 500, subtotal: 10000 },
    ],
    totalItems: 35,
    total: 40000,
    paymentMethod: "CASH",
    cashReceived: 50000,
    change: 10000,
    cashierName: "Kasir-01",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260421-002",
    date: "2026-04-21",
    time: "10:22:05",
    items: [
      { productName: "Stiker Vinyl A4", sku: "ST-VN", quantity: 2, unitPrice: 15000, subtotal: 30000 },
      { productName: "Edit File Desain", sku: "JS-ED", quantity: 1, unitPrice: 25000, subtotal: 25000 },
    ],
    totalItems: 3,
    total: 55000,
    paymentMethod: "QRIS",
    cashReceived: 55000,
    change: 0,
    cashierName: "Kasir-02",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260420-001",
    date: "2026-04-20",
    time: "15:30:08",
    items: [
      { productName: "Fotokopi A4", sku: "FK-A4", quantity: 30, unitPrice: 300, subtotal: 9000 },
      { productName: "Print Dokumen B&W A4", sku: "PR-BW", quantity: 30, unitPrice: 500, subtotal: 15000 },
      { productName: "Laminasi F4", sku: "LM-F4", quantity: 3, unitPrice: 7000, subtotal: 21000 },
    ],
    totalItems: 63,
    total: 45000,
    paymentMethod: "CASH",
    cashReceived: 50000,
    change: 5000,
    cashierName: "Kasir-01",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260419-001",
    date: "2026-04-19",
    time: "09:15:38",
    items: [
      { productName: "Jilid Hard Cover A4", sku: "JL-HC", quantity: 2, unitPrice: 35000, subtotal: 70000 },
      { productName: "Print Warna A4", sku: "PR-WN", quantity: 15, unitPrice: 1500, subtotal: 22500 },
      { productName: "Cetak Foto 4x6 cm", sku: "CF-4X6", quantity: 8, unitPrice: 3000, subtotal: 24000 },
    ],
    totalItems: 25,
    total: 116500,
    paymentMethod: "QRIS",
    cashReceived: 116500,
    change: 0,
    cashierName: "Kasir-01",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260418-001",
    date: "2026-04-18",
    time: "13:44:21",
    items: [
      { productName: "Print Dokumen B&W A4", sku: "PR-BW", quantity: 50, unitPrice: 500, subtotal: 25000 },
      { productName: "Fotokopi A4", sku: "FK-A4", quantity: 20, unitPrice: 300, subtotal: 6000 },
      { productName: "Jilid Spiral A4", sku: "JL-SP", quantity: 2, unitPrice: 8000, subtotal: 16000 },
    ],
    totalItems: 72,
    total: 47000,
    paymentMethod: "CASH",
    cashReceived: 50000,
    change: 3000,
    cashierName: "Kasir-01",
    branchName: "Cabang #2 - Barat",
  },
  {
    id: "TXN-20260418-002",
    date: "2026-04-18",
    time: "10:08:55",
    items: [
      { productName: "Cetak Foto 4R", sku: "CF-4R", quantity: 20, unitPrice: 3500, subtotal: 70000 },
      { productName: "Laminasi A4", sku: "LM-A4", quantity: 5, unitPrice: 5000, subtotal: 25000 },
    ],
    totalItems: 25,
    total: 95000,
    paymentMethod: "QRIS",
    cashReceived: 95000,
    change: 0,
    cashierName: "Kasir-02",
    branchName: "Cabang #1 - Pusat",
  },
  {
    id: "TXN-20260417-001",
    date: "2026-04-17",
    time: "11:30:00",
    items: [
      { productName: "Print Poster A3", sku: "PR-A3", quantity: 3, unitPrice: 12000, subtotal: 36000 },
      { productName: "Stiker Vinyl A4", sku: "ST-VN", quantity: 4, unitPrice: 15000, subtotal: 60000 },
    ],
    totalItems: 7,
    total: 96000,
    paymentMethod: "CASH",
    cashReceived: 100000,
    change: 4000,
    cashierName: "Kasir-01",
    branchName: "Cabang #1 - Pusat",
  },
];
