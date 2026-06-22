import {
  Activity,
  BarChart3,
  BrainCircuit,
  Clock,
  Database,
  GitBranch,
  TrendingDown,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DemoServiceStatus = "online" | "degraded" | "offline";

type DemoModelVersion = {
  version: string;
  trainedAt: string;
  accuracy: number;
  mape: number;
  rmse: number;
  samples: number;
  status: "active" | "archived" | "staging";
};

type DemoTrainingJob = {
  id: string;
  model: string;
  trigger: "scheduled" | "manual" | "drift";
  startedAt: string;
  duration: string;
  samples: number;
  accuracy: number;
  status: "success" | "failed" | "running";
};

type DemoMlopsDashboardData = {
  periodLabel: string;
  accuracyTimeline: {
    date: string;
    v1: number | null;
    v2: number | null;
    v3: number | null;
  }[];
  featureImportance: {
    feature: string;
    importance: number;
  }[];
  categoryMetrics: {
    category: string;
    mape: number;
    accuracy: number;
    drift: boolean;
  }[];
  activeModelKpis: {
    labelKey: string;
    value: string;
    delta: string;
    up: boolean;
    icon: LucideIcon;
  }[];
  trainingJobs: DemoTrainingJob[];
  modelVersions: DemoModelVersion[];
  services: {
    label: string;
    status: DemoServiceStatus;
    uptime: string;
    icon: LucideIcon;
    detail: string;
  }[];
};

export const DEMO_MLOPS_DASHBOARD: DemoMlopsDashboardData = {
  periodLabel: "April 2026",
  accuracyTimeline: [
    { date: "01 Apr", v1: 91.2, v2: null, v3: null },
    { date: "05 Apr", v1: 91.8, v2: null, v3: null },
    { date: "08 Apr", v1: 92.1, v2: 93.1, v3: null },
    { date: "12 Apr", v1: null, v2: 93.4, v3: null },
    { date: "15 Apr", v1: null, v2: 93.7, v3: null },
    { date: "18 Apr", v1: null, v2: 94.1, v3: 94.3 },
    { date: "20 Apr", v1: null, v2: null, v3: 94.5 },
    { date: "22 Apr", v1: null, v2: null, v3: 94.8 },
  ],
  featureImportance: [
    { feature: "Hari dalam Minggu", importance: 0.24 },
    { feature: "Stok Awal Periode", importance: 0.21 },
    { feature: "Harga Jual", importance: 0.17 },
    { feature: "Promo Aktif", importance: 0.12 },
    { feature: "Musim / Cuaca", importance: 0.1 },
    { feature: "Kategori Produk", importance: 0.08 },
    { feature: "Lead Time", importance: 0.05 },
    { feature: "Retur Pelanggan", importance: 0.03 },
  ],
  categoryMetrics: [
    { category: "Kertas", mape: 4.2, accuracy: 95.8, drift: false },
    { category: "Tinta", mape: 6.1, accuracy: 93.9, drift: false },
    { category: "ATK", mape: 5.3, accuracy: 94.7, drift: false },
    { category: "Jilid", mape: 8.9, accuracy: 91.1, drift: true },
    { category: "Laminating", mape: 7.2, accuracy: 92.8, drift: false },
  ],
  activeModelKpis: [
    { labelKey: "mlops.kpi.accuracy", value: "94.8%", delta: "+0.5%", up: true, icon: Activity },
    { labelKey: "mlops.kpi.mape", value: "5.2%", delta: "-0.3%", up: true, icon: TrendingDown },
    { labelKey: "mlops.kpi.rmse", value: "12.4", delta: "-0.7", up: true, icon: BarChart3 },
    { labelKey: "mlops.kpi.dataset", value: "124.5K", delta: "+2.4K", up: true, icon: Database },
    { labelKey: "mlops.kpi.active_version", value: "v3.2.1", delta: "22 Apr", up: true, icon: GitBranch },
  ],
  trainingJobs: [
    { id: "TRN-044", model: "retail-v3.2.1", trigger: "scheduled", startedAt: "22 Apr 00:00", duration: "8m 42s", samples: 124500, accuracy: 94.8, status: "success" },
    { id: "TRN-043", model: "retail-v3.2.0", trigger: "manual", startedAt: "20 Apr 14:15", duration: "9m 11s", samples: 122800, accuracy: 94.5, status: "success" },
    { id: "TRN-042", model: "retail-v3.1.5", trigger: "drift", startedAt: "18 Apr 00:00", duration: "8m 58s", samples: 120100, accuracy: 94.3, status: "success" },
    { id: "TRN-041", model: "retail-v3.1.4", trigger: "scheduled", startedAt: "15 Apr 00:00", duration: "9m 03s", samples: 118600, accuracy: 94.1, status: "success" },
    { id: "TRN-040", model: "retail-v3.1.3", trigger: "manual", startedAt: "12 Apr 11:30", duration: "12m 15s", samples: 116000, accuracy: 93.4, status: "failed" },
  ],
  modelVersions: [
    { version: "retail-v3.2.1", trainedAt: "22 Apr 2026", accuracy: 94.8, mape: 5.2, rmse: 12.4, samples: 124500, status: "active" },
    { version: "retail-v3.2.0", trainedAt: "20 Apr 2026", accuracy: 94.5, mape: 5.5, rmse: 13.1, samples: 122800, status: "staging" },
    { version: "retail-v3.1.5", trainedAt: "18 Apr 2026", accuracy: 94.3, mape: 5.7, rmse: 13.8, samples: 120100, status: "archived" },
  ],
  services: [
    { label: "ML Engine", status: "online", uptime: "99.8%", icon: BrainCircuit, detail: "retail-v3.2.1 - GPU 0 - CUDA 12.1" },
    { label: "Anomaly Detector", status: "online", uptime: "99.5%", icon: Zap, detail: "IsolationForest - threshold 0.08" },
    { label: "Disaggregator", status: "degraded", uptime: "97.2%", icon: GitBranch, detail: "Latency tinggi - CPU 89%" },
    { label: "Job Scheduler", status: "online", uptime: "100%", icon: Clock, detail: "APScheduler - midnight UTC+7" },
  ],
};
