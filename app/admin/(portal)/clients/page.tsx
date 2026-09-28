import { requireProfile } from "@/lib/auth/session";
import { listPeople } from "@/lib/server/admin-service";
import { AccessButtons, ChatMode, ClientForm } from "@/components/admin/OpsForms";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default async function ClientsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Clients</h1>
      <ClientForm />
      <div className="mt-4">
        <AdminDataTable
          headings={["Client", "Phone", "Vehicles", "App access", "Status", "Actions"]}
          rows={people.clients.map((client) => <tr key={client.id} className="border-t border-line hover:bg-canvas/50">
            <td className="px-3 py-2.5 font-medium">{client.fullName}</td>
            <td className="px-3 py-2.5">{client.phone}</td>
            <td className="px-3 py-2.5">{people.vehicles.filter((vehicle) => vehicle.ownerId === client.id).map((vehicle) => vehicle.registration).join(", ") || "None"}</td>
            <td className="px-3 py-2.5">{client.appAccess ? "Enabled" : "Disabled"}</td>
            <td className="px-3 py-2.5 capitalize">{client.accountStatus}</td>
            <td className="px-3 py-2.5"><div className="flex items-center gap-2"><AccessButtons kind="client" id={client.id} /><ChatMode clientId={client.id} /></div></td>
          </tr>)}
          searchValues={people.clients.map((client) => `${client.fullName} ${client.phone} ${client.email ?? ""} ${client.accountStatus}`)}
          filterValues={people.clients.map((client) => client.accountStatus)}
          filterLabel="Status"
          filters={["active", "pending", "suspended", "disabled"].map((status) => ({ value: status, label: status }))}
          emptyMessage="No clients found."
        />
      </div>
    </div>
  );
}
