"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { createHandoverCode, receiveHandover } from "@/lib/actions/app";
import type { TripSummary } from "@/lib/data/views";

export function HandoverScreen({ trips, qr }: { trips: TripSummary[]; qr: string | null }) {
  const router = useRouter();
  const active = trips.find((trip) => trip.status === "in_transit");
  const [mode, setMode] = useState<"give" | "receive">(active ? "give" : "receive");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [image, setImage] = useState(qr);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [vehicle, setVehicle] = useState(active?.title ?? "");
  const [registration, setRegistration] = useState(active?.registration ?? "");
  const [destination, setDestination] = useState(active?.dropoff ?? "");

  async function generate() {
    if (!active) return;
    setPending(true);
    setError("");
    const result = await createHandoverCode(active.id);
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Could not create a code." : result.error);
      return;
    }
    setCode(result.data.code);
    setToken(result.data.token);
    setVehicle(result.data.vehicle);
    setRegistration(result.data.registration);
    setDestination(result.data.destination);
    const QR = await import("qrcode");
    setImage(await QR.toDataURL(`reliance-handover:${result.data.token}`, { margin: 1, width: 280 }));
  }

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const coords = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
    const result = await receiveHandover(token || code, coords);
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Could not accept the vehicle." : result.error);
      return;
    }
    router.push(`/driver/trips/${result.data.tripId}/tracking`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-white px-5 pb-10">
      <header className="flex items-center gap-3 py-4 safe-top">
        <Link href="/driver" className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="flex-1 text-center text-lg font-semibold">Vehicle Handover</h1>
        <span className="w-10" />
      </header>
      <div className="grid grid-cols-2 rounded-full bg-canvas p-1 text-sm font-semibold">
        <button type="button" onClick={() => setMode("give")} className={mode === "give" ? "rounded-full bg-brand py-2.5 text-white" : "py-2.5"}>Hand over</button>
        <button type="button" onClick={() => setMode("receive")} className={mode === "receive" ? "rounded-full bg-brand py-2.5 text-white" : "py-2.5"}>Receive</button>
      </div>
      {mode === "give" ? (
        <div className="mt-6 text-center">
          {active ? <p className="font-semibold">{vehicle || active.title}<br /><span className="text-sm text-muted">{registration || active.registration} · {destination || active.dropoff}</span></p> : <p className="text-muted">Start a trip before handing a vehicle over.</p>}
          {image ? <img src={image} alt="Handover QR code" className="mx-auto mt-5 h-64 w-64 rounded-3xl border border-line" /> : null}
          {code ? <p className="mt-4 text-3xl font-bold tracking-[0.3em]">{code}</p> : null}
          <p className="mt-3 text-sm text-muted">The next driver scans this code or enters it. The client still sees one journey.</p>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button disabled={!active || pending} onClick={generate} className="mt-5 h-12 w-full rounded-full bg-ink font-semibold text-white disabled:opacity-40">{pending ? "Creating..." : code ? "Refresh code" : "Generate handover code"}</button>
        </div>
      ) : (
        <form onSubmit={accept} className="mt-6 space-y-4">
          <p className="text-sm text-muted">Scan the current driver’s QR or enter the 6-digit code.</p>
          <ScanBox onValue={setToken} />
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Handover code" className="h-14 w-full rounded-2xl border border-line px-4 text-center text-lg tracking-[0.25em]" />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={pending} className="h-14 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">{pending ? "Checking..." : "Accept Vehicle"}</button>
        </form>
      )}
    </div>
  );
}

function ScanBox({ onValue }: { onValue: (value: string) => void }) {
  const [message, setMessage] = useState("Camera opens only when you start a scan.");
  async function scan() {
    const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices) {
      setMessage("This browser cannot scan QR codes. Enter the handover code instead.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();
    const detector = new Detector({ formats: ["qr_code"] });
    const started = Date.now();
    let found = "";
    while (!found && Date.now() - started < 20000) {
      const codes = await detector.detect(video);
      found = codes[0]?.rawValue ?? "";
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    stream.getTracks().forEach((track) => track.stop());
    if (!found) {
      setMessage("No code detected. Enter it manually.");
      return;
    }
    const token = found.replace("reliance-handover:", "");
    onValue(token);
    setMessage("Code captured. Accept the vehicle.");
  }
  return (
    <button type="button" onClick={scan} className="h-12 w-full rounded-full bg-canvas font-semibold">{message}</button>
  );
}
