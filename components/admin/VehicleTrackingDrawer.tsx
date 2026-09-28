"use client";

import Link from "next/link";
import { Car, MessageCircle, X } from "lucide-react";
import type { FleetUnit } from "@/lib/data/views";

function timeLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function DetailRows({ values }: { values: [string, string][] }) {
  return <dl className="divide-y divide-line text-sm">
    {values.map(([label, value]) => <div key={label} className="grid grid-cols-[112px_1fr] gap-3 py-2">
      <dt className="text-xs text-muted">{label}</dt><dd className="break-words font-medium">{value}</dd>
    </div>)}
  </dl>;
}

export function VehicleTrackingDrawer({ unit, onClose }: { unit: FleetUnit; onClose: () => void }) {
  return (
    <aside aria-label="Vehicle tracking details" className="absolute inset-y-2 right-2 z-10 flex w-[min(360px,calc(100%-1rem))] flex-col border border-line bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Tracking details</h2>
        <button type="button" aria-label="Close vehicle details" onClick={onClose} className="grid h-8 w-8 place-items-center text-muted hover:bg-canvas"><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-line p-4">
          <div className="mb-3 grid aspect-[16/8] place-items-center overflow-hidden bg-canvas">
            {unit.imageUrl ? <img src={unit.imageUrl} alt={`${unit.title} ${unit.registration}`} className="h-full w-full object-cover" /> : <Car className="h-10 w-10 text-muted" />}
          </div>
          <p className="text-base font-semibold">{unit.title}</p>
          <p className="text-sm text-muted">{unit.registration} · {unit.referenceNumber}</p>
          <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase"><span className={`h-2 w-2 rounded-full ${unit.delayed ? "bg-amber-500" : "bg-emerald-600"}`} />{unit.statusLabel}</span>
        </div>
        <section className="border-b border-line px-4 py-3">
          <h3 className="mb-1 text-[11px] font-bold uppercase text-muted">Journey</h3>
          <DetailRows values={[
            ["Origin", unit.origin],
            ["Destination", unit.destination],
            ["Current position", `${unit.latitude.toFixed(5)}, ${unit.longitude.toFixed(5)}`],
            ["ETA", timeLabel(unit.eta)],
            ["Trip distance", `${Math.round(unit.distanceKm).toLocaleString()} km`],
          ]} />
        </section>
        <section className="border-b border-line px-4 py-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase text-muted">Current driver</h3>
          <div className="mb-2 flex items-center gap-3">
            {unit.driverAvatarUrl ? <img src={unit.driverAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-xs font-semibold">{initials(unit.driverName)}</span>}
            <div><p className="text-sm font-semibold">{unit.driverName}</p><p className="text-xs text-muted">Driver ID: {unit.driverCode}</p></div>
          </div>
          <DetailRows values={[["Phone", unit.driverPhone], ["Status", unit.driverStatus], ["Last active", timeLabel(unit.driverLastActiveAt)]]} />
        </section>
        <section className="px-4 py-3">
          <h3 className="mb-1 text-[11px] font-bold uppercase text-muted">Tracking</h3>
          <DetailRows values={[
            ["Last GPS update", timeLabel(unit.recordedAt)],
            ["Speed", unit.speedKmh == null ? "Not available" : `${Math.round(unit.speedKmh)} km/h`],
            ["Heading", unit.heading == null ? "Not available" : `${Math.round(unit.heading)}°`],
          ]} />
        </section>
      </div>
      <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-3">
        <Link href={`/admin/trips?trip=${encodeURIComponent(unit.tripId)}`} className="flex h-9 items-center justify-center gap-2 bg-ink text-xs font-semibold text-white">View Trip</Link>
        <Link href="/admin/chat" className="flex h-9 items-center justify-center gap-2 border border-line text-xs font-semibold"><MessageCircle className="h-4 w-4" />Message</Link>
      </footer>
    </aside>
  );
}
