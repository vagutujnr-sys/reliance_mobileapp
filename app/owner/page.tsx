import Link from "next/link";
import { Bell, Calendar, MessageCircle, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getClientHome } from "@/lib/server/owner-service";
import { greeting } from "@/lib/format";
import { initials } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function OwnerHomePage() {
  const profile = await requireProfile(["client"]);
  const home = await getClientHome(profile.id);
  const vehicle = home.vehicles[0];
  return (
    <div className="min-h-dvh bg-white pb-28">
      <header className="bg-ink px-5 pb-5 text-white safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-brand font-bold">{initials(home.name)}</div>
            <div>
              <p className="text-sm text-white/70">{greeting()}</p>
              <h1 className="text-xl font-semibold">{home.name}</h1>
            </div>
          </div>
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10"><Bell className="h-5 w-5" />{home.unread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" /> : null}</span>
        </div>
      </header>
      <section className="px-5 pt-5">
        <p className="text-sm font-semibold text-muted">My Vehicle</p>
        {vehicle ? (
          <article className="mt-3 rounded-[28px] border border-line p-4 shadow-sm">
            <div className="flex gap-3">
              <img src={vehicle.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-20 w-28 rounded-2xl object-cover" />
              <div>
                <h2 className="font-semibold">{vehicle.title}</h2>
                <p className="text-sm text-muted">{vehicle.colour} · {vehicle.year}</p>
                <p className="text-sm font-medium">{vehicle.registration}</p>
                <StatusPill status={vehicle.status} label={vehicle.statusLabel} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${vehicle.insured ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{vehicle.insured ? "Insured" : "Not Insured"}</span>
              {vehicle.lastMilestone ? <span>Last milestone: {vehicle.lastMilestone}</span> : <span>ETA {vehicle.etaLabel ?? "to be confirmed"}</span>}
            </div>
            <Link href={`/owner/vehicle/${vehicle.id}/track`} className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white">Track Vehicle</Link>
          </article>
        ) : <p className="mt-4 rounded-3xl bg-canvas p-6 text-sm">No vehicle is linked to this account yet.</p>}
        {home.vehicles.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-auto">
            {home.vehicles.map((item) => <Link key={item.id} href={`/owner/vehicle/${item.id}`} className="shrink-0 rounded-full bg-canvas px-3 py-2 text-sm">{item.registration}</Link>)}
          </div>
        ) : null}
        <h2 className="mb-3 mt-8 font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3 text-center text-xs font-medium">
          <Link href="/owner/payments" className="rounded-3xl bg-canvas py-4"><Wallet className="mx-auto mb-2 h-5 w-5" />Payments</Link>
          <Link href="/owner/vehicle" className="rounded-3xl bg-canvas py-4"><Calendar className="mx-auto mb-2 h-5 w-5" />Schedule</Link>
          <Link href="/owner/chat" className="rounded-3xl bg-canvas py-4"><MessageCircle className="mx-auto mb-2 h-5 w-5" />Chat with Reliance</Link>
        </div>
      </section>
    </div>
  );
}
