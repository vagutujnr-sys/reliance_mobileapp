"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Car, CreditCard, LayoutDashboard, Map, Menu, MessageCircle, Receipt, Settings, Truck, Users, UserRound, X } from "lucide-react";
import { logout } from "@/lib/actions/app";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/live", label: "Live Tracking", icon: Map },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/drivers", label: "Drivers", icon: UserRound },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/trips", label: "Trips", icon: Truck },
  { href: "/admin/shipments", label: "Shipments", icon: Truck },
  { href: "/admin/invoices", label: "Invoicing", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const fullBleedMap = pathname === "/admin/live";
  const nav = (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/brand/main-logo.png" alt="" className="h-12 w-12 rounded-full object-cover" />
        <div>
          <p className="text-sm font-bold leading-tight">RELIANCE</p>
          <p className="text-[10px] tracking-wide text-white/60">MOBILITY SOLUTIONS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-auto px-3">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded px-3 py-2 text-sm", active ? "bg-brand font-semibold" : "text-white/75 hover:bg-white/5")}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="border-t border-white/10 p-4">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-white/50">Reliance Mobility</p>
        <button className="mt-3 text-sm text-white/70">Log out</button>
      </form>
    </div>
  );
  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] lg:block">{nav}</aside>
      {open ? <div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="relative h-full w-[250px]">{nav}</div></div> : null}
      <main className={`relative h-dvh lg:ml-[250px] ${fullBleedMap ? "overflow-hidden" : "overflow-y-auto"}`}>
        <button type="button" aria-label="Open navigation" className={fullBleedMap ? "absolute left-3 top-3 z-50 grid h-10 w-10 place-items-center border border-line bg-white shadow-sm lg:hidden" : "m-3 grid h-10 w-10 place-items-center rounded border border-line bg-white lg:hidden"} onClick={() => setOpen(true)}>{open ? <X /> : <Menu />}</button>
        <div className={fullBleedMap ? "h-full" : "px-4 pb-10 lg:px-8 lg:py-6"}>{children}</div>
      </main>
    </div>
  );
}
