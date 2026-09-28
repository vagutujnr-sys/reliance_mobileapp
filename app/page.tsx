import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function SplashPage() {
  const session = await getSession();
  const href = session?.role === "driver" ? "/driver" : session?.role === "client" ? "/owner" : session?.role === "admin" || session?.role === "super_admin" ? "/admin" : "/login";
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <Image src="/brand/splash-background.png" alt="" fill priority className="object-cover object-[center_40%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/80" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-between px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Image src="/brand/logo-transparent.png" alt="Reliance Mobility Solutions" width={520} height={520} priority className="w-[86%] max-w-[380px]" />
        <div className="w-full">
          <Link href={href} className="flex h-14 w-full items-center justify-center rounded-full bg-brand text-lg font-semibold shadow-lg shadow-black/30">
            {session ? "Continue" : "Login"}
          </Link>
        </div>
      </div>
    </main>
  );
}
