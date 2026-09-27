import "server-only";
import { hashSecret, randomPin } from "@/lib/auth/pin";
import { formatDateTime, formatSchedule } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { tripLabel, vehicleLabel } from "@/lib/domain/labels";
import type { AccountStatus, Client, Driver, InvoiceStatus, PaymentStatus, Profile, VehicleStatus } from "@/lib/data/types";
import type { FleetUnit } from "@/lib/data/views";
import { audit, db, notify, nowIso, ServiceError } from "@/lib/server/context";

async function staff(profileId: string) {
  const repo = await db();
  const profile = await repo.getProfile(profileId);
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin") || profile.accountStatus !== "active") {
    throw new ServiceError("Admin access is required.");
  }
  return { repo, profile };
}

export async function getDashboard(profileId: string) {
  const { repo } = await staff(profileId);
  const vehicles = await repo.listVehicles();
  const drivers = await repo.listDrivers();
  const payments = await repo.listPayments();
  const trips = await repo.listTrips();
  const count = (status: VehicleStatus) => vehicles.filter((item) => item.status === status).length;
  return {
    total: vehicles.length,
    inTransit: count("in_transit"),
    checkpoint: count("at_checkpoint"),
    delivered: count("delivered"),
    activeDrivers: drivers.filter((item) => item.accountStatus === "active" && item.appAccess).length,
    onTrip: (await repo.listAssignments()).filter((item) => item.active).length,
    pendingPayments: payments.filter((item) => item.status === "pending" || item.status === "awaiting_verification").reduce((sum, item) => sum + item.amount, 0),
    pendingCount: payments.filter((item) => item.status !== "paid" && item.status !== "cancelled").length,
    upcoming: trips.filter((item) => item.status === "assigned").length,
    alerts: vehicles.filter((item) => item.status === "delayed").length + payments.filter((item) => item.status === "awaiting_verification").length,
    activity: (await repo.listActivity()).slice(0, 6),
    vehicles,
  };
}

export async function getFleet(profileId: string): Promise<FleetUnit[]> {
  const { repo } = await staff(profileId);
  const locations = await repo.latestFleetLocations();
  const units: FleetUnit[] = [];
  for (const location of locations) {
    const trip = await repo.getTrip(location.tripId);
    const vehicle = trip ? await repo.getVehicle(trip.vehicleId) : null;
    const driver = await repo.getDriver(location.driverId);
    if (!trip || !vehicle || !driver) continue;
    if (!["in_transit", "at_checkpoint", "delayed", "collected"].includes(vehicle.status) && trip.status !== "in_transit") continue;
    const age = Date.now() - new Date(location.recordedAt).getTime();
    units.push({
      tripId: trip.id,
      vehicleId: vehicle.id,
      title: `${vehicle.make} ${vehicle.model}`,
      registration: vehicle.registration,
      imageUrl: vehicle.imageUrl,
      driverName: driver.fullName,
      status: vehicle.status,
      statusLabel: vehicleLabel(vehicle.status),
      destination: trip.destination,
      latitude: location.latitude,
      longitude: location.longitude,
      speedKmh: location.speedKmh,
      updatedLabel: formatDateTime(location.recordedAt),
      delayed: vehicle.status === "delayed" || age > 60 * 60 * 1000,
      atCheckpoint: vehicle.status === "at_checkpoint",
    });
  }
  return units;
}

export async function listAdminVehicles(profileId: string) {
  const { repo } = await staff(profileId);
  const vehicles = await repo.listVehicles();
  const clients = await repo.listClients();
  return vehicles.map((vehicle) => ({
    ...vehicle,
    ownerName: clients.find((client) => client.id === vehicle.ownerId)?.fullName ?? "Unassigned",
    statusLabel: vehicleLabel(vehicle.status),
  }));
}

