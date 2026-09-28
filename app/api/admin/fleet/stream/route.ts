import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth/session";
import { getFleet } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return Response.json({ error: "Admin access is required." }, { status: 401 });
  }

  try {
    await getFleet(session.sub);
  } catch {
    return Response.json({ error: "Admin access is required." }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: "Realtime is not configured." }, { status: 503 });

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const send = (event: string, data: unknown) => {
    if (closed) return;
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };
  const channel = supabase
    .channel(`admin-fleet-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "trip_locations" }, (payload) => {
      const row = payload.new;
      send("location", {
        tripId: row.trip_id,
        latitude: row.latitude,
        longitude: row.longitude,
        heading: row.heading,
        speedKmh: row.speed_kmh,
        recordedAt: row.recorded_at,
      });
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "trip_assignments" }, () => send("refresh", {}));

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 20_000);
      request.signal.addEventListener("abort", () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        void channel.unsubscribe();
        try { controller.close(); } catch {}
      }, { once: true });
      void channel.subscribe((status) => {
        if (status === "SUBSCRIBED") send("ready", {});
      });
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      void channel.unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
