import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium",
  {
    variants: {
      variant: {
        sage: "bg-sage-light/40 text-teal",
        amber: "bg-amber/40 text-teal",
        rose: "bg-rose/40 text-teal",
        cloud: "bg-cloud/50 text-teal/70",
      },
    },
    defaultVariants: { variant: "sage" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
