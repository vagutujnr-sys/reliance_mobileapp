"use client";

import { useState } from "react";
import { updatePin } from "@/lib/actions/app";

export function PinForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await updatePin(currentPin, nextPin);
    setPending(false);
    setMessage(result.ok ? "PIN updated." : result.error);
    if (result.ok) {
      setCurrentPin("");
      setNextPin("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="Current PIN" className="h-14 w-full rounded-2xl border border-line px-4 tracking-[0.4em]" />
      <input value={nextPin} onChange={(event) => setNextPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="New PIN" className="h-14 w-full rounded-2xl border border-line px-4 tracking-[0.4em]" />
      {message ? <p className="text-sm">{message}</p> : null}
      <button disabled={pending} className="h-12 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : "Update PIN"}</button>
    </form>
  );
}
