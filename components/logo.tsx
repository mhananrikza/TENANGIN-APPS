import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt="TENANGIN"
      width={size}
      height={size}
      priority
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[22px] font-medium tracking-tight text-teal dark:text-dark-text", className)}>
      TENANGIN
    </span>
  );
}
