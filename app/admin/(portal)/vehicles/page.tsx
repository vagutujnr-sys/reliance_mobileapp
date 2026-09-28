import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listAdminVehicles, listPeople } from "@/lib/server/admin-service";
import { VehicleForm } from "@/components/admin/OpsForms";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function VehiclesPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const vehicles = await listAdminVehicles(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Vehicles</h1>
      <VehicleForm owners={people.clients.map((client) => ({ id: client.id, name: client.fullName }))} />
      <div className="mt-4">
        <AdminDataTable
          headings={["Vehicle", "Client", "Route", "Status"]}
          rows={vehicles.map((vehicle) => <tr key={vehicle.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5"><Link href={`/admin/vehicles/${vehicle.id}`} className="font-semibold text-ink hover:text-brand">{vehicle.make} {vehicle.model}</Link><br /><span className="text-xs text-muted">{vehicle.registration}</span></td>
            <td className="px-3 py-2.5">{vehicle.ownerName}</td>
            <td className="px-3 py-2.5">{vehicle.origin} → {vehicle.destination}</td>
            <td className="px-3 py-2.5"><StatusPill status={vehicle.status} label={vehicle.statusLabel} /></td>
          </tr>)}
          searchValues={vehicles.map((vehicle) => `${vehicle.make} ${vehicle.model} ${vehicle.registration} ${vehicle.ownerName} ${vehicle.origin} ${vehicle.destination}`)}
          filterValues={vehicles.map((vehicle) => vehicle.status)}
          filterLabel="Status"
          filters={Array.from(new Set(vehicles.map((vehicle) => vehicle.status))).map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
          emptyMessage="No vehicles found."
        />
      </div>
    </div>
  );
}
