import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listInvoices, listPeople } from "@/lib/server/admin-service";
import { InvoiceForm } from "@/components/admin/OpsForms";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function InvoicesPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const invoices = await listInvoices(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Invoicing</h1>
      <InvoiceForm clients={people.clients.map((client) => ({ id: client.id, name: client.fullName }))} vehicles={people.vehicles.map((vehicle) => ({ id: vehicle.id, label: vehicle.registration }))} />
      <div className="mt-4 space-y-3">
        {invoices.map((invoice) => (
          <Link key={invoice.id} href={`/admin/invoices/${invoice.id}`} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
            <div><p className="font-semibold">{invoice.number}</p><p className="text-sm text-muted">{invoice.clientName} · {invoice.vehicleName}</p></div>
            <div className="text-right"><p className="font-semibold">{formatUsd(invoice.total)}</p><StatusPill status={invoice.status} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
