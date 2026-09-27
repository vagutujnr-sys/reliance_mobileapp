"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { markArrived, saveInspection, uploadTripPhoto } from "@/lib/actions/app";
import type { Condition, FuelLevel, PhotoSlot } from "@/lib/data/types";
import type { TripDetail } from "@/lib/data/views";

const slots: { slot: PhotoSlot; label: string; required: boolean }[] = [
  { slot: "front", label: "Front", required: true },
  { slot: "rear", label: "Rear", required: true },
  { slot: "left", label: "Left", required: true },
  { slot: "right", label: "Right", required: true },
  { slot: "interior", label: "Interior", required: false },
  { slot: "dashboard", label: "Dashboard", required: false },
  { slot: "damage", label: "Damage", required: false },
  { slot: "additional", label: "Additional", required: false },
];

export function PickupFlow({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [step, setStep] = useState(trip.canArrive ? 0 : 1);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [photos, setPhotos] = useState(trip.photos);
  const [exterior, setExterior] = useState<Condition>("good");
  const [tyres, setTyres] = useState<Condition>("good");
  const [windows, setWindows] = useState<Condition>("good");
  const [lights, setLights] = useState<Condition>("good");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [visibleDamage, setVisibleDamage] = useState(false);
  const [notes, setNotes] = useState("");

  async function arrive() {
    setPending(true);
    setError("");
    const coords = await readCoords();
    const result = await markArrived(trip.id, coords);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep(1);
    router.refresh();
  }

  async function onPhoto(slot: PhotoSlot, file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    const body = new FormData();
    body.set("tripId", trip.id);
    body.set("slot", slot);
    body.set("file", file);
    const result = await uploadTripPhoto(body);
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Upload failed." : result.error);
      return;
    }
    setPhotos((current) => [...current, { id: crypto.randomUUID(), slot, url: result.data!.url }]);
  }

  async function inspect(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await saveInspection({ tripId: trip.id, exterior, tyres, windows, lights, fuelLevel, visibleDamage, notes });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/driver/trips/${trip.id}/tracking`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-white pb-8">
      <header className="flex items-center gap-3 px-4 py-4 safe-top">
        <Link href={`/driver/trips/${trip.id}`} className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><ChevronLeft /></Link>
        <h1 className="flex-1 text-center text-lg font-semibold">Car Pickup</h1>
        <span className="w-10" />
      </header>
      <ol className="grid grid-cols-3 gap-2 px-5 text-center text-xs font-semibold">
        {["Arrival", "Inspection", "Start Trip"].map((label, index) => (
          <li key={label} className="space-y-2">
            <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${index <= step ? "bg-brand text-white" : "bg-canvas text-muted"}`}>{index + 1}</span>
            <span className={index === step ? "text-brand" : "text-muted"}>{label}</span>
          </li>
        ))}
      </ol>
      <section className="px-5 pt-5">
        <div className="flex gap-3 rounded-3xl border border-line p-3">
          <img src={trip.imageUrl ?? "/vehicles/suv-white.svg"} alt="" className="h-16 w-24 rounded-2xl object-cover" />
          <div>
            <p className="font-semibold">{trip.title}</p>
            <p className="text-sm text-muted">{trip.colour} · {trip.year}</p>
            <p className="text-sm font-medium">{trip.registration}</p>
          </div>
        </div>
        {step === 0 ? (
          <div className="mt-6">
            <p className="text-sm text-muted">Pickup location</p>
            <p className="font-semibold">{trip.pickup}</p>
            <p className="mt-1 text-sm text-muted">{trip.pickupLabel}</p>
            <p className="mt-4 text-sm text-muted">Location is used to record that you have arrived. It is not requested until you continue.</p>
            {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
            <button disabled={pending} onClick={arrive} className="mt-6 h-14 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">{pending ? "Recording..." : "I Have Arrived"}</button>
          </div>
        ) : (
          <form onSubmit={inspect} className="mt-6 space-y-5">
            <div>
              <h2 className="font-semibold">Take Photos of Vehicle</h2>
              <p className="text-sm text-muted">Front, rear, left and right are required.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {slots.map((item) => {
                  const shot = [...photos].reverse().find((photo) => photo.slot === item.slot);
                  return (
                    <label key={item.slot} className="relative grid h-28 place-items-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-canvas text-sm">
                      {shot ? <img src={shot.url} alt="" className="h-full w-full object-cover" /> : item.label}
                      <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => onPhoto(item.slot, event.target.files?.[0])} />
                    </label>
                  );
                })}
              </div>
            </div>
            <ConditionField label="Exterior condition" value={exterior} onChange={setExterior} />
            <ConditionField label="Tyres" value={tyres} onChange={setTyres} />
            <ConditionField label="Windows" value={windows} onChange={setWindows} />
            <ConditionField label="Lights" value={lights} onChange={setLights} />
            <label className="block text-sm font-medium">
              Fuel level
              <select value={fuelLevel} onChange={(event) => setFuelLevel(event.target.value as FuelLevel)} className="mt-2 h-12 w-full rounded-2xl border border-line px-3">
                <option value="full">Full</option>
                <option value="three_quarter">3/4</option>
                <option value="half">1/2</option>
                <option value="quarter">1/4</option>
                <option value="empty">Empty</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={visibleDamage} onChange={(event) => setVisibleDamage(event.target.checked)} />
              Visible damage
            </label>
            <label className="block text-sm font-medium">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-line p-3" placeholder="Describe damage or missing items" />
            </label>
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
            <button disabled={pending} className="h-14 w-full rounded-full bg-brand font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : "Confirm Pickup"}</button>
          </form>
        )}
      </section>
    </div>
  );
}

function ConditionField({ label, value, onChange }: { label: string; value: Condition; onChange: (value: Condition) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(["good", "fair", "poor"] as Condition[]).map((option) => (
          <button type="button" key={option} onClick={() => onChange(option)} className={`h-10 rounded-full text-sm font-semibold capitalize ${value === option ? "bg-ink text-white" : "bg-canvas"}`}>{option}</button>
        ))}
      </div>
    </fieldset>
  );
}

function readCoords() {
  return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}
