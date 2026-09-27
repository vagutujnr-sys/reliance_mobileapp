import { AdminShell } from "@/components/admin/AdminShell";
import { requireProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(["super_admin", "admin"]);
  return <AdminShell name={profile.fullName}>{children}</AdminShell>;
}
