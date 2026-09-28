"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminAddDriverPayment, adminChatMode, adminCreateClient, adminCreateDriver, adminCreateInvoice, adminCreateStaff, adminCreateTrip, adminIssuePin, adminSaveSettings, adminSaveVehicle, adminSetAccess, adminVerifyPayment } from "@/lib/actions/app";
import type { AccountStatus, VehicleStatus } from "@/lib/data/types";
import { AdminFormModal, ConfirmDialog } from "@/components/admin/AdminModal";

export function Notice({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mt-3 rounded-2xl bg-canvas px-3 py-2 text-sm">{text}</p>;
}

export function ClientForm() {
  return (
    <AdminFormModal title="Add Client" triggerLabel="Add Client" submitLabel="Save Client" onSubmit={(form) => adminCreateClient({
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      appAccess: form.get("appAccess") === "on",
    })} successMessage={(data) => (data as { pin?: string | null } | undefined)?.pin ? `Client created. Initial PIN: ${(data as { pin: string }).pin}` : "Client record created."}>
      <input name="fullName" required placeholder="Full name" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="phone" required placeholder="Phone" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="email" type="email" placeholder="Email" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="address" placeholder="Address" className="h-10 rounded border border-line px-3 text-sm" />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="appAccess" type="checkbox" /> Activate app access and issue PIN</label>
    </AdminFormModal>
  );
}

export function DriverForm() {
  return (
    <AdminFormModal title="Add Driver" triggerLabel="Add Driver" submitLabel="Save Driver" onSubmit={(form) => adminCreateDriver({
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      licenceNumber: String(form.get("licenceNumber") || ""),
      nationalId: String(form.get("nationalId") || ""),
    })} successMessage={(data) => { const result = data as { code: string; pin: string }; return `Driver ${result.code} created. Initial PIN: ${result.pin}`; }}>
      <input name="fullName" required placeholder="Full name" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="phone" required placeholder="Phone" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="licenceNumber" placeholder="Licence number" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="nationalId" placeholder="National ID" className="h-10 rounded border border-line px-3 text-sm" />
    </AdminFormModal>
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
  return (
    <AdminFormModal title="Add Vehicle" triggerLabel="Add Vehicle" submitLabel="Save Vehicle" onSubmit={(form) => adminSaveVehicle({
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
    })}>
      <select name="ownerId" className="h-10 rounded border border-line px-3 text-sm">{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select>
      <input name="make" required placeholder="Make" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="model" required placeholder="Model" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="year" type="number" defaultValue={2024} className="h-10 rounded border border-line px-3 text-sm" />
      <input name="colour" placeholder="Colour" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="registration" required placeholder="Registration" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="vin" placeholder="VIN / chassis" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="engineNumber" placeholder="Engine number" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="origin" placeholder="Origin" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="destination" placeholder="Destination" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="shippingReference" placeholder="Shipping reference" className="h-10 rounded border border-line px-3 text-sm" />
      <select name="status" className="h-10 rounded border border-line px-3 text-sm">
        {["awaiting_shipment", "shipping", "ready_for_collection", "assigned", "collected", "in_transit", "at_checkpoint", "delayed", "arrived", "delivered"].map((status) => <option key={status}>{status}</option>)}
      </select>
      <select name="insuranceStatus" className="h-10 rounded border border-line px-3 text-sm"><option value="insured">Insured</option><option value="not_insured">Not insured</option></select>
      <input name="insuranceProvider" placeholder="Insurer" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="insuranceExpiry" type="date" className="h-10 rounded border border-line px-3 text-sm" />
    </AdminFormModal>
  );
}

export function TripForm({ vehicles, drivers }: { vehicles: { id: string; label: string }[]; drivers: { id: string; name: string }[] }) {
  return (
    <AdminFormModal title="Create Trip" triggerLabel="Create Trip" submitLabel="Create Trip" onSubmit={(form) => adminCreateTrip({
      vehicleId: String(form.get("vehicleId") || ""),
      driverId: String(form.get("driverId") || ""),
      origin: String(form.get("origin") || ""),
      destination: String(form.get("destination") || ""),
      eta: String(form.get("eta") || ""),
      distanceKm: Number(form.get("distanceKm") || 0),
    })}>
      <select name="vehicleId" className="h-10 rounded border border-line px-3 text-sm">{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select name="driverId" className="h-10 rounded border border-line px-3 text-sm">{drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input name="origin" placeholder="Origin" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="destination" placeholder="Destination" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="eta" type="datetime-local" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="distanceKm" type="number" placeholder="Distance km" className="h-10 rounded border border-line px-3 text-sm" />
    </AdminFormModal>
  );
}

export function InvoiceForm({ clients, vehicles }: { clients: { id: string; name: string }[]; vehicles: { id: string; label: string }[] }) {
  return (
    <AdminFormModal title="Create Invoice" triggerLabel="Create Invoice" submitLabel="Save Invoice" onSubmit={(form) => adminCreateInvoice({
      clientId: String(form.get("clientId") || ""),
      vehicleId: String(form.get("vehicleId") || ""),
      description: String(form.get("description") || ""),
      amount: Number(form.get("amount") || 0),
      dueOn: String(form.get("dueOn") || ""),
      notes: String(form.get("notes") || ""),
    })}>
      <select name="clientId" className="h-10 rounded border border-line px-3 text-sm">{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="vehicleId" className="h-10 rounded border border-line px-3 text-sm">{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <input name="description" required placeholder="Item description" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="amount" type="number" required placeholder="Amount" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="dueOn" type="date" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="notes" placeholder="Notes" className="h-10 rounded border border-line px-3 text-sm" />
    </AdminFormModal>
  );
}

export function VerifyButton({ id }: { id: string }) {
  return <ConfirmDialog title="Verify Payment?" description="This payment will be marked as verified and a receipt will be issued." confirmLabel="Verify Payment" onConfirm={() => adminVerifyPayment(id, true)}>
    <button type="button" className="bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verify & receipt</button>
  </ConfirmDialog>;
}

export function DriverPayForm({ drivers }: { drivers: { id: string; name: string }[] }) {
  return (
    <AdminFormModal title="Create Driver Payment" triggerLabel="Create Driver Payment" submitLabel="Record Payment" onSubmit={(form) => adminAddDriverPayment({
      driverId: String(form.get("driverId") || ""),
      route: String(form.get("route") || ""),
      amount: Number(form.get("amount") || 0),
      status: String(form.get("status") || "pending") as "pending" | "approved" | "paid",
    })}>
      <select name="driverId" className="h-10 rounded border border-line px-3 text-sm">{drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input name="route" placeholder="Route" className="h-10 rounded border border-line px-3 text-sm" />
      <input name="amount" type="number" placeholder="Amount" className="h-10 rounded border border-line px-3 text-sm" />
      <select name="status" className="h-10 rounded border border-line px-3 text-sm"><option>pending</option><option>approved</option><option>paid</option></select>
    </AdminFormModal>
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
