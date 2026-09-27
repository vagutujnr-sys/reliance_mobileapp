import "server-only";
import { formatDate, formatSchedule } from "@/lib/format";
import { clientStatusLabel } from "@/lib/domain/labels";
import { chatAllowed, journeyMilestones } from "@/lib/domain/journey";
import type { Client, Vehicle } from "@/lib/data/types";
import type { ClientHome, ClientJourney, ClientPayments, ClientVehicleCard, InvoiceView } from "@/lib/data/views";
import { audit, db, notify, nowIso, ServiceError } from "@/lib/server/context";

function mask(value: string) {
  const tail = value.slice(-4);
  return `${"•".repeat(8)}${tail}`;
}

function card(vehicle: Vehicle, lastMilestone: string | null): ClientVehicleCard {
  return {
    id: vehicle.id,
    title: `${vehicle.make} ${vehicle.model}`,
    colour: vehicle.colour,
    year: vehicle.year,
    registration: vehicle.registration,
    reference: vehicle.referenceNumber,
    imageUrl: vehicle.imageUrl,
    status: vehicle.status,
    statusLabel: clientStatusLabel(vehicle.status),
    insured: vehicle.insuranceStatus === "insured",
    insurer: vehicle.insuranceProvider,
    insuranceExpiry: vehicle.insuranceExpiry,
    origin: vehicle.origin,
    destination: vehicle.destination,
    etaLabel: vehicle.estimatedArrival ? formatSchedule(vehicle.estimatedArrival) : null,
    lastMilestone,
    managedBy: "Reliance Mobility Solutions",
    vinMasked: mask(vehicle.vin),
    engineMasked: mask(vehicle.engineNumber),
  };
}

async function clientFor(profileId: string) {
  const repo = await db();
  const client = await repo.getClientByProfile(profileId);
  if (!client || !client.appAccess || client.accountStatus !== "active") {
    throw new ServiceError("Client access is not active.");
  }
  return { repo, client };
}

async function ownVehicle(client: Client, vehicleId: string, repo: Awaited<ReturnType<typeof db>>) {
  const vehicle = await repo.getVehicle(vehicleId);
  if (!vehicle || vehicle.ownerId !== client.id) throw new ServiceError("Vehicle not found.");
  return vehicle;
}

export async function getClientHome(profileId: string): Promise<ClientHome> {
  const { repo, client } = await clientFor(profileId);
  const vehicles = (await repo.listVehicles()).filter((item) => item.ownerId === client.id);
  const checkpoints = await repo.listCheckpoints();
  const notes = await repo.listNotifications(profileId);
  const cards = [];
  let chatOpen = false;
  for (const vehicle of vehicles) {
    const trips = (await repo.listTrips()).filter((trip) => trip.vehicleId === vehicle.id);
    const trip = trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const reached = trip ? await repo.listReached(trip.id) : [];
    const last = [...reached].sort((a, b) => b.reachedAt.localeCompare(a.reachedAt))[0];
    const checkpoint = last ? checkpoints.find((item) => item.id === last.checkpointId) : null;
    cards.push(card(vehicle, checkpoint ? `${checkpoint.city}, ${checkpoint.country}` : null));
    if (chatAllowed({ override: client.chatOverride, appAccess: client.appAccess, checkpoints, reached, status: vehicle.status })) {
      chatOpen = true;
    }
  }
  const active = cards.find((item) => !["delivered", "awaiting_shipment"].includes(item.status));
  const ordered = active ? [active, ...cards.filter((item) => item.id !== active.id)] : cards;
  return { name: client.fullName, unread: notes.filter((item) => !item.read).length, vehicles: ordered, chatOpen };
}

