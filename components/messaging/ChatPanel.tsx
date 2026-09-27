"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postMessage } from "@/lib/actions/app";
import type { ChatThread } from "@/lib/data/views";

export function ChatPanel({ thread }: { thread: ChatThread }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await postMessage(thread.id, body);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex-1 space-y-3 px-4 py-4">
        {thread.messages.map((message) => (
          <div key={message.id} className={message.mine ? "ml-12 text-right" : "mr-12"}>
            <p className="mb-1 text-xs text-muted">{message.sender}</p>
            <p className={`inline-block rounded-3xl px-4 py-3 text-left text-sm ${message.mine ? "bg-brand text-white" : "bg-canvas"}`}>{message.body}</p>
            <p className="mt-1 text-[11px] text-muted">{message.timeLabel}</p>
          </div>
        ))}
        {!thread.messages.length ? <p className="text-sm text-muted">No messages yet.</p> : null}
      </div>
      {thread.open ? (
        <form onSubmit={send} className="flex gap-2 border-t border-line p-3 safe-bottom">
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a message..." className="h-12 flex-1 rounded-full border border-line px-4" />
          <button disabled={pending} className="h-12 rounded-full bg-brand px-5 font-semibold text-white disabled:opacity-60">Send</button>
        </form>
      ) : <p className="border-t border-line p-4 text-sm text-muted safe-bottom">{thread.closedReason}</p>}
      {error ? <p className="px-4 pb-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
