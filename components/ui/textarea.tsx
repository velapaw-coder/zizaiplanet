import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-28 w-full rounded-xl border border-[#D4E4E8] bg-white px-3 py-3 text-sm leading-7 text-[#1C3A42] outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7EB6D9]",
          className,
        )}
        {...props}
      />
    );
  },
);
