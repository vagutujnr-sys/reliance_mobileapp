import { requireProfile } from "@/lib/auth/session";
import { listFinance, listPeople } from "@/lib/server/admin-service";
import { DriverPayForm, VerifyButton } from "@/components/admin/OpsForms";
import { formatUsd } from "@/lib/format";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function PaymentsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const finance = await listFinance(profile.id);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Payments</h1>
      <AdminDataTable
        headings={["Client", "Payment", "Vehicle", "Reference", "Amount", "Status", "Actions"]}
        rows={finance.clientPayments.map((payment) => <tr key={payment.id} className="border-t border-line hover:bg-canvas/50">
          <td className="px-3 py-2.5 font-medium">{payment.clientName}</td>
          <td className="px-3 py-2.5">{payment.description}</td>
          <td className="px-3 py-2.5">{payment.vehicleName}</td>
          <td className="px-3 py-2.5">{payment.reference ?? "—"}</td>
          <td className="px-3 py-2.5 font-medium">{formatUsd(payment.amount)}</td>
          <td className="px-3 py-2.5"><StatusPill status={payment.status} /></td>
          <td className="px-3 py-2.5">{payment.status !== "paid" ? <VerifyButton id={payment.id} /> : "—"}</td>
        </tr>)}
        searchValues={finance.clientPayments.map((payment) => `${payment.clientName} ${payment.description} ${payment.vehicleName} ${payment.reference ?? ""} ${payment.status}`)}
        filterValues={finance.clientPayments.map((payment) => payment.status)}
        filterLabel="Status"
        filters={Array.from(new Set(finance.clientPayments.map((payment) => payment.status))).map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
        emptyMessage="No client payments found."
      />
      <h2 className="mb-2 mt-8 text-xl font-bold">Driver payments</h2>
      <DriverPayForm drivers={people.drivers.map((driver) => ({ id: driver.id, name: driver.fullName }))} />
      <div className="mt-3">
        <AdminDataTable
          headings={["Driver", "Route", "Amount", "Status"]}
          rows={finance.driverPayments.map((payment) => <tr key={payment.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium">{payment.driverName}</td>
            <td className="px-3 py-2.5">{payment.route}</td>
            <td className="px-3 py-2.5 font-medium">{formatUsd(payment.amount)}</td>
            <td className="px-3 py-2.5 capitalize">{payment.status}</td>
          </tr>)}
          searchValues={finance.driverPayments.map((payment) => `${payment.driverName} ${payment.route} ${payment.status}`)}
          filterValues={finance.driverPayments.map((payment) => payment.status)}
          filterLabel="Status"
          filters={Array.from(new Set(finance.driverPayments.map((payment) => payment.status))).map((status) => ({ value: status, label: status }))}
          emptyMessage="No driver payments found."
        />
      </div>
    </div>
  );
}
