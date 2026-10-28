import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7EB6D9] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#2A9B8F] text-white hover:bg-[#217F76]",
        outline: "border border-[#2A9B8F] bg-transparent text-[#2A9B8F] hover:bg-[#E5F4F2]",
        ghost: "bg-transparent text-[#3D6A72] hover:bg-[#E5F4F2]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
