import { requireProfile } from "@/lib/auth/session";
import { getReports } from "@/lib/server/admin-service";
import { formatUsd } from "@/lib/format";

export default async function ReportsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const report = await getReports(profile.id);
  const max = Math.max(1, ...report.countries.map((item) => item.km));
  return (
    <div>
      <h1 className="text-3xl font-bold">Reports</h1>
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl bg-white p-5"><p className="text-sm text-muted">Total trips</p><p className="text-3xl font-bold">{report.trips}</p></article>
        <article className="rounded-3xl bg-white p-5"><p className="text-sm text-muted">Revenue</p><p className="text-3xl font-bold">{formatUsd(report.revenue)}</p></article>
        <article className="rounded-3xl bg-white p-5"><p className="text-sm text-muted">Outstanding</p><p className="text-3xl font-bold">{formatUsd(report.outstanding)}</p></article>
      </section>
      <article className="mt-4 rounded-3xl bg-white p-5">
        <h2 className="font-semibold">Distance by country</h2>
        <div className="mt-4 space-y-3">
          {report.countries.map((item) => (
            <div key={item.country}>
              <div className="mb-1 flex justify-between text-sm"><span>{item.country}</span><span>{item.km.toLocaleString()} km</span></div>
              <div className="h-3 rounded-full bg-canvas"><div className="h-3 rounded-full bg-brand" style={{ width: `${(item.km / max) * 100}%` }} /></div>
            </div>
          ))}
          {!report.countries.length ? <p className="text-sm text-muted">Checkpoint distance appears as vehicles move.</p> : null}
        </div>
      </article>
    </div>
  );
}
