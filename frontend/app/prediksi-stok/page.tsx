"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton, PredictionTableSkeleton } from "@/app/components/Skeletons";

const PrediksiStokPage = dynamic(
  () => import("@/app/components/pages/PrediksiStokPage").then((m) => m.PrediksiStokPage),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 pb-6">
        <ChartSkeleton />
        <PredictionTableSkeleton />
      </div>
    ),
  }
);

export default function Page() {
  return <PrediksiStokPage />;
}
