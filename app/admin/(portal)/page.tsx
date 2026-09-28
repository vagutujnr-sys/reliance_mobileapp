import { requireProfile } from "@/lib/auth/session";
import { getDashboard } from "@/lib/server/admin-service";
import { formatUsd } from "@/lib/format";
import { vehicleLabel } from "@/lib/domain/labels";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function DashboardPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const data = await getDashboard(profile.id);
  const segments = [
    { label: "In Transit", value: data.inTransit, color: "#f59e0b" },
    { label: "Checkpoint", value: data.checkpoint, color: "#3b82f6" },
    { label: "Delivered", value: data.delivered, color: "#16a34a" },
    { label: "Other", value: Math.max(0, data.total - data.inTransit - data.checkpoint - data.delivered), color: "#d1d5db" },
  ];
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0));
  let cursor = 0;
  const gradient = segments.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted">Overview of your vehicles, drivers and operations</p>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Vehicles" value={String(data.total)} />
        <Stat label="In Transit" value={String(data.inTransit)} />
        <Stat label="At Checkpoint" value={String(data.checkpoint)} />
        <Stat label="Delivered" value={String(data.delivered)} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Vehicles by Status</h2>
          <div className="mt-4 flex items-center gap-6">
            <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><span className="text-2xl font-bold">{data.total}</span></div>
            </div>
            <ul className="space-y-2 text-sm">
              {segments.map((item) => <li key={item.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.label} · {item.value}</li>)}
            </ul>
          </div>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Recent Activity</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {data.activity.map((item) => <li key={item.id}><p className="font-medium">{item.message}</p><p className="text-xs text-muted">{item.actorName}</p></li>)}
          </ul>
        </article>
      </section>
      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active Drivers" value={String(data.activeDrivers)} hint={`${data.onTrip} on trip`} />
        <Stat label="Pending Payments" value={formatUsd(data.pendingPayments)} hint={`${data.pendingCount} open`} />
        <Stat label="Upcoming Arrivals" value={String(data.upcoming)} />
        <Stat label="Alerts" value={String(data.alerts)} />
      </section>
      <section className="mt-4">
        <AdminDataTable
          headings={["Vehicle", "Registration", "Route", "Status"]}
          rows={data.vehicles.map((vehicle) => <tr key={vehicle.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium">{vehicle.make} {vehicle.model}</td>
            <td className="px-3 py-2.5">{vehicle.registration}</td>
            <td className="px-3 py-2.5">{vehicle.origin} → {vehicle.destination}</td>
            <td className="px-3 py-2.5">{vehicleLabel(vehicle.status)}</td>
          </tr>)}
          searchValues={data.vehicles.map((vehicle) => `${vehicle.make} ${vehicle.model} ${vehicle.registration} ${vehicle.origin} ${vehicle.destination}`)}
          filterValues={data.vehicles.map((vehicle) => vehicle.status)}
          filterLabel="Status"
          filters={Array.from(new Set(data.vehicles.map((vehicle) => vehicle.status))).map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
          emptyMessage="No vehicles found."
        />
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <article className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p>{hint ? <p className="text-xs text-muted">{hint}</p> : null}</article>;
}
