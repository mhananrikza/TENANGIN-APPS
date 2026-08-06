import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-[13px] font-medium text-teal/70 dark:text-dark-text/70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
