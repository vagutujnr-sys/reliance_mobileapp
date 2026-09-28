import { requireProfile } from "@/lib/auth/session";
import { listPeople, listTrips } from "@/lib/server/admin-service";
import { TripForm } from "@/components/admin/OpsForms";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function TripsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const trips = await listTrips(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Trips</h1>
      <TripForm vehicles={people.vehicles.map((vehicle) => ({ id: vehicle.id, label: `${vehicle.registration} · ${vehicle.make}` }))} drivers={people.drivers.map((driver) => ({ id: driver.id, name: driver.fullName }))} />
      <div className="mt-4">
        <AdminDataTable
          headings={["Vehicle", "Route", "Driver", "Pickup", "Status"]}
          rows={trips.map((trip) => <tr key={trip.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium">{trip.vehicleName}<br /><span className="text-xs text-muted">{trip.registration}</span></td>
            <td className="px-3 py-2.5">{trip.origin} → {trip.destination}</td>
            <td className="px-3 py-2.5">{trip.driverName}</td>
            <td className="px-3 py-2.5">{trip.pickupLabel}</td>
            <td className="px-3 py-2.5"><StatusPill status={trip.status} label={trip.statusLabel} /></td>
          </tr>)}
          searchValues={trips.map((trip) => `${trip.vehicleName} ${trip.registration} ${trip.origin} ${trip.destination} ${trip.driverName}`)}
          filterValues={trips.map((trip) => trip.status)}
          filterLabel="Status"
          filters={Array.from(new Set(trips.map((trip) => trip.status))).map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
          emptyMessage="No trips found."
        />
      </div>
    </div>
  );
}
