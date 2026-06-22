type DemoUrgency = "tinggi" | "sedang" | "rendah";
type DemoNotifType = "anomali" | "kritis" | "prediksi" | "peluang" | "sistem";

type DemoNotification = {
  id: string;
  type: DemoNotifType;
  title: string;
  message: string;
  time: string;
  urgency: DemoUrgency;
  isRead: boolean;
  link?: string;
  linkText?: string;
};

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: "1", type: "anomali", title: "Anomali: Penjualan Chitato naik 45%", message: "Analisis AI menunjukkan efek promo bundling dengan Minyak Goreng.", time: "5 menit lalu", urgency: "tinggi", isRead: false, link: "/penjelasan-ai", linkText: "Lihat XAI" },
  { id: "2", type: "kritis", title: "3 Produk Butuh Restok", message: "Beras Premium, Roti Tawar, dan Sabun Cair mendekati stok nol.", time: "12 menit lalu", urgency: "tinggi", isRead: false, link: "/inventaris", linkText: "Buka Inventaris" },
  { id: "3", type: "prediksi", title: "Model AI Diperbarui", message: "Akurasi prediksi retail naik dari 93.1% ke 94.3% setelah retraining.", time: "1 jam lalu", urgency: "sedang", isRead: true },
  { id: "4", type: "peluang", title: "Peluang: Bundling Beras + Minyak", message: "Terdapat korelasi 72% pembelian bersama di Cabang Pusat.", time: "2 jam lalu", urgency: "rendah", isRead: true, link: "/penjelasan-ai", linkText: "Detail Peluang" },
  { id: "5", type: "anomali", title: "Model Drift: Kategori Dairy", message: "Akurasi kategori Susu turun 5%. Perlu penyesuaian parameter.", time: "3 jam lalu", urgency: "sedang", isRead: true, link: "/pengaturan/ai", linkText: "Cek Config" },
  { id: "6", type: "sistem", title: "Laporan Mingguan Siap", message: "Laporan periode 7-14 Apr 2026 telah digenerate secara otomatis.", time: "5 jam lalu", urgency: "rendah", isRead: true, link: "/laporan", linkText: "Unduh PDF" },
  { id: "7", type: "kritis", title: "Overstock: Susu Ultra 1L", message: "120 unit mendekati masa kadaluarsa dalam 5 hari ke depan.", time: "6 jam lalu", urgency: "tinggi", isRead: true, link: "/inventaris", linkText: "Tindak Lanjuti" },
];

export const DEMO_NOTIFICATION_POLL_TEMPLATES: DemoNotification[] = [
  { id: "", type: "anomali", title: "Anomali Baru: Lonjakan Aqua 500ml", message: "Permintaan naik 60% tiba-tiba. Deteksi event di sekitar Bandara.", time: "", urgency: "tinggi", isRead: false, link: "/prediksi-stok", linkText: "Cek Prediksi" },
  { id: "", type: "kritis", title: "Stok Kritis: Tinta Epson 003", message: "Sisa stok 2 unit. Segera lakukan reorder sebelum kehabisan.", time: "", urgency: "tinggi", isRead: false, link: "/inventaris", linkText: "Reorder" },
  { id: "", type: "prediksi", title: "Prediksi Diperbarui: Minggu Depan", message: "Model merevisi forecast +12% untuk kategori ATK. Periksa dashboard.", time: "", urgency: "sedang", isRead: false, link: "/prediksi-stok", linkText: "Lihat Forecast" },
  { id: "", type: "peluang", title: "Peluang: Cross-sell Kertas + Tinta", message: "Korelasi pembelian 68% terdeteksi. Pertimbangkan bundling promo.", time: "", urgency: "rendah", isRead: false, link: "/penjelasan-ai", linkText: "Detail" },
];
