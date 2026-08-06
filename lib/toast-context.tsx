"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, type LucideIcon } from "lucide-react";
import { cn } from "./utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const ICONS: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "animate-toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full border px-4 py-3 shadow-soft backdrop-blur-md",
                t.variant === "success" &&
                  "border-sage/30 bg-white/95 text-teal dark:border-sage/30 dark:bg-dark-card/95 dark:text-dark-text",
                t.variant === "error" &&
                  "border-rose-dark/30 bg-white/95 text-teal dark:bg-dark-card/95 dark:text-dark-text",
                t.variant === "info" &&
                  "border-cloud bg-white/95 text-teal dark:bg-dark-card/95 dark:text-dark-text"
              )}
              role="status"
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                className={cn(
                  "shrink-0",
                  t.variant === "success" && "text-sage",
                  t.variant === "error" && "text-rose-dark",
                  t.variant === "info" && "text-teal/60"
                )}
              />
              <span className="text-[14px] leading-snug">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
