import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-input bg-cloud/50 dark:bg-dark-card",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-card border border-cloud/60 bg-white p-5 shadow-soft dark:border-dark-card dark:bg-dark-card",
        className
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-4/5" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-cloud/60 bg-white p-4 shadow-soft dark:border-dark-card dark:bg-dark-card">
      <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-2/3 self-start rounded-card" />
      <Skeleton className="h-9 w-1/2 self-end rounded-card" />
      <Skeleton className="h-14 w-3/4 self-start rounded-card" />
    </div>
  );
}
