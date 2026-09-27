import { OwnerShell } from "@/components/owner/OwnerShell";
import { requireProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireProfile(["client"]);
  return <OwnerShell>{children}</OwnerShell>;
}
