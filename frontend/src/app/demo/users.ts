type DemoUserRole = "admin" | "owner" | "cashier" | "inventory_manager";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: DemoUserRole;
  store: string;
  branch: string;
  status: "active" | "inactive";
  lastActive: Date;
  avatar?: string;
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "usr-1",
    name: "Ahmad Faiz",
    email: "faiz@example.test",
    phone: "081234567890",
    role: "admin",
    store: "Toko Pusat - Jakarta",
    branch: "Cabang Jakarta Selatan",
    status: "active",
    lastActive: new Date(2024, 2, 15, 9, 30),
  },
  {
    id: "usr-2",
    name: "Rini Susanti",
    email: "rini@example.test",
    phone: "082345678901",
    role: "cashier",
    store: "Toko Pusat - Jakarta",
    branch: "Cabang Jakarta Selatan",
    status: "active",
    lastActive: new Date(2024, 2, 15, 8, 45),
  },
  {
    id: "usr-3",
    name: "Budi Hartono",
    email: "budi@example.test",
    phone: "083456789012",
    role: "inventory_manager",
    store: "Toko Pusat - Jakarta",
    branch: "Cabang Jakarta Utara",
    status: "active",
    lastActive: new Date(2024, 2, 14, 16, 20),
  },
  {
    id: "usr-4",
    name: "Siti Aminah",
    email: "siti@example.test",
    phone: "084567890123",
    role: "cashier",
    store: "Toko Cabang - Bandung",
    branch: "Cabang Bandung",
    status: "inactive",
    lastActive: new Date(2024, 2, 10, 11, 0),
  },
  {
    id: "usr-5",
    name: "Dewi Kusuma",
    email: "dewi@example.test",
    phone: "085678901234",
    role: "admin",
    store: "Toko Cabang - Bandung",
    branch: "Cabang Bandung",
    status: "active",
    lastActive: new Date(2024, 2, 15, 7, 15),
  },
  {
    id: "usr-6",
    name: "Eko Prasetyo",
    email: "eko@example.test",
    phone: "086789012345",
    role: "owner",
    store: "Toko Pusat - Jakarta",
    branch: "Kantor Pusat",
    status: "active",
    lastActive: new Date(2024, 2, 15, 10, 0),
  },
];
