import { requireProfile } from "@/lib/auth/session";
import { getDriverMoney } from "@/lib/server/driver-service";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function DriverPaymentsPage() {
  const profile = await requireProfile(["driver"]);
  const money = await getDriverMoney(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5 pb-28 pt-6 safe-top">
      <h1 className="text-2xl font-bold">My Payments</h1>
      <section className="mt-4 rounded-[28px] bg-brand p-5 text-white">
        <p className="text-sm text-white/80">Total Earned</p>
        <p className="text-4xl font-bold">{formatUsd(money.received)}</p>
        <p className="mt-1 text-sm text-white/80">Received {formatUsd(money.received)} · Pending {formatUsd(money.pending)}</p>
      </section>
      <div className="mt-5 space-y-3">
        {money.rows.map((row) => (
          <article key={row.id} className="flex items-center justify-between rounded-3xl border border-line p-4">
            <div>
              <p className="font-semibold">{row.route}</p>
              <p className="text-sm text-muted">{row.dateLabel} · {row.reference}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatUsd(row.amount)}</p>
              <StatusPill status={row.status} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
