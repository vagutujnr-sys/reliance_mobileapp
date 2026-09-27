import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getThread, inboxFor } from "@/lib/server/chat-service";
import { ChatPanel } from "@/components/messaging/ChatPanel";

export default async function DriverChatPage() {
  const profile = await requireProfile(["driver"]);
  const inbox = await inboxFor(profile.id);
  const first = inbox[0];
  if (!first) {
    return <div className="p-6">No conversation yet.</div>;
  }
  const thread = await getThread(profile.id, first.id);
  return (
    <div>
      <header className="flex items-center gap-3 px-4 py-4 safe-top">
        <Link href="/driver/profile" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="font-semibold">{thread.title}</h1>
      </header>
      <ChatPanel thread={thread} />
    </div>
  );
}
