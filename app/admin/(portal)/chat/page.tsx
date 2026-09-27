import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { getThread, inboxFor } from "@/lib/server/chat-service";
import { ChatPanel } from "@/components/messaging/ChatPanel";

export default async function AdminChatPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const profile = await requireProfile(["super_admin", "admin"]);
  const query = await searchParams;
  const inbox = await inboxFor(profile.id);
  const selected = query.id ?? inbox[0]?.id;
  const thread = selected ? await getThread(profile.id, selected) : null;
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Communication</h1>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {inbox.map((item) => (
            <Link key={item.id} href={`/admin/chat?id=${item.id}`} className="block rounded-2xl bg-white p-3 text-sm">
              <p className="font-semibold">{item.title}</p>
              <p className="text-muted">{item.preview}</p>
              {item.unread ? <span className="text-xs text-brand">{item.unread} unread</span> : null}
            </Link>
          ))}
        </div>
        <div className="overflow-hidden rounded-3xl bg-white">{thread ? <ChatPanel thread={thread} /> : <p className="p-6">No conversations.</p>}</div>
      </div>
    </div>
  );
}