export async function getAdminVehicle(profileId: string, vehicleId: string) {
  const { repo } = await staff(profileId);
  const vehicle = await repo.getVehicle(vehicleId);
  if (!vehicle) throw new ServiceError("Vehicle not found.");
  const client = await repo.getClient(vehicle.ownerId);
  const trips = (await repo.listTrips()).filter((trip) => trip.vehicleId === vehicle.id);
  const trip = trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const assignment = trip ? (await repo.listAssignments()).find((item) => item.tripId === trip.id && item.active) : null;
  const driver = assignment ? await repo.getDriver(assignment.driverId) : null;
  const reached = trip ? await repo.listReached(trip.id) : [];
  const checkpoints = await repo.listCheckpoints();
  const handovers = trip ? await repo.listHandovers(trip.id) : [];
  const location = trip ? await repo.latestLocation(trip.id) : null;
  return {
    vehicle,
    ownerName: client?.fullName ?? "Unassigned",
    statusLabel: vehicleLabel(vehicle.status),
    trip: trip ? { ...trip, statusLabel: tripLabel(trip.status) } : null,
    driverName: driver?.fullName ?? null,
    driverPhone: driver?.phone ?? null,
    milestones: reached.map((item) => {
      const checkpoint = checkpoints.find((point) => point.id === item.checkpointId);
      return { id: item.id, name: checkpoint?.name ?? "Checkpoint", place: checkpoint ? `${checkpoint.city}, ${checkpoint.country}` : "", at: formatDateTime(item.reachedAt) };
    }),
    handovers: await Promise.all(handovers.map(async (item) => ({
      id: item.id,
      from: (await repo.getDriver(item.fromDriverId))?.fullName ?? "Driver",
      to: item.toDriverId ? (await repo.getDriver(item.toDriverId))?.fullName ?? "Driver" : "Pending",
      status: item.status,
      when: formatDateTime(item.acceptedAt ?? item.createdAt),
    }))),
    location,
    photos: trip ? await repo.listPhotos(trip.id) : [],
  };
}

