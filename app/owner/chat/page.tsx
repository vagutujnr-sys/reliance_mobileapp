import { requireProfile } from "@/lib/auth/session";
import { getThread, inboxFor } from "@/lib/server/chat-service";
import { ChatPanel } from "@/components/messaging/ChatPanel";

export default async function OwnerChatPage() {
  const profile = await requireProfile(["client"]);
  const inbox = await inboxFor(profile.id);
  const first = inbox[0];
  if (!first) return <div className="p-6 pb-28">Messaging is not available yet.</div>;
  const thread = await getThread(profile.id, first.id);
  return (
    <div className="pb-24">
      <h1 className="px-5 pt-6 text-xl font-bold safe-top">Chat with Reliance</h1>
      <ChatPanel thread={thread} />
    </div>
  );
}