export async function getClientJourney(profileId: string, vehicleId: string): Promise<ClientJourney> {
  const { repo, client } = await clientFor(profileId);
  const vehicle = await ownVehicle(client, vehicleId, repo);
  const checkpoints = await repo.listCheckpoints();
  const trips = (await repo.listTrips()).filter((trip) => trip.vehicleId === vehicle.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const trip = trips[0];
  const reached = trip ? await repo.listReached(trip.id) : [];
  const plan = trip?.checkpointIds ?? checkpoints.map((item) => item.id);
  const milestones = journeyMilestones({ status: vehicle.status, checkpointIds: plan, checkpoints, reached });
  const last = [...milestones].reverse().find((item) => item.state === "current" || item.state === "done");
  const route = plan
    .map((id) => checkpoints.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({ latitude: item.latitude, longitude: item.longitude, label: item.name }));
  const latestReached = [...reached].sort((a, b) => b.reachedAt.localeCompare(a.reachedAt))[0];
  return {
    vehicleId: vehicle.id,
    title: `${vehicle.make} ${vehicle.model}`,
    registration: vehicle.registration,
    imageUrl: vehicle.imageUrl,
    statusLabel: clientStatusLabel(vehicle.status),
    insured: vehicle.insuranceStatus === "insured",
    origin: vehicle.origin,
    destination: vehicle.destination,
    etaLabel: vehicle.estimatedArrival ? formatSchedule(vehicle.estimatedArrival) : null,
    lastPlace: last?.detail ?? last?.title ?? null,
    updatedLabel: latestReached ? formatSchedule(latestReached.reachedAt) : null,
    milestones,
    route,
  };
}

export async function getClientVehicle(profileId: string, vehicleId: string) {
  const { repo, client } = await clientFor(profileId);
  const vehicle = await ownVehicle(client, vehicleId, repo);
  const journey = await getClientJourney(profileId, vehicleId);
  return { ...card(vehicle, journey.lastPlace), milestones: journey.milestones };
}

export async function getClientPayments(profileId: string): Promise<ClientPayments> {
  const { repo, client } = await clientFor(profileId);
  const settings = await repo.getSettings();
  const rows = (await repo.listPayments()).filter((item) => item.clientId === client.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paid = rows.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const outstanding = rows.filter((item) => item.status !== "paid" && item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
  return {
    total: paid + outstanding,
    paid,
    outstanding,
    instructions: settings.paymentInstructions,
    rows: rows.map((item) => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      status: item.status,
      dateLabel: formatDate(item.paidOn ?? item.createdAt),
      kind: item.kind,
    })),
  };
}

export async function submitPaymentProof(profileId: string, paymentId: string, url: string, reference: string) {
  const { repo, client } = await clientFor(profileId);
  const payment = (await repo.listPayments()).find((item) => item.id === paymentId && item.clientId === client.id);
  if (!payment) throw new ServiceError("Payment not found.");
  if (payment.status === "paid") throw new ServiceError("This payment is already confirmed.");
  payment.status = "awaiting_verification";
  payment.proofUrl = url;
  payment.reference = reference || payment.reference;
  await repo.savePayment(payment);
  await audit(repo, await repo.getProfile(profileId), "payment_submitted", "payment", payment.id, `${client.fullName} uploaded proof of payment.`);
  const admins = (await repo.listProfiles()).filter((item) => item.role === "admin" || item.role === "super_admin");
  for (const admin of admins) {
    await notify(repo, admin.id, "Payment proof uploaded", `${client.fullName} submitted proof for ${payment.description}.`, "/admin/payments");
  }
}

export async function getClientInvoices(profileId: string): Promise<InvoiceView[]> {
  const { repo, client } = await clientFor(profileId);
  const invoices = (await repo.listInvoices()).filter((item) => item.clientId === client.id);
  return Promise.all(invoices.map((invoice) => presentInvoice(repo, invoice.id)));
}

export async function getInvoiceForActor(profileId: string, invoiceId: string, staff: boolean) {
  const repo = await db();
  const invoice = (await repo.listInvoices()).find((item) => item.id === invoiceId);
  if (!invoice) throw new ServiceError("Invoice not found.");
  if (!staff) {
    const client = await repo.getClientByProfile(profileId);
    if (!client || client.id !== invoice.clientId) throw new ServiceError("Invoice not found.");
  }
  return presentInvoice(repo, invoiceId);
}

async function presentInvoice(repo: Awaited<ReturnType<typeof db>>, invoiceId: string): Promise<InvoiceView> {
  const invoice = (await repo.listInvoices()).find((item) => item.id === invoiceId);
  if (!invoice) throw new ServiceError("Invoice not found.");
  const client = await repo.getClient(invoice.clientId);
  const vehicle = await repo.getVehicle(invoice.vehicleId);
  const payments = (await repo.listPayments()).filter((item) => item.invoiceId === invoice.id && item.status === "paid");
  const total = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const paid = payments.reduce((sum, item) => sum + item.amount, 0);
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    vehicle: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : "Vehicle",
    client: client?.fullName ?? "Client",
    issuedOn: formatDate(invoice.issuedOn),
    dueOn: formatDate(invoice.dueOn),
    notes: invoice.notes,
    items: invoice.items,
    total,
    paid,
    balance: Math.max(0, total - paid),
  };
}

export async function getClientReceipts(profileId: string) {
  const { repo, client } = await clientFor(profileId);
  return (await repo.listReceipts())
    .filter((item) => item.clientId === client.id)
    .map((item) => ({ ...item, issuedLabel: formatDate(item.issuedOn) }));
}

export { nowIso };
