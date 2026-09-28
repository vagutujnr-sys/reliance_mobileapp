import "server-only";
import { isRemote } from "@/lib/config";
import type { Activity, AppNotification, Profile, Repo } from "@/lib/data/types";

export class ServiceError extends Error {}

export async function db(): Promise<Repo> {
  isRemote();
  const { supabaseRepo } = await import("@/lib/data/supabase-repo");
  return supabaseRepo;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function audit(
  repo: Repo,
  actor: Pick<Profile, "id" | "fullName"> | null,
  eventType: string,
  entity: string,
  entityId: string,
  message: string,
) {
  const entry: Activity = {
    id: crypto.randomUUID(),
    actorId: actor?.id ?? null,
    actorName: actor?.fullName ?? "System",
    eventType,
    entity,
    entityId,
    message,
    createdAt: nowIso(),
  };
  await repo.logActivity(entry);
}

export async function notify(repo: Repo, profileId: string, title: string, body: string, href: string | null) {
  const entry: AppNotification = {
    id: crypto.randomUUID(),
    profileId,
    title,
    body,
    href,
    read: false,
    createdAt: nowIso(),
  };
  await repo.saveNotification(entry);
}
