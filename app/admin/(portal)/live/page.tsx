import { requireProfile } from "@/lib/auth/session";
import { mapboxToken } from "@/lib/config";
import { getFleet } from "@/lib/server/admin-service";
import { FleetBoard } from "@/components/maps/FleetBoard";

export default async function LivePage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const units = await getFleet(profile.id);
  return (
    <div>
      <h1 className="text-3xl font-bold">Live Vehicle Tracking</h1>
      <p className="mb-4 text-muted">Real-time location of active vehicles. Clients never see this feed.</p>
      <FleetBoard units={units} token={mapboxToken()} />
    </div>
  );
}
