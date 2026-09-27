import "server-only";
import { hashSecret, verifySecret } from "@/lib/auth/pin";
import { normalizePhone } from "@/lib/phone";
import type { Role } from "@/lib/data/types";
import { audit, db, nowIso, ServiceError } from "@/lib/server/context";

const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export async function loginWithPhone(rawPhone: string, pin: string, ip: string): Promise<{ id: string; role: Role; name: string }> {
  if (!/^\d{4}$/.test(pin)) throw new ServiceError("Enter the 4-digit PIN.");
  const phone = normalizePhone(rawPhone);
  if (phone.length < 10) throw new ServiceError("Enter a valid phone number.");
  const repo = await db();
  const since = new Date(Date.now() - LOCK_MS).toISOString();
  const ipFailures = await repo.recentAttempts(ip, since);
  if (ipFailures >= 12) throw new ServiceError("Too many attempts from this network. Try again in 15 minutes.");

  const credential = await repo.findCredential(phone);
  const fail = async () => {
    await repo.logAttempt({ id: crypto.randomUUID(), phone, ip, success: false, createdAt: nowIso() });
  };
  if (!credential) {
    await fail();
    throw new ServiceError("Phone number or PIN is incorrect.");
  }
  if (credential.lockedUntil && new Date(credential.lockedUntil).getTime() > Date.now()) {
    throw new ServiceError("This account is temporarily locked. Try again in 15 minutes.");
  }
  const profile = await repo.getProfile(credential.profileId);
  if (!profile || profile.accountStatus !== "active") {
    throw new ServiceError("This account is not active. Contact Reliance Mobility.");
  }
  if (!verifySecret(pin, credential.pinHash)) {
    credential.failedAttempts += 1;
    if (credential.failedAttempts >= MAX_FAILS) {
      credential.lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
      credential.failedAttempts = 0;
    }
    await repo.saveCredential(credential);
    await fail();
    if (credential.lockedUntil) throw new ServiceError("Too many attempts. This account is locked for 15 minutes.");
    throw new ServiceError("Phone number or PIN is incorrect.");
  }
  credential.failedAttempts = 0;
  credential.lockedUntil = null;
  await repo.saveCredential(credential);
  await repo.logAttempt({ id: crypto.randomUUID(), phone, ip, success: true, createdAt: nowIso() });
  return { id: profile.id, role: profile.role, name: profile.fullName };
}

export async function loginWithPassword(email: string, password: string) {
  const repo = await db();
  const secret = await repo.findAdmin(email.trim());
  if (!secret || !verifySecret(password, secret.passwordHash)) {
    throw new ServiceError("Email or password is incorrect.");
  }
  const profile = await repo.getProfile(secret.profileId);
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin") || profile.accountStatus !== "active") {
    throw new ServiceError("This admin account is not active.");
  }
  return { id: profile.id, role: profile.role, name: profile.fullName };
}

export async function changePin(profileId: string, currentPin: string, nextPin: string) {
  if (!/^\d{4}$/.test(nextPin)) throw new ServiceError("Choose a 4-digit PIN.");
  if (currentPin === nextPin) throw new ServiceError("Choose a different PIN.");
  const repo = await db();
  const profile = await repo.getProfile(profileId);
  if (!profile?.phone) throw new ServiceError("This account has no phone number.");
  const credential = await repo.findCredential(profile.phone);
  if (!credential || !verifySecret(currentPin, credential.pinHash)) throw new ServiceError("Current PIN is incorrect.");
  credential.pinHash = hashSecret(nextPin);
  credential.failedAttempts = 0;
  credential.lockedUntil = null;
  await repo.saveCredential(credential);
  await audit(repo, profile, "pin_changed", "profile", profile.id, `${profile.fullName} changed their PIN.`);
}
