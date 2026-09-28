"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin } from "@/lib/actions/app";

export function AdminLoginForm({ error }: { error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(error === "inactive" ? "This account is not active." : "");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await adminLogin(email, password);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
        <Image src="/brand/logo-transparent.png" alt="Reliance Mobility" width={72} height={72} className="h-16 w-16 object-contain" />
        <h1 className="mt-5 text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Email and password for Reliance operations.</p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" className="mt-2 h-12 w-full rounded-2xl border border-line px-4 outline-none focus:border-brand" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-2 h-12 w-full rounded-2xl border border-line px-4 outline-none focus:border-brand" />
        </label>
        {message ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p> : null}
        <button disabled={pending} className="mt-6 h-12 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">
          {pending ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
