import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { readNotifications } from "@/lib/actions/app";
import { requireProfile } from "@/lib/auth/session";
import { listNotifications } from "@/lib/server/driver-service";
import { formatDateTime } from "@/lib/format";

export default async function NotificationsPage() {
  const profile = await requireProfile(["driver"]);
  const items = await listNotifications(profile.id);
  return (
    <div className="min-h-dvh bg-white px-5">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/driver" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="flex-1 text-lg font-semibold">Notifications</h1>
        <form action={readNotifications}><button className="text-sm font-semibold text-brand">Mark read</button></form>
      </header>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.body}</p>
            <p className="mt-1 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
