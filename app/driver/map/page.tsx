import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { mapboxToken } from "@/lib/config";
import { getDriverHome, getDriverTracking } from "@/lib/server/driver-service";
import { RouteMap } from "@/components/maps/RouteMap";

export default async function DriverMapPage() {
  const profile = await requireProfile(["driver"]);
  const home = await getDriverHome(profile.id);
  if (!home.current) {
    return <div className="grid min-h-dvh place-items-center px-6 pb-24 text-center"><p className="font-semibold">No active route</p><p className="mt-2 text-sm text-muted">The map opens when a trip is assigned.</p></div>;
  }
  const trip = await getDriverTracking(profile.id, home.current.id);
  return (
    <div className="relative min-h-dvh pb-24">
      <RouteMap token={mapboxToken()} route={[trip.pickupPoint, ...trip.route, trip.destinationPoint]} position={trip.position} className="h-dvh w-full" />
      <Link href={`/driver/trips/${trip.tripId}/tracking`} className="absolute bottom-28 left-5 right-5 flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-white">Open trip</Link>
    </div>
  );
}
