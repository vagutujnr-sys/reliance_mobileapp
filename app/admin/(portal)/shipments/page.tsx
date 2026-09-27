import { requireProfile } from "@/lib/auth/session";
import { listShipments } from "@/lib/server/admin-service";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function ShipmentsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const rows = await listShipments(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Shipping Schedule</h1>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-muted"><tr><th className="px-4 py-3">Vehicle</th><th>Client</th><th>Route</th><th>Reference</th><th>Departure</th><th>Arrival</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">{row.vehicle}<br />{row.registration}</td>
                <td>{row.client}</td>
                <td>{row.origin} → {row.destination}</td>
                <td>{row.reference}</td>
                <td>{row.departure}</td>
                <td>{row.arrival}</td>
                <td><StatusPill status={row.status} label={row.statusLabel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
