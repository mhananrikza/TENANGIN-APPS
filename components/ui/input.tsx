import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-input border border-cloud bg-white px-4 text-[16px] text-teal placeholder:text-teal/40 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50 dark:bg-dark-card dark:text-dark-text dark:border-dark-card",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
