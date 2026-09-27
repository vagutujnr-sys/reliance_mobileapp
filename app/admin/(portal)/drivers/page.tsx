import { requireProfile } from "@/lib/auth/session";
import { listPeople } from "@/lib/server/admin-service";
import { AccessButtons, DriverForm } from "@/components/admin/OpsForms";

export default async function DriversPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const people = await listPeople(profile.id);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Drivers</h1>
      <DriverForm />
      <div className="mt-4 space-y-3">
        {people.drivers.map((driver) => (
          <article key={driver.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{driver.fullName} · {driver.driverCode}</p>
                <p className="text-sm text-muted">{driver.phone} · {driver.carsTransported} cars · {Math.round(driver.distanceKm).toLocaleString()} km · {driver.accountStatus}</p>
              </div>
              <AccessButtons kind="driver" id={driver.id} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
