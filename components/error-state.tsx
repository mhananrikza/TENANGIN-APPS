import { RefreshCcw, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border border-rose-dark/20 bg-rose/15 px-4 py-3.5 dark:bg-rose/10",
        className
      )}
      role="alert"
    >
      <CloudOff size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-rose-dark" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-relaxed text-teal dark:text-dark-text">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-teal underline decoration-teal/30 underline-offset-2 dark:text-dark-text"
          >
            <RefreshCcw size={13} strokeWidth={1.75} />
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
