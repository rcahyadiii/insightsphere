import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { TABLE } from "@/app/lib/data";
import { Z } from "@/app/lib/elevation";

interface ResponsiveTableProps {
  children: ReactNode;
  label: string;
  className?: string;
  scrollerClassName?: string;
  minWidthClassName?: string;
}

export function ResponsiveTable({
  children,
  label,
  className,
  scrollerClassName,
  minWidthClassName = TABLE.minWidth.default,
}: ResponsiveTableProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(TABLE.wrapper, "relative", scrollerClassName)}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        <div
          aria-hidden="true"
          className={cn(Z.raised, "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent md:hidden")}
        />
        <div className={cn("w-full", minWidthClassName)}>{children}</div>
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-end md:hidden">
        <div className="h-1 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
