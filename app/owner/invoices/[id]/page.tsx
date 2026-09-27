import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { getInvoiceForActor } from "@/lib/server/owner-service";
import { formatUsd } from "@/lib/format";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(["client"]);
  const invoice = await getInvoiceForActor(profile.id, id, false);
  return (
    <article className="mx-auto min-h-dvh max-w-3xl bg-white p-6">
      <p className="text-sm font-semibold tracking-[0.2em] text-brand">RELIANCE MOBILITY SOLUTIONS</p>
      <h1 className="mt-2 text-3xl font-bold">{invoice.number}</h1>
      <p className="text-muted">{invoice.client} · {invoice.vehicle}</p>
      <p className="mt-2 text-sm">Issued {invoice.issuedOn} · Due {invoice.dueOn} · {invoice.status}</p>
      <table className="mt-6 w-full text-left text-sm">
        <thead><tr className="border-b"><th className="py-2">Description</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.description} className="border-b"><td className="py-3">{item.description}</td><td>{item.quantity}</td><td>{formatUsd(item.total)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-right">Total {formatUsd(invoice.total)}</p>
      <p className="text-right">Paid {formatUsd(invoice.paid)}</p>
      <p className="text-right text-lg font-bold">Balance {formatUsd(invoice.balance)}</p>
      {invoice.notes ? <p className="mt-4 text-sm text-muted">{invoice.notes}</p> : null}
      <Link href="/owner/profile" className="mt-6 inline-block text-sm font-semibold text-brand print:hidden">Back</Link>
      <p className="mt-2 text-xs text-muted print:hidden">Use the browser print dialog to save a PDF.</p>
    </article>
  );
}
