"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminAddDriverPayment, adminChatMode, adminCreateClient, adminCreateDriver, adminCreateInvoice, adminCreateStaff, adminCreateTrip, adminIssuePin, adminSaveSettings, adminSaveVehicle, adminSetAccess, adminVerifyPayment } from "@/lib/actions/app";
import type { AccountStatus, VehicleStatus } from "@/lib/data/types";

export function Notice({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mt-3 rounded-2xl bg-canvas px-3 py-2 text-sm">{text}</p>;
}

export function ClientForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await adminCreateClient({
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      appAccess: form.get("appAccess") === "on",
    });
    setPending(false);
    if (!result.ok) return setMessage(result.error);
    setMessage(result.data?.pin ? `Client created. Initial PIN: ${result.data.pin}` : "Client record created without app access.");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-2">
      <input name="fullName" required placeholder="Full name" className="h-11 rounded-xl border border-line px-3" />
      <input name="phone" required placeholder="Phone" className="h-11 rounded-xl border border-line px-3" />
      <input name="email" placeholder="Email" className="h-11 rounded-xl border border-line px-3" />
      <input name="address" placeholder="Address" className="h-11 rounded-xl border border-line px-3" />
      <label className="flex items-center gap-2 text-sm"><input name="appAccess" type="checkbox" /> Activate app access and issue PIN</label>
      <button disabled={pending} className="h-11 rounded-full bg-brand font-semibold text-white">{pending ? "Saving..." : "Add Client"}</button>
      <Notice text={message} />
    </form>
  );
}

export function DriverForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminCreateDriver({
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      licenceNumber: String(form.get("licenceNumber") || ""),
      nationalId: String(form.get("nationalId") || ""),
    });
    if (!result.ok || !result.data) return setMessage(result.ok ? "Could not create the driver." : result.error);
    setMessage(`Driver ${result.data.code} created. Initial PIN: ${result.data.pin}`);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-2">
      <input name="fullName" required placeholder="Full name" className="h-11 rounded-xl border border-line px-3" />
      <input name="phone" required placeholder="Phone" className="h-11 rounded-xl border border-line px-3" />
      <input name="licenceNumber" placeholder="Licence number" className="h-11 rounded-xl border border-line px-3" />
      <input name="nationalId" placeholder="National ID" className="h-11 rounded-xl border border-line px-3" />
      <button className="h-11 rounded-full bg-brand font-semibold text-white">Add Driver</button>
      <Notice text={message} />
    </form>
  );
}

