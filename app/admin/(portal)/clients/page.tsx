import { requireProfile } from "@/lib/auth/session";
import { listPeople } from "@/lib/server/admin-service";
import { AccessButtons, ChatMode, ClientForm } from "@/components/admin/OpsForms";

export default async function ClientsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Clients</h1>
      <ClientForm />
      <div className="mt-4 space-y-3">
        {people.clients.map((client) => (
          <article key={client.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{client.fullName}</p>
            <p className="text-sm text-muted">{client.phone} · App {client.appAccess ? "on" : "off"} · {client.accountStatus}</p>
            <p className="mt-1 text-sm">Vehicles: {people.vehicles.filter((vehicle) => vehicle.ownerId === client.id).map((vehicle) => vehicle.registration).join(", ") || "None"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AccessButtons kind="client" id={client.id} />
              <ChatMode clientId={client.id} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
