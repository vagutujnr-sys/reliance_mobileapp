import { requireProfile } from "@/lib/auth/session";
import { mapboxToken } from "@/lib/config";
import { getFleet } from "@/lib/server/admin-service";
import { FleetBoard } from "@/components/maps/FleetBoard";

export default async function LivePage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const units = await getFleet(profile.id);
  return <FleetBoard units={units} token={mapboxToken()} />;
}
