import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/data/types";

export type SessionToken = {
  sub: string;
  role: Role;
  name: string;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return new TextEncoder().encode(value || "dev-only-reliance-session-secret-change-me");
}

export async function signSession(payload: SessionToken) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function readToken(token: string | undefined | null): Promise<SessionToken | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role;
    const name = payload.name;
    const sub = payload.sub;
    if (typeof sub !== "string" || typeof name !== "string" || typeof role !== "string") return null;
    if (!["super_admin", "admin", "driver", "client"].includes(role)) return null;
    return { sub, role: role as Role, name };
  } catch {
    return null;
  }
}
