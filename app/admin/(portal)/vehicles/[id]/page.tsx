import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { getAdminVehicle } from "@/lib/server/admin-service";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function AdminVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["super_admin", "admin"]);
  const data = await getAdminVehicle(profile.id, id);
  const vehicle = data.vehicle;
  return (
    <div>
      <Link href="/admin/vehicles" className="text-sm font-semibold text-brand">All vehicles</Link>
      <div className="mt-3 grid gap-4 lg:grid-cols-[360px_1fr]">
        <article className="rounded-3xl bg-white p-4 shadow-sm">
          <img src={vehicle.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-48 w-full rounded-2xl object-cover" />
          <h1 className="mt-3 text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
          <p>{vehicle.registration} · {vehicle.colour} · {vehicle.year}</p>
          <StatusPill status={vehicle.status} label={data.statusLabel} />
          <dl className="mt-4 space-y-2 text-sm">
            <div>Owner: {data.ownerName}</div>
            <div>Driver: {data.driverName ?? "Unassigned"} {data.driverPhone ? `· ${data.driverPhone}` : ""}</div>
            <div>VIN: {vehicle.vin}</div>
            <div>Engine: {vehicle.engineNumber}</div>
            <div>Insurance: {vehicle.insuranceStatus} {vehicle.insuranceProvider ?? ""}</div>
            <div>{vehicle.origin} → {vehicle.destination}</div>
            {data.location ? <div>Last GPS: {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)}</div> : null}
          </dl>
        </article>
        <div className="space-y-4">
          <article className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Journey</h2>
            <ol className="mt-3 space-y-2 text-sm">{data.milestones.map((item) => <li key={item.id}>{item.name} · {item.place} · {item.at}</li>)}{!data.milestones.length ? <li>No checkpoints yet.</li> : null}</ol>
          </article>
          <article className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Handovers</h2>
            {data.handovers.map((item) => <p key={item.id} className="mt-2 text-sm">{item.from} → {item.to} · {item.status} · {item.when}</p>)}
            {!data.handovers.length ? <p className="text-sm text-muted">No handovers.</p> : null}
          </article>
          <article className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Pickup photos</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">{data.photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.slot} className="h-24 w-full rounded-xl object-cover" />)}</div>
          </article>
        </div>
      </div>
    </div>
  );
}
