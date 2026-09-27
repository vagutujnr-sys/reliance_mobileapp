import Link from "next/link";
import { logout } from "@/lib/actions/app";
import { requireProfile } from "@/lib/auth/session";
import { getClientHome, getClientInvoices } from "@/lib/server/owner-service";
import { initials } from "@/lib/utils";

export default async function OwnerProfilePage() {
  const profile = await requireProfile(["client"]);
  const home = await getClientHome(profile.id);
  const invoices = await getClientInvoices(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28 pt-8 text-center safe-top">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink text-2xl font-bold text-white">{initials(home.name)}</div>
      <h1 className="mt-3 text-2xl font-bold">{home.name}</h1>
      <p className="text-sm text-muted">{profile.email}</p>
      <div className="mt-6 space-y-2 text-left">
        {invoices.map((invoice) => (
          <Link key={invoice.id} href={`/owner/invoices/${invoice.id}`} className="block rounded-2xl bg-canvas px-4 py-3">
            <span className="font-semibold">{invoice.number}</span>
            <span className="ml-2 text-sm text-muted">{invoice.status}</span>
          </Link>
        ))}
        <Link href="/owner/profile/pin" className="block rounded-2xl px-4 py-3 font-medium">Change PIN</Link>
      </div>
      <form action={logout}><button className="mt-4 font-semibold text-brand">Logout</button></form>
    </div>
  );
}
