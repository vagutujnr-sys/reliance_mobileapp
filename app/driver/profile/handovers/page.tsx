import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getDriverProfile } from "@/lib/server/driver-service";

export default async function HandoverHistoryPage() {
  const profile = await requireProfile(["driver"]);
  const data = await getDriverProfile(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/driver/profile" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="text-lg font-semibold">Handovers</h1>
      </header>
      <div className="space-y-3">
        {data.handovers.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line p-4">
            <p className="font-semibold">{item.vehicle}</p>
            <p className="text-sm text-muted">{item.from} → {item.to}</p>
            <p className="text-sm capitalize">{item.status} · {item.when}</p>
          </article>
        ))}
        {!data.handovers.length ? <p className="text-sm text-muted">No handovers yet.</p> : null}
      </div>
    </div>
  );
}
