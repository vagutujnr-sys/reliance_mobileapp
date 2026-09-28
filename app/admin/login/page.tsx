import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AdminLoginForm error={query.error} />;
}
