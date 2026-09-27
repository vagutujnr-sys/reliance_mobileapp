"use client";

import { useMemo, useState } from "react";
import type { FleetUnit } from "@/lib/data/views";
import { RouteMap } from "@/components/maps/RouteMap";
import { StatusPill } from "@/components/ui/StatusPill";

export function FleetBoard({ units, token }: { units: FleetUnit[]; token: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "transit" | "checkpoint" | "delayed">("all");
  const [selected, setSelected] = useState(units[0]?.tripId ?? "");
  const visible = useMemo(() => units.filter((unit) => {
    const haystack = `${unit.title} ${unit.registration} ${unit.driverName} ${unit.destination}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (filter === "transit") return unit.status === "in_transit";
    if (filter === "checkpoint") return unit.atCheckpoint;
    if (filter === "delayed") return unit.delayed;
    return true;
  }), [units, query, filter]);
  const current = visible.find((unit) => unit.tripId === selected) ?? visible[0];
  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vehicle, driver or location" className="h-11 w-full rounded-2xl border border-line px-3" />
        <div className="mt-3 flex gap-2 text-sm">
          {([["all", "All"], ["transit", "In Transit"], ["checkpoint", "Checkpoint"], ["delayed", "Delayed"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1 ${filter === key ? "bg-brand text-white" : "bg-white"}`}>{label}</button>
          ))}
        </div>
        <div className="mt-3 max-h-[70dvh] space-y-2 overflow-auto">
          {visible.map((unit) => (
            <button key={unit.tripId} onClick={() => setSelected(unit.tripId)} className={`block w-full rounded-2xl bg-white p-3 text-left ${current?.tripId === unit.tripId ? "ring-2 ring-brand" : ""}`}>
              <div className="flex justify-between gap-2"><span className="font-semibold">{unit.title}</span><StatusPill status={unit.status} label={unit.statusLabel} /></div>
              <p className="text-sm text-muted">{unit.registration} · {unit.driverName}</p>
              <p className="text-xs text-muted">{unit.speedKmh ?? 0} km/h · {unit.updatedLabel}</p>
            </button>
          ))}
          {!visible.length ? <p className="text-sm text-muted">No vehicles match.</p> : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white">
        <RouteMap token={token} route={visible.map((unit) => ({ latitude: unit.latitude, longitude: unit.longitude, label: `${unit.registration} · ${unit.driverName}` }))} position={current ? { latitude: current.latitude, longitude: current.longitude, label: current.registration } : null} className="h-[70dvh] w-full" />
        {current ? <div className="grid gap-2 p-4 text-sm sm:grid-cols-3"><p><strong>{current.title}</strong><br />{current.registration}</p><p>Driver {current.driverName}<br />{current.destination}</p><p>{current.latitude.toFixed(4)}, {current.longitude.toFixed(4)}<br />Updated {current.updatedLabel}</p></div> : null}
      </div>
    </div>
  );
}
