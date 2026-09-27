import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listAdminVehicles, listPeople } from "@/lib/server/admin-service";
import { VehicleForm } from "@/components/admin/OpsForms";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function VehiclesPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const vehicles = await listAdminVehicles(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Vehicles</h1>
      <VehicleForm owners={people.clients.map((client) => ({ id: client.id, name: client.fullName }))} />
      <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-muted"><tr><th className="px-4 py-3">Vehicle</th><th>Client</th><th>Route</th><th>Status</th></tr></thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-line">
                <td className="px-4 py-3"><Link href={`/admin/vehicles/${vehicle.id}`} className="font-semibold">{vehicle.make} {vehicle.model}</Link><br />{vehicle.registration}</td>
                <td>{vehicle.ownerName}</td>
                <td>{vehicle.origin} → {vehicle.destination}</td>
                <td><StatusPill status={vehicle.status} label={vehicle.statusLabel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
