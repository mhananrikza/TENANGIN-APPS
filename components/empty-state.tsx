import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-cloud/70 bg-white/60 px-6 py-10 text-center dark:border-dark-card dark:bg-dark-card/40",
        className
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/10">
        <Icon size={26} strokeWidth={1.5} className="text-sage" />
      </span>
      <p className="text-[15px] font-medium text-teal dark:text-dark-text">{title}</p>
      <p className="max-w-[240px] text-[13px] leading-relaxed text-teal/50 dark:text-dark-text/50">
        {description}
      </p>
      {action}
    </div>
  );
}