export function AccessButtons({ kind, id }: { kind: "client" | "driver"; id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function run(status: AccountStatus) {
    const result = await adminSetAccess(kind, id, status);
    setMessage(result.ok ? `Access set to ${status}.` : result.error);
    if (result.ok) router.refresh();
  }
  async function pin() {
    const result = await adminIssuePin(kind, id);
    setMessage(result.ok && result.data ? `New PIN: ${result.data.pin}` : result.ok ? "PIN issued." : result.error);
  }
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <button onClick={() => run("active")} className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Activate</button>
      <button onClick={() => run("suspended")} className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Suspend</button>
      <button onClick={() => run("disabled")} className="rounded-full bg-red-50 px-2 py-1 text-red-600">Disable</button>
      <button onClick={pin} className="rounded-full bg-canvas px-2 py-1">Reset PIN</button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}

export function VehicleForm({ owners }: { owners: { id: string; name: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminSaveVehicle({
      ownerId: String(form.get("ownerId") || ""),
      make: String(form.get("make") || ""),
      model: String(form.get("model") || ""),
      year: Number(form.get("year") || 2024),
      colour: String(form.get("colour") || ""),
      registration: String(form.get("registration") || ""),
      vin: String(form.get("vin") || ""),
      engineNumber: String(form.get("engineNumber") || ""),
      origin: String(form.get("origin") || ""),
      destination: String(form.get("destination") || ""),
      shippingReference: String(form.get("shippingReference") || ""),
      insuranceStatus: form.get("insuranceStatus") === "insured" ? "insured" : "not_insured",
      insuranceProvider: String(form.get("insuranceProvider") || ""),
      insuranceExpiry: String(form.get("insuranceExpiry") || ""),
      status: String(form.get("status") || "awaiting_shipment") as VehicleStatus,
    });
    setMessage(result.ok ? "Vehicle saved." : result.error);
    if (result.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-3">
      <select name="ownerId" className="h-11 rounded-xl border border-line px-3">{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select>
      <input name="make" required placeholder="Make" className="h-11 rounded-xl border border-line px-3" />
      <input name="model" required placeholder="Model" className="h-11 rounded-xl border border-line px-3" />
      <input name="year" type="number" defaultValue={2024} className="h-11 rounded-xl border border-line px-3" />
      <input name="colour" placeholder="Colour" className="h-11 rounded-xl border border-line px-3" />
      <input name="registration" required placeholder="Registration" className="h-11 rounded-xl border border-line px-3" />
      <input name="vin" placeholder="VIN / chassis" className="h-11 rounded-xl border border-line px-3" />
      <input name="engineNumber" placeholder="Engine number" className="h-11 rounded-xl border border-line px-3" />
      <input name="origin" placeholder="Origin" className="h-11 rounded-xl border border-line px-3" />
      <input name="destination" placeholder="Destination" className="h-11 rounded-xl border border-line px-3" />
      <input name="shippingReference" placeholder="Shipping reference" className="h-11 rounded-xl border border-line px-3" />
      <select name="status" className="h-11 rounded-xl border border-line px-3">
        {["awaiting_shipment", "shipping", "ready_for_collection", "assigned", "collected", "in_transit", "at_checkpoint", "delayed", "arrived", "delivered"].map((status) => <option key={status}>{status}</option>)}
      </select>
      <select name="insuranceStatus" className="h-11 rounded-xl border border-line px-3"><option value="insured">insured</option><option value="not_insured">not insured</option></select>
      <input name="insuranceProvider" placeholder="Insurer" className="h-11 rounded-xl border border-line px-3" />
      <input name="insuranceExpiry" type="date" className="h-11 rounded-xl border border-line px-3" />
      <button className="h-11 rounded-full bg-brand font-semibold text-white">Add Vehicle</button>
      <Notice text={message} />
    </form>
  );
}

export function TripForm({ vehicles, drivers }: { vehicles: { id: string; label: string }[]; drivers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminCreateTrip({
      vehicleId: String(form.get("vehicleId") || ""),
      driverId: String(form.get("driverId") || ""),
      origin: String(form.get("origin") || ""),
      destination: String(form.get("destination") || ""),
      eta: String(form.get("eta") || ""),
      distanceKm: Number(form.get("distanceKm") || 0),
    });
    setMessage(result.ok ? "Trip assigned." : result.error);
    if (result.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-3">
      <select name="vehicleId" className="h-11 rounded-xl border border-line px-3">{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select name="driverId" className="h-11 rounded-xl border border-line px-3">{drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input name="origin" placeholder="Origin" className="h-11 rounded-xl border border-line px-3" />
      <input name="destination" placeholder="Destination" className="h-11 rounded-xl border border-line px-3" />
      <input name="eta" type="datetime-local" className="h-11 rounded-xl border border-line px-3" />
      <input name="distanceKm" type="number" placeholder="Distance km" className="h-11 rounded-xl border border-line px-3" />
      <button className="h-11 rounded-full bg-brand font-semibold text-white">Create Trip</button>
      <Notice text={message} />
    </form>
  );
}

export function InvoiceForm({ clients, vehicles }: { clients: { id: string; name: string }[]; vehicles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminCreateInvoice({
      clientId: String(form.get("clientId") || ""),
      vehicleId: String(form.get("vehicleId") || ""),
      description: String(form.get("description") || ""),
      amount: Number(form.get("amount") || 0),
      dueOn: String(form.get("dueOn") || ""),
      notes: String(form.get("notes") || ""),
    });
    setMessage(result.ok ? "Invoice created." : result.error);
    if (result.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-3">
      <select name="clientId" className="h-11 rounded-xl border border-line px-3">{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="vehicleId" className="h-11 rounded-xl border border-line px-3">{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <input name="description" required placeholder="Item description" className="h-11 rounded-xl border border-line px-3" />
      <input name="amount" type="number" required placeholder="Amount" className="h-11 rounded-xl border border-line px-3" />
      <input name="dueOn" type="date" className="h-11 rounded-xl border border-line px-3" />
      <input name="notes" placeholder="Notes" className="h-11 rounded-xl border border-line px-3" />
      <button className="h-11 rounded-full bg-brand font-semibold text-white">Create Invoice</button>
      <Notice text={message} />
    </form>
  );
}

export function VerifyButton({ id }: { id: string }) {
  const router = useRouter();
  return <button onClick={async () => { await adminVerifyPayment(id, true); router.refresh(); }} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verify & receipt</button>;
}

export function DriverPayForm({ drivers }: { drivers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminAddDriverPayment({
      driverId: String(form.get("driverId") || ""),
      route: String(form.get("route") || ""),
      amount: Number(form.get("amount") || 0),
      status: String(form.get("status") || "pending") as "pending" | "approved" | "paid",
    });
    setMessage(result.ok ? "Driver payment recorded." : result.error);
    if (result.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-4">
      <select name="driverId" className="h-11 rounded-xl border border-line px-3">{drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input name="route" placeholder="Route" className="h-11 rounded-xl border border-line px-3" />
      <input name="amount" type="number" placeholder="Amount" className="h-11 rounded-xl border border-line px-3" />
      <select name="status" className="h-11 rounded-xl border border-line px-3"><option>pending</option><option>approved</option><option>paid</option></select>
      <button className="h-11 rounded-full bg-ink font-semibold text-white">Add driver payment</button>
      <Notice text={message} />
    </form>
  );
}

export function ChatMode({ clientId }: { clientId: string }) {
  const router = useRouter();
  return (
    <select defaultValue="auto" onChange={async (event) => { await adminChatMode(clientId, event.target.value as "auto" | "open" | "closed"); router.refresh(); }} className="rounded-full border border-line px-2 py-1 text-xs">
      <option value="auto">Chat auto</option>
      <option value="open">Force open</option>
      <option value="closed">Force closed</option>
    </select>
  );
}

export function SettingsForm({ supportPhone, supportEmail, paymentInstructions, superAdmin }: { supportPhone: string; supportEmail: string; paymentInstructions: string; superAdmin: boolean }) {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminSaveSettings({
      supportPhone: String(form.get("supportPhone") || ""),
      supportEmail: String(form.get("supportEmail") || ""),
      paymentInstructions: String(form.get("paymentInstructions") || ""),
    });
    setMessage(result.ok ? "Settings saved." : result.error);
  }
  async function staff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await adminCreateStaff({
      fullName: String(form.get("fullName") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    });
    setMessage(result.ok ? "Administrator created." : result.error);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 rounded-3xl bg-white p-4">
        <input name="supportPhone" defaultValue={supportPhone} className="h-11 rounded-xl border border-line px-3" />
        <input name="supportEmail" defaultValue={supportEmail} className="h-11 rounded-xl border border-line px-3" />
        <textarea name="paymentInstructions" defaultValue={paymentInstructions} rows={5} className="rounded-xl border border-line p-3" />
        <button className="h-11 rounded-full bg-brand font-semibold text-white">Save settings</button>
      </form>
      {superAdmin ? (
        <form onSubmit={staff} className="grid gap-2 rounded-3xl bg-white p-4">
          <h2 className="font-semibold">Add administrator</h2>
          <input name="fullName" placeholder="Name" className="h-11 rounded-xl border border-line px-3" />
          <input name="email" type="email" placeholder="Email" className="h-11 rounded-xl border border-line px-3" />
          <input name="password" type="password" placeholder="Temporary password" className="h-11 rounded-xl border border-line px-3" />
          <button className="h-11 rounded-full bg-ink font-semibold text-white">Create admin</button>
        </form>
      ) : null}
      <Notice text={message} />
    </div>
  );
}
