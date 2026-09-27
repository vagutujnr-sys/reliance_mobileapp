import "server-only";
import type { Repo } from "@/lib/data/types";

function unavailable(method: string): never {
  throw new Error(`Supabase data method "${method}" needs the migration in supabase/migrations/0001_init.sql and RMS_DATA_SOURCE=supabase.`);
}

export const supabaseRepo: Repo = new Proxy({} as Repo, {
  get(_target, property) {
    if (property === "then") return undefined;
    return async () => unavailable(String(property));
  },
});
