import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { getClientHome } from "@/lib/server/owner-service";
import { redirect } from "next/navigation";

export default async function OwnerVehicleIndex() {
  const profile = await requireProfile(["client"]);
  const home = await getClientHome(profile.id);
  const first = home.vehicles[0];
  if (first) redirect(`/owner/vehicle/${first.id}`);
  return <div className="p-6 pb-28">No vehicle assigned.</div>;
}
