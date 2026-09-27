import { requireProfile } from "@/lib/auth/session";
import { getTripDetail } from "@/lib/server/driver-service";
import { PickupFlow } from "@/components/driver/PickupFlow";

export default async function PickupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["driver"]);
  const trip = await getTripDetail(profile.id, id);
  return <PickupFlow trip={trip} />;
}
