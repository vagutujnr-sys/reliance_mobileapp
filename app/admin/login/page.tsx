import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { isRemote } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AdminLoginForm demo={!isRemote()} error={query.error} />;
}