export async function saveVehicle(profileId: string, input: {
  id?: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registration: string;
  vin: string;
  engineNumber: string;
  origin: string;
  destination: string;
  shippingReference: string;
  insuranceStatus: "insured" | "not_insured";
  insuranceProvider: string;
  insuranceExpiry: string;
  status: VehicleStatus;
}) {
  const { repo, profile } = await staff(profileId);
  if (!input.make || !input.model || !input.registration) throw new ServiceError("Make, model and registration are required.");
  const existing = input.id ? await repo.getVehicle(input.id) : null;
  const vehicle = {
    id: existing?.id ?? crypto.randomUUID(),
    ownerId: input.ownerId,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    colour: input.colour || "White",
    registration: input.registration.trim().toUpperCase(),
    referenceNumber: existing?.referenceNumber ?? (input.shippingReference || `RMS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`),
    vin: input.vin || existing?.vin || "UNSET",
    engineNumber: input.engineNumber || existing?.engineNumber || "UNSET",
    insuranceStatus: input.insuranceStatus,
    insuranceProvider: input.insuranceProvider || null,
    insuranceExpiry: input.insuranceExpiry || null,
    origin: input.origin,
    destination: input.destination,
    expectedDeparture: existing?.expectedDeparture ?? null,
    estimatedArrival: existing?.estimatedArrival ?? null,
    shippingReference: input.shippingReference || existing?.shippingReference || null,
    status: input.status,
    imageUrl: existing?.imageUrl ?? "/vehicles/suv-white.svg",
    notes: existing?.notes ?? null,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  await repo.saveVehicle(vehicle);
  await audit(repo, profile, existing ? "vehicle_updated" : "vehicle_created", "vehicle", vehicle.id, `${existing ? "Updated" : "Registered"} ${vehicle.registration}.`);
  return vehicle.id;
}

export async function listPeople(profileId: string) {
  const { repo } = await staff(profileId);
  return { drivers: await repo.listDrivers(), clients: await repo.listClients(), vehicles: await repo.listVehicles() };
}

export async function createClientAccount(profileId: string, input: { fullName: string; phone: string; email: string; address: string; appAccess: boolean }) {
  const { repo, profile } = await staff(profileId);
  const phone = normalizePhone(input.phone);
  if (!input.fullName.trim() || phone.length < 10) throw new ServiceError("Name and a valid phone number are required.");
  if ((await repo.listClients()).some((item) => normalizePhone(item.phone) === phone)) throw new ServiceError("A client with that phone already exists.");
  const clientId = crypto.randomUUID();
  let pin: string | null = null;
  let clientProfileId: string | null = null;
  if (input.appAccess) {
    pin = randomPin();
    clientProfileId = crypto.randomUUID();
    await repo.saveProfile({
      id: clientProfileId,
      role: "client",
      fullName: input.fullName.trim(),
      phone,
      email: input.email || null,
      avatarUrl: null,
      accountStatus: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await repo.saveCredential({ profileId: clientProfileId, phone, pinHash: hashSecret(pin), failedAttempts: 0, lockedUntil: null });
  }
  await repo.saveClient({
    id: clientId,
    profileId: clientProfileId,
    fullName: input.fullName.trim(),
    phone,
    email: input.email || null,
    company: null,
    address: input.address || null,
    accountStatus: input.appAccess ? "active" : "pending",
    appAccess: input.appAccess,
    chatOverride: "auto",
    createdAt: nowIso(),
  });
  await audit(repo, profile, "client_created", "client", clientId, `Created client ${input.fullName.trim()}.`);
  return { id: clientId, pin };
}

export async function setAccess(profileId: string, kind: "client" | "driver", id: string, status: AccountStatus) {
  const { repo, profile } = await staff(profileId);
  if (kind === "client") {
    const client = await repo.getClient(id);
    if (!client) throw new ServiceError("Client not found.");
    client.accountStatus = status;
    client.appAccess = status === "active";
    await repo.saveClient(client);
    if (client.profileId) await setProfileStatus(repo, client.profileId, status);
  } else {
    const driver = await repo.getDriver(id);
    if (!driver) throw new ServiceError("Driver not found.");
    driver.accountStatus = status;
    driver.appAccess = status === "active";
    await repo.saveDriver(driver);
    if (driver.profileId) await setProfileStatus(repo, driver.profileId, status);
  }
  await audit(repo, profile, "access_changed", kind, id, `Set ${kind} access to ${status}.`);
}

async function setProfileStatus(repo: Awaited<ReturnType<typeof db>>, id: string, status: AccountStatus) {
  const profile = await repo.getProfile(id);
  if (!profile) return;
  profile.accountStatus = status;
  profile.updatedAt = nowIso();
  await repo.saveProfile(profile);
}

export async function issuePin(profileId: string, kind: "client" | "driver", id: string) {
  const { repo, profile } = await staff(profileId);
  const person = kind === "client" ? await repo.getClient(id) : await repo.getDriver(id);
  if (!person) throw new ServiceError("Record not found.");
  const phone = normalizePhone(person.phone);
  const pin = randomPin();
  let linked = person.profileId;
  if (!linked) {
    linked = crypto.randomUUID();
    await repo.saveProfile({
      id: linked,
      role: kind,
      fullName: person.fullName,
      phone,
      email: person.email,
      avatarUrl: null,
      accountStatus: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    person.profileId = linked;
  }
  await setProfileStatus(repo, linked, "active");
  const existing = await repo.findCredential(phone);
  if (existing && existing.profileId !== linked) throw new ServiceError("That phone number belongs to another account.");
  await repo.saveCredential({ profileId: linked, phone, pinHash: hashSecret(pin), failedAttempts: 0, lockedUntil: null });
  if (kind === "client") {
    const client = person as Client;
    client.profileId = linked;
    client.appAccess = true;
    client.accountStatus = "active";
    await repo.saveClient(client);
  } else {
    const driver = person as Driver;
    driver.profileId = linked;
    driver.appAccess = true;
    driver.accountStatus = "active";
    await repo.saveDriver(driver);
  }
  await audit(repo, profile, "pin_reset", kind, id, `Issued a new PIN for ${person.fullName}.`);
  return pin;
}

export async function createDriverAccount(profileId: string, input: { fullName: string; phone: string; licenceNumber: string; nationalId: string }) {
  const { repo, profile } = await staff(profileId);
  const phone = normalizePhone(input.phone);
  if (!input.fullName.trim() || phone.length < 10) throw new ServiceError("Name and phone are required.");
  const pin = randomPin();
  const driverProfileId = crypto.randomUUID();
  const driverId = crypto.randomUUID();
  const count = (await repo.listDrivers()).length + 1001;
  await repo.saveProfile({
    id: driverProfileId, role: "driver", fullName: input.fullName.trim(), phone, email: null, avatarUrl: null, accountStatus: "active", createdAt: nowIso(), updatedAt: nowIso(),
  });
  await repo.saveCredential({ profileId: driverProfileId, phone, pinHash: hashSecret(pin), failedAttempts: 0, lockedUntil: null });
  await repo.saveDriver({
    id: driverId,
    profileId: driverProfileId,
    fullName: input.fullName.trim(),
    phone,
    email: null,
    driverCode: `D-${count}`,
    licenceNumber: input.licenceNumber || "Pending",
    licenceExpiry: null,
    nationalId: input.nationalId || null,
    accountStatus: "active",
    appAccess: true,
    carsTransported: 0,
    distanceKm: 0,
    lastActiveAt: null,
    createdAt: nowIso(),
  });
  await audit(repo, profile, "driver_created", "driver", driverId, `Created driver ${input.fullName.trim()}.`);
  return { id: driverId, pin, code: `D-${count}` };
}

export async function createTrip(profileId: string, input: { vehicleId: string; driverId: string; origin: string; destination: string; eta: string; distanceKm: number }) {
  const { repo, profile } = await staff(profileId);
  const vehicle = await repo.getVehicle(input.vehicleId);
  const driver = await repo.getDriver(input.driverId);
  if (!vehicle || !driver) throw new ServiceError("Choose a vehicle and a driver.");
  const checkpoints = await repo.listCheckpoints();
  const tripId = crypto.randomUUID();
  await repo.saveTrip({
    id: tripId,
    vehicleId: vehicle.id,
    origin: input.origin || vehicle.origin,
    destination: input.destination || vehicle.destination,
    originLat: checkpoints[0]?.latitude ?? 0,
    originLng: checkpoints[0]?.longitude ?? 0,
    destinationLat: checkpoints.at(-1)?.latitude ?? 0,
    destinationLng: checkpoints.at(-1)?.longitude ?? 0,
    pickupAt: nowIso(),
    eta: input.eta || new Date(Date.now() + 3 * 86400000).toISOString(),
    status: "assigned",
    distanceKm: input.distanceKm || 0,
    shippingReference: vehicle.shippingReference || vehicle.referenceNumber,
    checkpointIds: checkpoints.filter((item) => item.sortOrder <= 6).map((item) => item.id),
    notes: null,
    arrivedAt: null,
    arrivedLat: null,
    arrivedLng: null,
    startedAt: null,
    startedLat: null,
    startedLng: null,
    completedAt: null,
    completedLat: null,
    completedLng: null,
    createdAt: nowIso(),
  });
  await repo.saveAssignment({ id: crypto.randomUUID(), tripId, driverId: driver.id, assignedAt: nowIso(), unassignedAt: null, active: true });
  vehicle.status = "assigned";
  await repo.saveVehicle(vehicle);
  await audit(repo, profile, "trip_assigned", "trip", tripId, `Assigned ${driver.fullName} to ${vehicle.registration}.`);
  if (driver.profileId) await notify(repo, driver.profileId, "New trip assigned", `${vehicle.make} ${vehicle.model} · ${vehicle.registration}`, `/driver/trips/${tripId}`);
  return tripId;
}

export async function listTrips(profileId: string) {
  const { repo } = await staff(profileId);
  const trips = await repo.listTrips();
  const vehicles = await repo.listVehicles();
  const assignments = await repo.listAssignments();
  const drivers = await repo.listDrivers();
  return trips.map((trip) => {
    const vehicle = vehicles.find((item) => item.id === trip.vehicleId);
    const assignment = assignments.find((item) => item.tripId === trip.id && item.active);
    const driver = drivers.find((item) => item.id === assignment?.driverId);
    return {
      ...trip,
      vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle",
      registration: vehicle?.registration ?? "",
      driverName: driver?.fullName ?? "Unassigned",
      statusLabel: tripLabel(trip.status),
      pickupLabel: formatSchedule(trip.pickupAt),
    };
  });
}

export async function listShipments(profileId: string) {
  const rows = await listAdminVehicles(profileId);
  return rows.map((vehicle) => ({
    id: vehicle.id,
    vehicle: `${vehicle.make} ${vehicle.model}`,
    registration: vehicle.registration,
    client: vehicle.ownerName,
    origin: vehicle.origin,
    destination: vehicle.destination,
    reference: vehicle.shippingReference,
    departure: vehicle.expectedDeparture ? formatSchedule(vehicle.expectedDeparture) : "—",
    arrival: vehicle.estimatedArrival ? formatSchedule(vehicle.estimatedArrival) : "—",
    status: vehicle.status,
    statusLabel: vehicle.statusLabel,
  }));
}

export async function createInvoice(profileId: string, input: { clientId: string; vehicleId: string; description: string; amount: number; dueOn: string; notes: string }) {
  const { repo, profile } = await staff(profileId);
  if (!input.description || input.amount <= 0) throw new ServiceError("Add a description and amount.");
  const number = await repo.nextInvoiceNumber();
  const id = crypto.randomUUID();
  await repo.saveInvoice({
    id,
    number,
    clientId: input.clientId,
    vehicleId: input.vehicleId,
    status: "pending",
    issuedOn: nowIso(),
    dueOn: input.dueOn || new Date(Date.now() + 7 * 86400000).toISOString(),
    notes: input.notes || null,
    items: [{ id: crypto.randomUUID(), description: input.description, quantity: 1, unitPrice: input.amount, total: input.amount }],
    createdAt: nowIso(),
  });
  await repo.savePayment({
    id: crypto.randomUUID(),
    clientId: input.clientId,
    vehicleId: input.vehicleId,
    invoiceId: id,
    kind: "transport_fee",
    description: input.description,
    amount: input.amount,
    status: "pending",
    method: null,
    reference: null,
    proofUrl: null,
    paidOn: null,
    createdAt: nowIso(),
  });
  const client = await repo.getClient(input.clientId);
  if (client?.profileId) await notify(repo, client.profileId, "Invoice issued", `${number} is ready in Payments.`, "/owner/payments");
  await audit(repo, profile, "invoice_created", "invoice", id, `Created ${number}.`);
  return id;
}

export async function listInvoices(profileId: string) {
  const { repo } = await staff(profileId);
  const invoices = await repo.listInvoices();
  const clients = await repo.listClients();
  const vehicles = await repo.listVehicles();
  return invoices.map((invoice) => ({
    ...invoice,
    clientName: clients.find((item) => item.id === invoice.clientId)?.fullName ?? "Client",
    vehicleName: vehicles.find((item) => item.id === invoice.vehicleId)?.registration ?? "",
    total: invoice.items.reduce((sum, item) => sum + item.total, 0),
  }));
}

export async function listFinance(profileId: string) {
  const { repo } = await staff(profileId);
  const payments = await repo.listPayments();
  const clients = await repo.listClients();
  const vehicles = await repo.listVehicles();
  const driverPayments = await repo.listDriverPayments();
  const drivers = await repo.listDrivers();
  return {
    clientPayments: payments.map((payment) => ({
      ...payment,
      clientName: clients.find((item) => item.id === payment.clientId)?.fullName ?? "Client",
      vehicleName: vehicles.find((item) => item.id === payment.vehicleId)?.registration ?? "",
    })),
    driverPayments: driverPayments.map((payment) => ({
      ...payment,
      driverName: drivers.find((item) => item.id === payment.driverId)?.fullName ?? "Driver",
    })),
  };
}

export async function verifyPayment(profileId: string, paymentId: string, approve: boolean) {
  const { repo, profile } = await staff(profileId);
  const payment = (await repo.listPayments()).find((item) => item.id === paymentId);
  if (!payment) throw new ServiceError("Payment not found.");
  payment.status = approve ? "paid" : "pending";
  payment.paidOn = approve ? nowIso() : null;
  await repo.savePayment(payment);
  if (approve) {
    const number = await repo.nextReceiptNumber();
    await repo.saveReceipt({
      id: crypto.randomUUID(),
      number,
      paymentId: payment.id,
      clientId: payment.clientId,
      vehicleId: payment.vehicleId,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      method: payment.method || "Bank transfer",
      reference: payment.reference || number,
      issuedOn: nowIso(),
    });
    if (payment.invoiceId) {
      const invoice = (await repo.listInvoices()).find((item) => item.id === payment.invoiceId);
      if (invoice) {
        const related = (await repo.listPayments()).filter((item) => item.invoiceId === invoice.id);
        const total = invoice.items.reduce((sum, item) => sum + item.total, 0);
        const paid = related.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
        invoice.status = paid >= total ? "paid" : "pending";
        await repo.saveInvoice(invoice);
      }
    }
    const client = await repo.getClient(payment.clientId);
    if (client?.profileId) await notify(repo, client.profileId, "Payment confirmed", `Receipt ${number} is available.`, "/owner/payments");
  }
  await audit(repo, profile, approve ? "payment_verified" : "payment_rejected", "payment", payment.id, `${approve ? "Verified" : "Returned"} a client payment.`);
}

export async function addDriverPayment(profileId: string, input: { driverId: string; route: string; amount: number; status: "pending" | "approved" | "paid" }) {
  const { repo, profile } = await staff(profileId);
  if (input.amount <= 0) throw new ServiceError("Enter an amount.");
  const id = crypto.randomUUID();
  await repo.saveDriverPayment({
    id,
    driverId: input.driverId,
    tripId: null,
    vehicleId: null,
    route: input.route || "Trip payment",
    amount: input.amount,
    status: input.status,
    reference: `DP-${id.slice(0, 6).toUpperCase()}`,
    paidOn: input.status === "paid" ? nowIso() : null,
    createdAt: nowIso(),
  });
  const driver = await repo.getDriver(input.driverId);
  if (driver?.profileId && input.status === "paid") {
    await notify(repo, driver.profileId, "Payment confirmed", `${input.route} has been marked paid.`, "/driver/payments");
  }
  await audit(repo, profile, "driver_payment", "driver_payment", id, `Recorded a driver payment for ${driver?.fullName ?? "driver"}.`);
}

export async function confirmCheckpoint(profileId: string, tripId: string, checkpointId: string) {
  const { repo, profile } = await staff(profileId);
  const trip = await repo.getTrip(tripId);
  const checkpoint = (await repo.listCheckpoints()).find((item) => item.id === checkpointId);
  if (!trip || !checkpoint) throw new ServiceError("Checkpoint not found.");
  const reached = await repo.listReached(trip.id);
  if (reached.some((item) => item.checkpointId === checkpoint.id)) return;
  await repo.saveReached({ id: crypto.randomUUID(), tripId: trip.id, vehicleId: trip.vehicleId, checkpointId: checkpoint.id, reachedAt: nowIso(), source: "admin" });
  const vehicle = await repo.getVehicle(trip.vehicleId);
  if (vehicle) {
    vehicle.status = "at_checkpoint";
    await repo.saveVehicle(vehicle);
    const client = await repo.getClient(vehicle.ownerId);
    if (client?.profileId) {
      await notify(repo, client.profileId, "Checkpoint reached", `Your vehicle entered ${checkpoint.city}, ${checkpoint.country}.`, `/owner/vehicle/${vehicle.id}/track`);
    }
  }
  await audit(repo, profile, "checkpoint_reached", "trip", trip.id, `Marked ${checkpoint.name} for ${vehicle?.registration ?? "vehicle"}.`);
}

export async function getReports(profileId: string) {
  const { repo } = await staff(profileId);
  const payments = await repo.listPayments();
  const trips = await repo.listTrips();
  const reached = await repo.listReached();
  const checkpoints = await repo.listCheckpoints();
  const byCountry = new Map<string, number>();
  for (const item of reached) {
    const country = checkpoints.find((checkpoint) => checkpoint.id === item.checkpointId)?.country ?? "Other";
    byCountry.set(country, (byCountry.get(country) ?? 0) + 180);
  }
  return {
    trips: trips.length,
    revenue: payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0),
    outstanding: payments.filter((item) => item.status !== "paid" && item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0),
    countries: [...byCountry.entries()].map(([country, km]) => ({ country, km })),
  };
}

export async function getSettings(profileId: string) {
  const { repo, profile } = await staff(profileId);
  return { settings: await repo.getSettings(), superAdmin: profile.role === "super_admin" };
}

export async function saveCompany(profileId: string, input: { supportPhone: string; supportEmail: string; paymentInstructions: string }) {
  const { repo, profile } = await staff(profileId);
  const settings = await repo.getSettings();
  settings.supportPhone = input.supportPhone;
  settings.supportEmail = input.supportEmail;
  settings.paymentInstructions = input.paymentInstructions;
  await repo.saveSettings(settings);
  await audit(repo, profile, "settings_updated", "settings", "company", "Updated company settings.");
}

export async function createStaffAccount(profileId: string, input: { fullName: string; email: string; password: string }) {
  const { repo, profile } = await staff(profileId);
  if (profile.role !== "super_admin") throw new ServiceError("Only a super admin can add administrators.");
  if (!input.email.includes("@") || input.password.length < 8) throw new ServiceError("Use a valid email and a password of at least 8 characters.");
  if (await repo.findAdmin(input.email)) throw new ServiceError("An administrator with that email already exists.");
  const id = crypto.randomUUID();
  await repo.saveProfile({
    id, role: "admin", fullName: input.fullName.trim() || "Administrator", phone: null, email: input.email.trim(), avatarUrl: null, accountStatus: "active", createdAt: nowIso(), updatedAt: nowIso(),
  });
  await repo.saveAdmin({ profileId: id, email: input.email.trim(), passwordHash: hashSecret(input.password) });
  await audit(repo, profile, "admin_created", "profile", id, `Created administrator ${input.email.trim()}.`);
}

export async function setChatOverride(profileId: string, clientId: string, override: "auto" | "open" | "closed") {
  const { repo, profile } = await staff(profileId);
  const client = await repo.getClient(clientId);
  if (!client) throw new ServiceError("Client not found.");
  client.chatOverride = override;
  await repo.saveClient(client);
  await audit(repo, profile, "chat_override", "client", client.id, `Set chat for ${client.fullName} to ${override}.`);
}

export type { InvoiceStatus, PaymentStatus, Profile };
