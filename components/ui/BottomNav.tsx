"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ items }: { items: { href: string; label: string; icon: LucideIcon; match?: "prefix" }[] }) {
  const pathname = usePathname();
  const activeFor = (item: { href: string; match?: "prefix" }) => {
    if (item.match !== "prefix" || pathname.includes("/track")) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
  const visible = items.some((item) => activeFor(item));
  if (!visible) return null;
  return (
    <>
      <div className="h-20" aria-hidden />
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white safe-bottom">
      <ul className="grid grid-cols-5 px-2 py-1">
        {items.map((item) => {
          const active = activeFor(item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} className={cn("flex flex-col items-center gap-1 py-2 text-[11px] font-medium", active ? "text-brand" : "text-zinc-500")}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
