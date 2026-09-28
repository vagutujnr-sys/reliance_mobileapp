import { requireProfile } from "@/lib/auth/session";
import { listPeople } from "@/lib/server/admin-service";
import { AccessButtons, DriverForm } from "@/components/admin/OpsForms";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function DriversPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Drivers</h1>
      <DriverForm />
      <div className="mt-4">
        <AdminDataTable
          headings={["Driver", "Driver ID", "Phone", "Vehicles moved", "Distance", "Status", "Actions"]}
          rows={people.drivers.map((driver) => <tr key={driver.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium">{driver.fullName}</td>
            <td className="px-3 py-2.5">{driver.driverCode}</td>
            <td className="px-3 py-2.5">{driver.phone}</td>
            <td className="px-3 py-2.5">{driver.carsTransported}</td>
            <td className="px-3 py-2.5">{Math.round(driver.distanceKm).toLocaleString()} km</td>
            <td className="px-3 py-2.5 capitalize">{driver.accountStatus}</td>
            <td className="px-3 py-2.5"><AccessButtons kind="driver" id={driver.id} /></td>
          </tr>)}
          searchValues={people.drivers.map((driver) => `${driver.fullName} ${driver.driverCode} ${driver.phone} ${driver.accountStatus}`)}
          filterValues={people.drivers.map((driver) => driver.accountStatus)}
          filterLabel="Status"
          filters={["active", "pending", "suspended", "disabled"].map((status) => ({ value: status, label: status }))}
          emptyMessage="No drivers found."
        />
      </div>
    </div>
  );
}
