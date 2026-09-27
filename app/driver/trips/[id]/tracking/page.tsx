import { requireProfile } from "@/lib/auth/session";
import { mapboxToken } from "@/lib/config";
import { getDriverTracking } from "@/lib/server/driver-service";
import { TrackingScreen } from "@/components/driver/TrackingScreen";

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["driver"]);
  const trip = await getDriverTracking(profile.id, id);
  return <TrackingScreen trip={trip} token={mapboxToken()} />;
}
