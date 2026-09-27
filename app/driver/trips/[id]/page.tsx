import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getTripDetail } from "@/lib/server/driver-service";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["driver"]);
  const trip = await getTripDetail(profile.id, id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-10">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/driver" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="flex-1 text-center text-lg font-semibold">Trip Details</h1>
        <span className="w-10" />
      </header>
      <img src={trip.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-44 w-full rounded-[28px] object-cover" />
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{trip.title}</h2>
          <p className="text-muted">{trip.colour} · {trip.year} · {trip.registration}</p>
          <p className="text-sm">Ref {trip.reference}</p>
        </div>
        <StatusPill status={trip.status} label={trip.statusLabel} />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Info label="Pickup" value={trip.pickup} />
        <Info label="Destination" value={trip.dropoff} />
        <Info label="Distance" value={`${trip.distanceKm} km`} />
        <Info label="ETA" value={trip.etaLabel} />
      </dl>
      <ol className="mt-6 space-y-3">
        {trip.steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${step.state === "upcoming" ? "bg-zinc-200" : step.state === "current" ? "bg-brand" : "bg-success"}`} />
            <span className={step.state === "upcoming" ? "text-muted" : "font-medium"}>{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 grid gap-3">
        {trip.canArrive || trip.canInspect ? <Link href={`/driver/trips/${trip.id}/pickup`} className="flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white">Continue Pickup</Link> : null}
        {trip.canStart || trip.canTrack ? <Link href={`/driver/trips/${trip.id}/tracking`} className="flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-white">{trip.canStart ? "Start Trip" : "Open Live Map"}</Link> : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-canvas p-3"><dt className="text-xs text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
