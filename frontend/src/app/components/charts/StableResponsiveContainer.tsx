"use client";

import {
  ResponsiveContainer,
  type ResponsiveContainerProps,
} from "recharts";

const INITIAL_DIMENSION = { width: 1, height: 1 };

export function StableResponsiveContainer({
  debounce = 200,
  initialDimension = INITIAL_DIMENSION,
  minHeight = 1,
  minWidth = 1,
  ...props
}: ResponsiveContainerProps) {
  return (
    <ResponsiveContainer
      debounce={debounce}
      initialDimension={initialDimension}
      minHeight={minHeight}
      minWidth={minWidth}
      {...props}
    />
  );
}
