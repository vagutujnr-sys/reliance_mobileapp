"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { beginTrip, endTrip, pushLocation } from "@/lib/actions/app";
import type { DriverTracking } from "@/lib/data/views";
import { RouteMap } from "@/components/maps/RouteMap";
import { StatusPill } from "@/components/ui/StatusPill";

export function TrackingScreen({ trip, token }: { trip: DriverTracking; token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [speed, setSpeed] = useState(trip.speedKmh ?? 0);
  const [elapsed, setElapsed] = useState("00:00:00");
  const started = trip.status === "in_transit" || trip.status === "destination_reached";
  const lastSent = useRef(0);

  useEffect(() => {
    if (!started || !trip.startedAt) return;
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - new Date(trip.startedAt!).getTime()) / 1000));
      const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      setElapsed(`${hh}:${mm}:${ss}`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [started, trip.startedAt]);

  useEffect(() => {
    if (!started || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(async (position) => {
      const now = Date.now();
      if (now - lastSent.current < 15000) return;
      lastSent.current = now;
      const speedKmh = position.coords.speed == null ? null : Math.max(0, position.coords.speed * 3.6);
      if (speedKmh != null) setSpeed(Math.round(speedKmh));
      const result = await pushLocation({
        tripId: trip.tripId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speedKmh,
      });
      if (result.ok && result.data?.milestone) setNotice(`Checkpoint recorded: ${result.data.milestone}`);
    }, () => setNotice("Location is unavailable. The trip can continue, and Reliance can confirm checkpoints."), { enableHighAccuracy: true, maximumAge: 10000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [started, trip.tripId]);

  async function slideStart() {
    setPending(true);
    setError("");
    const coords = await once();
    const result = await beginTrip(trip.tripId, coords);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function finish() {
    if (!window.confirm("End this trip and mark the vehicle delivered?")) return;
    setPending(true);
    const coords = await once();
    const result = await endTrip(trip.tripId, coords);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/driver");
    router.refresh();
  }

  return (
    <div className="relative min-h-dvh bg-canvas">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 px-4 py-4 text-ink safe-top">
        <Link href={`/driver/trips/${trip.tripId}`} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"><ChevronLeft /></Link>
        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold shadow">{started ? "Live" : "Ready"}</div>
      </div>
      <RouteMap token={token} route={[trip.pickupPoint, ...trip.route, trip.destinationPoint]} position={trip.position} className="h-[58dvh] w-full" />
      <section className="relative z-10 -mt-8 rounded-t-[32px] bg-white px-5 pb-8 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{trip.title}</h1>
            <p className="text-sm text-muted">{trip.registration}</p>
          </div>
          <StatusPill status={trip.status} label={trip.statusLabel} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Distance" value={`${trip.distanceKm} km`} />
          <Stat label="Duration" value={started ? elapsed : "00:00:00"} />
          <Stat label="Avg Speed" value={`${Math.round(speed)} km/h`} />
        </div>
        <p className="mt-4 text-sm text-muted">{trip.pickup} → {trip.dropoff}</p>
        {notice ? <p className="mt-3 rounded-2xl bg-canvas px-3 py-2 text-sm">{notice}</p> : null}
        {error ? <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        {trip.status === "collected" ? <SlideButton disabled={pending} onConfirm={slideStart} label={pending ? "Starting..." : "Slide to Start Trip"} /> : null}
        {started ? <button disabled={pending} onClick={finish} className="mt-5 h-14 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">End Trip</button> : null}
        {trip.status === "assigned" || trip.status === "arrived_pickup" || trip.status === "inspected" ? (
          <Link href={`/driver/trips/${trip.tripId}/pickup`} className="mt-5 flex h-14 items-center justify-center rounded-full bg-brand font-semibold text-white">Continue Pickup</Link>
        ) : null}
        {trip.status === "delivered" ? <p className="mt-5 text-center font-semibold text-success">This trip is delivered.</p> : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-2 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function SlideButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [offset, setOffset] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function move(clientX: number) {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    const next = Math.min(Math.max(0, clientX - box.left - 28), box.width - 64);
    setOffset(next);
    if (next > box.width - 80) {
      dragging.current = false;
      setOffset(0);
      onConfirm();
    }
  }

  return (
    <div
      ref={track}
      className="relative mt-5 h-16 overflow-hidden rounded-full bg-brand text-white"
      onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (dragging.current && !disabled) move(event.clientX); }}
      onPointerUp={() => { dragging.current = false; setOffset(0); }}
    >
      <span className="absolute inset-0 grid place-items-center font-semibold">{label}</span>
      <span className="absolute left-2 top-2 grid h-12 w-12 place-items-center rounded-full bg-white text-lg text-brand" style={{ transform: `translateX(${offset}px)` }}>›</span>
    </div>
  );
}

function once() {
  return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}
