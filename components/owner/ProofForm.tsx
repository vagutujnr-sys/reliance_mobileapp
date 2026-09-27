"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadProof } from "@/lib/actions/app";

export function ProofForm({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await uploadProof(new FormData(event.currentTarget));
    setPending(false);
    setMessage(result.ok ? "Proof sent for verification." : result.error);
    if (result.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input name="paymentId" type="hidden" value={paymentId} />
      <input name="reference" placeholder="Payment reference" className="h-11 w-full rounded-2xl border border-line px-3 text-sm" />
      <input name="file" type="file" accept="image/*,.pdf" required className="text-sm" />
      <button disabled={pending} className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Uploading..." : "Upload proof"}</button>
      {message ? <p className="text-xs">{message}</p> : null}
    </form>
  );
}
