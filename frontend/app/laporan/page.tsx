"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton, StatsSkeleton } from "@/app/components/Skeletons";

const LaporanPage = dynamic(
  () => import("@/app/components/pages/LaporanPage").then((m) => m.LaporanPage),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 pb-8">
        <StatsSkeleton variant="kpi" />
        <ChartSkeleton />
      </div>
    ),
  }
);

export default function Page() {
  return <LaporanPage />;
}
