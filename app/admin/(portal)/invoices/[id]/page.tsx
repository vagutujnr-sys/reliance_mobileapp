import { requireProfile } from "@/lib/auth/session";
import { getInvoiceForActor } from "@/lib/server/owner-service";
import { formatUsd } from "@/lib/format";

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["super_admin", "admin"]);
  const invoice = await getInvoiceForActor(profile.id, id, true);
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold tracking-[0.18em] text-brand">RELIANCE MOBILITY SOLUTIONS</p>
      <h1 className="text-3xl font-bold">{invoice.number}</h1>
      <p>{invoice.client} · {invoice.vehicle}</p>
      <p className="text-sm text-muted">Issued {invoice.issuedOn} · Due {invoice.dueOn}</p>
      <table className="mt-4 w-full text-sm"><tbody>{invoice.items.map((item) => <tr key={item.description}><td className="py-2">{item.description}</td><td className="text-right">{formatUsd(item.total)}</td></tr>)}</tbody></table>
      <p className="mt-4 text-right font-bold">Balance {formatUsd(invoice.balance)}</p>
    </article>
  );
}
