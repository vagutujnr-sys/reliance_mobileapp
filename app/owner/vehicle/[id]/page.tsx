import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getClientVehicle } from "@/lib/server/owner-service";
import { formatDate } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function OwnerVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["client"]);
  const vehicle = await getClientVehicle(profile.id, id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/owner" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="flex-1 text-center font-semibold">Vehicle Details</h1>
        <span className="w-10" />
      </header>
      <img src={vehicle.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-48 w-full rounded-[28px] object-cover" />
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{vehicle.title}</h2>
          <p className="text-muted">{vehicle.colour} · {vehicle.year}</p>
        </div>
        <StatusPill status={vehicle.status} label={vehicle.statusLabel} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Item label="Registration" value={vehicle.registration} />
        <Item label="Reference" value={vehicle.reference} />
        <Item label="Insurance" value={vehicle.insured ? "Insured" : "Not insured"} />
        <Item label="Insurer" value={vehicle.insurer ?? "—"} />
        <Item label="Insurance expiry" value={vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : "—"} />
        <Item label="Chassis" value={vehicle.vinMasked} />
        <Item label="Engine" value={vehicle.engineMasked} />
        <Item label="Origin" value={vehicle.origin} />
        <Item label="Destination" value={vehicle.destination} />
        <Item label="ETA" value={vehicle.etaLabel ?? "—"} />
      </dl>
      <p className="mt-4 rounded-3xl bg-canvas p-4 text-sm">Transport managed by <strong>{vehicle.managedBy}</strong></p>
      <Link href={`/owner/vehicle/${vehicle.id}/track`} className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white">Track Vehicle</Link>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-canvas p-3"><dt className="text-xs text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
