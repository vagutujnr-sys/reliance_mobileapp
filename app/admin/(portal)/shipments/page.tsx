import { requireProfile } from "@/lib/auth/session";
import { listShipments } from "@/lib/server/admin-service";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function ShipmentsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const rows = await listShipments(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Shipping Schedule</h1>
      <AdminDataTable
        headings={["Vehicle", "Client", "Route", "Reference", "Departure", "Arrival", "Status"]}
        rows={rows.map((row) => <tr key={row.id} className="border-t border-line hover:bg-canvas/50">
          <td className="px-3 py-2.5 font-medium">{row.vehicle}<br /><span className="text-xs text-muted">{row.registration}</span></td>
          <td className="px-3 py-2.5">{row.client}</td>
          <td className="px-3 py-2.5">{row.origin} → {row.destination}</td>
          <td className="px-3 py-2.5">{row.reference}</td>
          <td className="px-3 py-2.5">{row.departure}</td>
          <td className="px-3 py-2.5">{row.arrival}</td>
          <td className="px-3 py-2.5"><StatusPill status={row.status} label={row.statusLabel} /></td>
        </tr>)}
        searchValues={rows.map((row) => `${row.vehicle} ${row.registration} ${row.client} ${row.origin} ${row.destination} ${row.reference}`)}
        filterValues={rows.map((row) => row.status)}
        filterLabel="Status"
        filters={Array.from(new Set(rows.map((row) => row.status))).map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
        emptyMessage="No shipping records found."
      />
    </div>
  );
}
