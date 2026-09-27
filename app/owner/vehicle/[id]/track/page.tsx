import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { mapboxToken } from "@/lib/config";
import { getClientJourney } from "@/lib/server/owner-service";
import { RouteMap } from "@/components/maps/RouteMap";
import { formatDateTime } from "@/lib/format";

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["client"]);
  const journey = await getClientJourney(profile.id, id);
  return (
    <div className="min-h-dvh bg-white pb-8">
      <header className="flex items-center gap-3 px-4 py-4 safe-top">
        <Link href={`/owner/vehicle/${id}`} className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <div>
          <h1 className="font-semibold">Live Vehicle Tracking</h1>
          <p className="text-xs text-muted">{journey.registration}</p>
        </div>
      </header>
      <RouteMap token={mapboxToken()} route={journey.route} className="h-72 w-full" />
      <section className="px-5 pt-5">
        <p className="text-sm text-muted">Current progress</p>
        <h2 className="text-xl font-bold">{journey.lastPlace ?? journey.statusLabel}</h2>
        {journey.updatedLabel ? <p className="text-sm text-muted">Last updated {journey.updatedLabel}</p> : null}
        <p className="mt-2 text-sm">ETA {journey.etaLabel ?? "to be confirmed"} · {journey.origin} to {journey.destination}</p>
        <ol className="mt-5 space-y-4">
          {journey.milestones.map((step) => (
            <li key={step.key} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 rounded-full ${step.state === "current" ? "bg-brand" : step.state === "done" ? "bg-success" : "bg-zinc-200"}`} />
              <div>
                <p className={step.state === "upcoming" ? "text-muted" : "font-semibold"}>{step.title}</p>
                {step.detail ? <p className="text-sm text-muted">{step.detail}</p> : null}
                {step.at && step.at !== "done" ? <p className="text-xs text-muted">{formatDateTime(step.at)}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
