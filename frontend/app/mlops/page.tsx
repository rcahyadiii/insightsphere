"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton, StatsSkeleton } from "@/app/components/Skeletons";

const MLOpsDashboardPage = dynamic(
  () => import("@/app/components/pages/MLOpsDashboardPage").then((m) => m.MLOpsDashboardPage),
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
  return <MLOpsDashboardPage />;
}
