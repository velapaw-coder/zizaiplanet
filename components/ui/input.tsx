import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#D4E4E8] bg-white px-3 text-sm text-[#1C3A42] outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7EB6D9]",
        className,
      )}
      {...props}
    />
  );
}
