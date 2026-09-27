"use client";

import { ClipboardList, Home, MapPin, User, Wallet } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";

const items = [
  { href: "/driver", label: "Home", icon: Home },
  { href: "/driver/trips", label: "Trips", icon: ClipboardList },
  { href: "/driver/map", label: "Map", icon: MapPin },
  { href: "/driver/payments", label: "Payments", icon: Wallet },
  { href: "/driver/profile", label: "Profile", icon: User },
];

export function DriverShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-app">
      {children}
      <BottomNav items={items} />
    </div>
  );
}
