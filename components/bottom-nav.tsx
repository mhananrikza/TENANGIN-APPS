"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sprout, MessageCircle, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/beranda", label: "Beranda", icon: Home },
  { href: "/bertumbuh", label: "Bertumbuh", icon: Sprout },
  { href: "/companion", label: "Teman AI", icon: MessageCircle, center: true },
  { href: "/planner", label: "Planner", icon: ListChecks },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cloud/60 bg-sand/95 backdrop-blur safe-bottom dark:bg-dark-bg/95 dark:border-dark-card">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon, center }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          if (center) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center -translate-y-3"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-soft transition-colors",
                    active ? "bg-sage text-white" : "bg-sage-light/60 text-teal"
                  )}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <span className="mt-1 text-[11px] font-medium text-teal/70 dark:text-dark-text/70">
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-2 py-2"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                className={active ? "text-sage" : "text-teal/50 dark:text-dark-text/50"}
              />
              {active && <span className="h-1 w-1 rounded-full bg-sage" />}
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-sage" : "text-teal/50 dark:text-dark-text/50"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
