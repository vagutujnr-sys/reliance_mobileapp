import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readToken, signSession, type SessionToken } from "@/lib/auth/token";
import type { Role } from "@/lib/data/types";
import { db } from "@/lib/server/context";

const COOKIE = "rms_session";

export async function getSession() {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}

export async function setSession(session: SessionToken) {
  const jar = await cookies();
  jar.set(COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireProfile(roles: Role[]) {
  const session = await getSession();
  const staffOnly = roles.every((role) => role === "admin" || role === "super_admin");
  const signIn = staffOnly ? "/admin/login" : "/login";
  if (!session || !roles.includes(session.role)) redirect(signIn);
  const profile = await (await db()).getProfile(session.sub);
  if (!profile || profile.accountStatus !== "active") {
    await clearSession();
    redirect(`${signIn}?error=inactive`);
  }
  return profile;
}
