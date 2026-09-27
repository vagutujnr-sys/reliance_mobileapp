import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PinForm } from "@/components/auth/PinForm";

export default function OwnerPinPage() {
  return (
    <div className="min-h-dvh bg-white px-5">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/owner/profile" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="font-semibold">Change PIN</h1>
      </header>
      <PinForm />
    </div>
  );
}
