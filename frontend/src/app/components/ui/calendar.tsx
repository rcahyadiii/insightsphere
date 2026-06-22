"use client";

import * as React from "react";
import { cn } from "./utils";

type CalendarProps = React.ComponentProps<"div"> & {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

function Calendar({ className, selected, onSelect, ...props }: CalendarProps) {
  const value = selected ? selected.toISOString().slice(0, 10) : "";

  return (
    <div className={cn("rounded-xl border bg-white p-3 dark:bg-slate-900", className)} {...props}>
      <input
        type="date"
        value={value}
        onChange={(event) => {
          const next = event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined;
          onSelect?.(next);
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

export { Calendar };
