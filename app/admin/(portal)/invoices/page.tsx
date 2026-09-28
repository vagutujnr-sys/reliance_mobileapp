import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listInvoices, listPeople } from "@/lib/server/admin-service";
import { InvoiceForm } from "@/components/admin/OpsForms";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function InvoicesPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const invoices = await listInvoices(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Invoicing</h1>
      <InvoiceForm clients={people.clients.map((client) => ({ id: client.id, name: client.fullName }))} vehicles={people.vehicles.map((vehicle) => ({ id: vehicle.id, label: vehicle.registration }))} />
      <div className="mt-4">
        <AdminDataTable
          headings={["Invoice", "Client", "Vehicle", "Issued", "Due", "Total", "Status"]}
          rows={invoices.map((invoice) => <tr key={invoice.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium"><Link href={`/admin/invoices/${invoice.id}`} className="hover:text-brand">{invoice.number}</Link></td>
            <td className="px-3 py-2.5">{invoice.clientName}</td>
            <td className="px-3 py-2.5">{invoice.vehicleName}</td>
            <td className="px-3 py-2.5">{invoice.issuedOn}</td>
            <td className="px-3 py-2.5">{invoice.dueOn}</td>
            <td className="px-3 py-2.5 font-medium">{formatUsd(invoice.total)}</td>
            <td className="px-3 py-2.5"><StatusPill status={invoice.status} /></td>
          </tr>)}
          searchValues={invoices.map((invoice) => `${invoice.number} ${invoice.clientName} ${invoice.vehicleName} ${invoice.status}`)}
          filterValues={invoices.map((invoice) => invoice.status)}
          filterLabel="Status"
          filters={Array.from(new Set(invoices.map((invoice) => invoice.status))).map((status) => ({ value: status, label: status }))}
          emptyMessage="No invoices found."
        />
      </div>
    </div>
  );
}
