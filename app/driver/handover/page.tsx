import { requireProfile } from "@/lib/auth/session";
import { listDriverTrips } from "@/lib/server/driver-service";
import { HandoverScreen } from "@/components/driver/HandoverScreen";

export default async function HandoverPage() {
  const profile = await requireProfile(["driver"]);
  const trips = await listDriverTrips(profile.id);
  return <HandoverScreen trips={trips} qr={null} />;
}
