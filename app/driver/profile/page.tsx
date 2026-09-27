import Link from "next/link";
import { ChevronRight, FileText, History, KeyRound, LifeBuoy, LogOut, Repeat } from "lucide-react";
import { logout } from "@/lib/actions/app";
import { requireProfile } from "@/lib/auth/session";
import { getDriverProfile } from "@/lib/server/driver-service";
import { initials } from "@/lib/utils";

export default async function DriverProfilePage() {
  const profile = await requireProfile(["driver"]);
  const data = await getDriverProfile(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28 pt-8 text-center safe-top">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink text-2xl font-bold text-white">{initials(data.name)}</div>
      <h1 className="mt-3 text-2xl font-bold">{data.name}</h1>
      <p className="text-sm text-muted">Driver ID: {data.code}</p>
      <p className="mt-1 text-sm font-semibold text-success">Active</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-3xl bg-canvas p-4"><p className="text-2xl font-bold">{data.cars}</p><p className="text-sm text-muted">Cars Transported</p></div>
        <div className="rounded-3xl bg-canvas p-4"><p className="text-2xl font-bold">{data.distance}</p><p className="text-sm text-muted">Distance Recorded</p></div>
      </div>
      <div className="mt-6 space-y-2 text-left">
        <Row href="/driver/profile/documents" icon={FileText} label="Documents" />
        <Row href="/driver/trips" icon={History} label="Trip History" />
        <Row href="/driver/profile/handovers" icon={Repeat} label="Vehicle Handover History" />
        <Row href="/driver/payments" icon={FileText} label="Payments" />
        <Row href="/driver/profile/pin" icon={KeyRound} label="Change PIN" />
        <Row href="/driver/chat" icon={LifeBuoy} label="Help & Support" />
      </div>
      <form action={logout} className="mt-4">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-brand"><LogOut className="h-4 w-4" /> Logout</button>
      </form>
    </div>
  );
}

function Row({ href, icon: Icon, label }: { href: string; icon: typeof FileText; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl px-2 py-3">
      <Icon className="h-5 w-5 text-zinc-500" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </Link>
  );
}
