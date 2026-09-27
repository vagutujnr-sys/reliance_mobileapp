"use client";

import Link from "next/link";
import { Bell, Camera, ChevronRight, MapPin, Navigation, QrCode } from "lucide-react";
import { useState } from "react";
import { greeting } from "@/lib/format";
import type { DriverHome, TripSummary } from "@/lib/data/views";
import { initials } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";

export function DriverHomeView({ data }: { data: DriverHome }) {
  const [tab, setTab] = useState<"current" | "next">("current");
  const trip = tab === "current" ? data.current : data.next;
  return (
    <div className="min-h-dvh bg-white pb-28">
      <header className="bg-ink px-5 pb-5 text-white safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-brand bg-white/10 text-sm font-bold">{initials(data.name)}</div>
            <div>
              <p className="text-sm text-white/70">{greeting()}</p>
              <h1 className="text-xl font-semibold">{data.name}</h1>
            </div>
          </div>
          <Link href="/driver/notifications" className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10">
            <Bell className="h-5 w-5" />
            {data.unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" /> : null}
          </Link>
        </div>
      </header>
      <section className="px-5 pt-5">
        <div className="grid grid-cols-2 rounded-full bg-canvas p-1 text-sm font-semibold">
          <button type="button" onClick={() => setTab("current")} className={tab === "current" ? "rounded-full bg-brand py-3 text-white" : "py-3 text-ink"}>Current Trip</button>
          <button type="button" onClick={() => setTab("next")} className={tab === "next" ? "rounded-full bg-brand py-3 text-white" : "py-3 text-ink"}>Next Trip</button>
        </div>
        {trip ? <TripCard trip={trip} /> : <Empty tab={tab} />}
        <h2 className="mb-3 mt-8 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Action href={data.current ? `/driver/trips/${data.current.id}/pickup` : "/driver/trips"} icon={Camera} label="Take Photo" />
          <Action href={data.current ? (data.current.status === "in_transit" ? `/driver/trips/${data.current.id}/tracking` : `/driver/trips/${data.current.id}/pickup`) : "/driver/trips"} icon={Navigation} label="Start Trip" />
          <Action href="/driver/handover" icon={QrCode} label="Handover" />
        </div>
      </section>
    </div>
  );
}

function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <article className="mt-5 rounded-[28px] border border-line p-4 shadow-[0_10px_30px_rgba(17,17,19,0.05)]">
      <div className="flex gap-3">
        <img src={trip.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-16 w-24 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold leading-tight">{trip.title}</h2>
            <StatusPill status={trip.status} label={trip.statusLabel} />
          </div>
          <p className="mt-1 text-sm text-muted">{trip.colour} · {trip.year}</p>
          <p className="text-sm font-medium">{trip.registration}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Place color="bg-brand" label="Pickup Location" value={trip.pickup} meta={trip.pickupLabel} />
        <Place color="bg-violet-600" label="Drop Location" value={trip.dropoff} meta={`Est. ${trip.distanceKm} km`} />
      </div>
      <Link href={`/driver/trips/${trip.id}`} className="mt-5 flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white">
        View Trip Details
      </Link>
    </article>
  );
}

function Place({ color, label, value, meta }: { color: string; label: string; value: string; meta: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1 h-3 w-3 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium">{value}</p>
        <p className="text-sm text-muted">{meta}</p>
      </div>
    </div>
  );
}

function Empty({ tab }: { tab: "current" | "next" }) {
  return (
    <div className="mt-5 rounded-[28px] bg-canvas px-5 py-10 text-center">
      <MapPin className="mx-auto h-8 w-8 text-zinc-400" />
      <p className="mt-3 font-semibold">{tab === "current" ? "No current trip" : "No upcoming trip"}</p>
      <p className="mt-1 text-sm text-muted">Reliance will assign the next vehicle here.</p>
    </div>
  );
}

function Action({ href, icon: Icon, label }: { href: string; icon: typeof Camera; label: string }) {
  return (
    <Link href={href} className="grid justify-items-center gap-2 rounded-3xl bg-canvas px-2 py-4 text-center text-xs font-medium">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm"><Icon className="h-5 w-5" /></span>
      {label}
      <ChevronRight className="hidden" />
    </Link>
  );
}
