"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/app/components/Skeletons";

const XAIPage = dynamic(
  () => import("@/app/components/pages/XAIPage").then((m) => m.XAIPage),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 pb-8">
        <ChartSkeleton />
        <ChartSkeleton minimal />
      </div>
    ),
  }
);

export default function Page() {
  return <XAIPage />;
}
