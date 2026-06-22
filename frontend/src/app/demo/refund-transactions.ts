type DemoRefundTransaction = {
  id: string;
  date: string;
  time: string;
  total: number;
  method: string;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
  }[];
};

export const DEMO_REFUND_TRANSACTIONS: DemoRefundTransaction[] = [
  {
    id: "TXN-20260422-001",
    date: "22 Apr 2026",
    time: "09:15",
    total: 45000,
    method: "CASH",
    items: [
      { id: "i1", name: "Fotokopi A4 HB (50 lembar)", qty: 1, price: 10000 },
      { id: "i2", name: "Kertas HVS A4 80gr", qty: 1, price: 35000 },
    ],
  },
  {
    id: "TXN-20260422-002",
    date: "22 Apr 2026",
    time: "10:30",
    total: 27500,
    method: "QRIS",
    items: [
      { id: "i3", name: "Print A4 Warna (5 lembar)", qty: 1, price: 7500 },
      { id: "i4", name: "Tinta Printer Hitam", qty: 1, price: 20000 },
    ],
  },
  {
    id: "TXN-20260421-015",
    date: "21 Apr 2026",
    time: "14:50",
    total: 18000,
    method: "CASH",
    items: [
      { id: "i5", name: "Jilid Spiral", qty: 2, price: 10000 },
      { id: "i6", name: "Staples Joyko", qty: 1, price: 8000 },
    ],
  },
];
