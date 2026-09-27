"use client";

import { Car, Home, MessageCircle, User, Wallet } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";

const items = [
  { href: "/owner", label: "Home", icon: Home },
  { href: "/owner/vehicle", label: "Vehicle", icon: Car, match: "prefix" as const },
  { href: "/owner/payments", label: "Payments", icon: Wallet },
  { href: "/owner/chat", label: "Chat", icon: MessageCircle },
  { href: "/owner/profile", label: "Profile", icon: User },
];

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-app">
      {children}
      <BottomNav items={items} />
    </div>
  );
}
