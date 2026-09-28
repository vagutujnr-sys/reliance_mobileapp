import { getSession } from "@/lib/auth/session";
import { getFleet } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return Response.json({ error: "Admin access is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const units = await getFleet(session.sub);
    return Response.json(units, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load fleet locations." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
}
