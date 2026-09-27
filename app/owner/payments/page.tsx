import { requireProfile } from "@/lib/auth/session";
import { getClientPayments, getClientReceipts } from "@/lib/server/owner-service";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProofForm } from "@/components/owner/ProofForm";

export default async function OwnerPaymentsPage() {
  const profile = await requireProfile(["client"]);
  const payments = await getClientPayments(profile.id);
  const receipts = await getClientReceipts(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28 pt-6 safe-top">
      <h1 className="text-2xl font-bold">Payments</h1>
      <section className="mt-4 rounded-[28px] bg-brand p-5 text-white">
        <p className="text-sm text-white/80">Total Paid</p>
        <p className="text-4xl font-bold">{formatUsd(payments.paid)}</p>
        <p className="mt-1 text-sm text-white/80">Outstanding {formatUsd(payments.outstanding)} · Total {formatUsd(payments.total)}</p>
      </section>
      <div className="mt-5 space-y-3">
        {payments.rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-line p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{row.description}</p>
                <p className="text-sm text-muted">{row.dateLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatUsd(row.amount)}</p>
                <StatusPill status={row.status} />
              </div>
            </div>
            {row.status === "pending" || row.status === "overdue" ? <ProofForm paymentId={row.id} /> : null}
          </article>
        ))}
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Receipts</h2>
      {receipts.map((receipt) => (
        <p key={receipt.id} className="mb-2 text-sm">{receipt.number} · {formatUsd(receipt.amount)} · {receipt.issuedLabel}</p>
      ))}
      <h2 className="mb-2 mt-6 font-semibold">Payment instructions</h2>
      <pre className="whitespace-pre-wrap rounded-3xl bg-canvas p-4 text-sm">{payments.instructions}</pre>
    </div>
  );
}
