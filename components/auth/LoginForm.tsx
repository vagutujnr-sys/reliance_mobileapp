"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { mobileLogin } from "@/lib/actions/app";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const code = pin.join("");
    if (code.length < 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }
    setPending(true);
    const result = await mobileLogin(phone, code);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(result.data?.href ?? "/");
    router.refresh();
  }

  return (
    <main className="phone-app flex min-h-dvh flex-col px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Image src="/brand/logo-transparent.png" alt="Reliance Mobility" width={96} height={96} className="mx-auto h-20 w-20 object-contain" />
      <h1 className="mt-6 text-center text-3xl font-bold">Welcome Back</h1>
      <p className="mt-2 text-center text-sm text-muted">Sign in with the phone number Reliance issued to you.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Phone Number</span>
          <div className="flex overflow-hidden rounded-2xl border border-line bg-white focus-within:border-brand">
            <span className="grid place-items-center border-r border-line px-4 text-sm font-semibold">+263</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="77 100 0101" className="h-14 w-full px-4 text-base outline-none" />
          </div>
        </label>
        <div>
          <span className="mb-2 block text-sm font-medium">4 Digit PIN</span>
          <div className="grid grid-cols-4 gap-3">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(node) => { inputs.current[index] = node; }}
                value={digit ? "•" : ""}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !pin[index] && index > 0) inputs.current[index - 1]?.focus();
                  if (event.key === "Backspace") setDigit(index, "");
                }}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`PIN digit ${index + 1}`}
                className="h-16 rounded-2xl border border-line text-center text-2xl outline-none focus:border-brand"
              />
            ))}
          </div>
        </div>
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <button disabled={pending} className="h-14 w-full rounded-full bg-brand text-lg font-semibold text-white disabled:opacity-60">
          {pending ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
