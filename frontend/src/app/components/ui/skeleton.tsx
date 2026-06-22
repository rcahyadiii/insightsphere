import { cn } from "./utils";
import { R } from "@/app/lib/radii";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(`bg-accent animate-pulse ${R.md}`, className)}
      {...props}
    />
  );
}

export { Skeleton };
