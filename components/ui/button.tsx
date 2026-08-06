import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-[15px] font-medium transition-transform duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-sage text-white hover:bg-sage/90",
        secondary:
          "border border-teal text-teal bg-transparent hover:bg-teal/5 dark:border-dark-text dark:text-dark-text",
        ghost: "text-sage hover:bg-sage/10",
        emergency:
          "bg-rose text-teal rounded-full hover:bg-rose/90 shadow-soft",
      },
      size: {
        default: "h-[52px] px-6",
        sm: "h-10 px-4 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
