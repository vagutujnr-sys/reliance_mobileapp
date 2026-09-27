import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listDriverTrips } from "@/lib/server/driver-service";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function DriverTripsPage() {
  const profile = await requireProfile(["driver"]);
  const trips = await listDriverTrips(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28 pt-6 safe-top">
      <h1 className="text-2xl font-bold">Trips</h1>
      <div className="mt-5 space-y-3">
        {trips.length ? trips.map((trip) => (
          <Link key={trip.id} href={`/driver/trips/${trip.id}`} className="flex gap-3 rounded-3xl border border-line p-3">
            <img src={trip.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-16 w-20 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{trip.title}</p>
                <StatusPill status={trip.status} label={trip.statusLabel} />
              </div>
              <p className="text-sm text-muted">{trip.registration}</p>
              <p className="text-sm">{trip.pickup} → {trip.dropoff}</p>
            </div>
          </Link>
        )) : <p className="rounded-3xl bg-canvas p-6 text-sm text-muted">No trips assigned yet.</p>}
      </div>
    </div>
  );
}
