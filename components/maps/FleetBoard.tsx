"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { FleetUnit } from "@/lib/data/views";
import { FleetMap } from "@/components/maps/FleetMap";
import { VehicleTrackingDrawer } from "@/components/admin/VehicleTrackingDrawer";
import { StatusPill } from "@/components/ui/StatusPill";

type LocationEvent = {
  tripId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speedKmh: number | null;
  recordedAt: string;
};

function updatedLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function FleetBoard({ units: initialUnits, token }: { units: FleetUnit[]; token: string }) {
  const [units, setUnits] = useState(initialUnits);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "transit" | "checkpoint" | "delayed">("all");
  const [selected, setSelected] = useState<string | null>(initialUnits[0]?.tripId ?? null);
  const [connected, setConnected] = useState(false);

  useEffect(() => setUnits(initialUnits), [initialUnits]);

  useEffect(() => {
    const stream = new EventSource("/api/admin/fleet/stream");
    const onLocation = (event: Event) => {
      const update = JSON.parse((event as MessageEvent<string>).data) as LocationEvent;
      setUnits((current) => current.map((unit) => unit.tripId === update.tripId ? {
        ...unit,
        latitude: update.latitude,
        longitude: update.longitude,
        heading: update.heading,
        speedKmh: update.speedKmh,
        recordedAt: update.recordedAt,
        updatedLabel: updatedLabel(update.recordedAt),
        delayed: unit.status === "delayed" || Date.now() - new Date(update.recordedAt).getTime() > 60 * 60 * 1000,
      } : unit));
    };
    const refresh = () => {
      void fetch("/api/admin/fleet", { cache: "no-store" })
        .then((response) => response.ok ? response.json() as Promise<FleetUnit[]> : null)
        .then((nextUnits) => { if (nextUnits) setUnits(nextUnits); })
        .catch(() => undefined);
    };
    stream.addEventListener("location", onLocation);
    stream.addEventListener("refresh", refresh);
    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false);
    return () => {
      stream.removeEventListener("location", onLocation);
      stream.removeEventListener("refresh", refresh);
      stream.close();
    };
  }, []);

  const visible = useMemo(() => units.filter((unit) => {
    const haystack = `${unit.title} ${unit.registration} ${unit.driverName} ${unit.destination} ${unit.origin}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (filter === "transit") return unit.status === "in_transit";
    if (filter === "checkpoint") return unit.atCheckpoint;
    if (filter === "delayed") return unit.delayed;
    return true;
  }), [units, query, filter]);
  const current = visible.find((unit) => unit.tripId === selected) ?? visible[0] ?? null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 border-y border-line bg-white px-3 py-2">
        <label className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vehicle, driver or route" className="h-9 w-full border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand" />
        </label>
        <div className="flex items-center gap-1" role="group" aria-label="Filter tracked vehicles">
          {([["all", "All"], ["transit", "In transit"], ["checkpoint", "Checkpoint"], ["delayed", "Delayed"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={`h-8 px-3 text-xs font-medium ${filter === key ? "bg-ink text-white" : "bg-canvas text-muted hover:text-ink"}`}>{label}</button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted"><span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-600" : "bg-amber-500"}`} />{connected ? "Live feed" : "Reconnecting"}</span>
      </div>
      <div className="grid min-h-[min(680px,calc(100dvh-190px))] gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <h2 className="text-sm font-semibold">Active fleet</h2><span className="text-xs text-muted">{visible.length} units</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((unit) => (
              <button key={unit.tripId} type="button" onClick={() => setSelected(unit.tripId)} aria-pressed={current?.tripId === unit.tripId} className={`block w-full border-b border-line px-3 py-3 text-left ${current?.tripId === unit.tripId ? "border-l-[3px] border-l-brand bg-red-50/40" : "hover:bg-canvas/70"}`}>
                <div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{unit.title}</span><StatusPill status={unit.status} label={unit.statusLabel} /></div>
                <p className="mt-1 text-xs text-muted">{unit.registration} · {unit.driverName}</p>
                <p className="mt-1 truncate text-xs text-muted">{unit.origin} to {unit.destination}</p>
                <p className="mt-1 text-[11px] text-muted">{unit.speedKmh == null ? "Speed unavailable" : `${Math.round(unit.speedKmh)} km/h`} · {unit.updatedLabel}</p>
              </button>
            ))}
            {!visible.length ? <p className="px-3 py-5 text-sm text-muted">No vehicles match this view.</p> : null}
          </div>
          <div className="border-t border-line px-3 py-2 text-xs text-muted">{units.length} tracked · positions update live</div>
        </aside>
        <section className="relative min-h-[min(680px,calc(100dvh-190px))] overflow-hidden border border-line bg-[#e8edf0]">
          <FleetMap token={token} units={visible} selectedTripId={current?.tripId ?? null} onSelect={setSelected} />
          {current ? <VehicleTrackingDrawer unit={current} onClose={() => setSelected(null)} /> : null}
          {!visible.length ? <div className="pointer-events-none absolute left-3 top-3 border border-line bg-white/95 px-3 py-2 text-xs text-muted">Southern Africa operations view</div> : null}
        </section>
      </div>
    </div>
  );
}
