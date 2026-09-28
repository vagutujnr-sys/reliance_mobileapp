import "server-only";

export function isRemote() {
  const source = (process.env.RMS_DATA_SOURCE ?? "supabase").trim().toLowerCase();
  if (source !== "supabase") {
    throw new Error('RMS_DATA_SOURCE must be "supabase". Local memory data is disabled.');
  }

  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Supabase configuration is missing: ${missing.join(", ")}.`);
  }

  return true;
}

export function mapboxToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
}
