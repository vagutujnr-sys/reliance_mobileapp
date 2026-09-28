import "server-only";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((name): name is string => Boolean(name));
  if (missing.length > 0) {
    throw new Error(`Supabase connection is missing ${missing.join(" and ")}. Set these in .env.local for development and in your hosting environment before deploying.`);
  }

  try {
    const parsedUrl = new URL(url!);
    const secureRemote = parsedUrl.protocol === "https:";
    const localDevelopment = parsedUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
    if (!secureRemote && !localDevelopment) {
      throw new Error();
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase HTTPS URL (or local Supabase URL).");
  }

  return { url: url!, serviceRoleKey: serviceRoleKey! };
}

export function mapboxToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
}
