import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[96px] w-full rounded-input border border-cloud bg-white px-4 py-3 text-[16px] leading-relaxed text-teal placeholder:text-teal/40 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50 dark:bg-dark-card dark:text-dark-text dark:border-dark-card",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
