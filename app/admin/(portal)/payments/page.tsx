import { requireProfile } from "@/lib/auth/session";
import { listFinance, listPeople } from "@/lib/server/admin-service";
import { DriverPayForm, VerifyButton } from "@/components/admin/OpsForms";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function PaymentsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const finance = await listFinance(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Payments</h1>
      <div className="space-y-3">
        {finance.clientPayments.map((payment) => (
          <article key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <div><p className="font-semibold">{payment.clientName} · {payment.description}</p><p className="text-sm text-muted">{payment.vehicleName} · {payment.reference ?? "No reference"}</p></div>
            <div className="flex items-center gap-3"><span className="font-semibold">{formatUsd(payment.amount)}</span><StatusPill status={payment.status} />{payment.status !== "paid" ? <VerifyButton id={payment.id} /> : null}</div>
          </article>
        ))}
      </div>
      <h2 className="mb-2 mt-8 text-xl font-bold">Driver payments</h2>
      <DriverPayForm drivers={people.drivers.map((driver) => ({ id: driver.id, name: driver.fullName }))} />
      <div className="mt-3 space-y-2">
        {finance.driverPayments.map((payment) => <p key={payment.id} className="rounded-2xl bg-white px-4 py-3 text-sm">{payment.driverName} · {payment.route} · {formatUsd(payment.amount)} · {payment.status}</p>)}
      </div>
    </div>
  );
}
