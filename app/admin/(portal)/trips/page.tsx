import { requireProfile } from "@/lib/auth/session";
import { listPeople, listTrips } from "@/lib/server/admin-service";
import { TripForm } from "@/components/admin/OpsForms";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function TripsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const trips = await listTrips(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Trips</h1>
      <TripForm vehicles={people.vehicles.map((vehicle) => ({ id: vehicle.id, label: `${vehicle.registration} · ${vehicle.make}` }))} drivers={people.drivers.map((driver) => ({ id: driver.id, name: driver.fullName }))} />
      <div className="mt-4 space-y-3">
        {trips.map((trip) => (
          <article key={trip.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><p className="font-semibold">{trip.vehicleName} · {trip.registration}</p><StatusPill status={trip.status} label={trip.statusLabel} /></div>
            <p className="text-sm text-muted">{trip.origin} → {trip.destination}</p>
            <p className="text-sm">Driver {trip.driverName} · {trip.pickupLabel}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
