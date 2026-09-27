import { DriverShell } from "@/components/driver/DriverShell";
import { requireProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  await requireProfile(["driver"]);
  return <DriverShell>{children}</DriverShell>;
}
