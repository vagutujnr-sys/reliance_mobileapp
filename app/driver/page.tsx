import { DriverHomeView } from "@/components/driver/DriverHome";
import { requireProfile } from "@/lib/auth/session";
import { getDriverHome } from "@/lib/server/driver-service";

export default async function DriverHomePage() {
  const profile = await requireProfile(["driver"]);
  const data = await getDriverHome(profile.id);
  return <DriverHomeView data={data} />;
}
