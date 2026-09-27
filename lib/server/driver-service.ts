import "server-only";
import { haversineMeters, shouldStoreLocation } from "@/lib/geo";
import { formatDate, formatKm, formatSchedule } from "@/lib/format";
import { tripLabel } from "@/lib/domain/labels";
import { tripProgress } from "@/lib/domain/journey";
import type { Assignment, Driver, Inspection, PhotoSlot, Profile, Repo, Trip, Vehicle } from "@/lib/data/types";
import type { DriverHome, DriverMoney, DriverTracking, TripDetail, TripSummary } from "@/lib/data/views";
import { audit, db, notify, nowIso, ServiceError } from "@/lib/server/context";

const REQUIRED_PHOTOS: PhotoSlot[] = ["front", "rear", "left", "right"];

async function world(repo: Repo) {
  const [vehicles, trips, assignments, drivers] = await Promise.all([
    repo.listVehicles(),
    repo.listTrips(),
    repo.listAssignments(),
    repo.listDrivers(),
  ]);
  return { vehicles, trips, assignments, drivers };
}

function activeAssignment(assignments: Assignment[], tripId: string) {
  return assignments.find((item) => item.tripId === tripId && item.active) ?? null;
}

function toSummary(trip: Trip, vehicle: Vehicle): TripSummary {
  return {
    id: trip.id,
    vehicleId: vehicle.id,
    title: `${vehicle.make} ${vehicle.model}`,
    colour: vehicle.colour,
    year: vehicle.year,
    registration: vehicle.registration,
    imageUrl: vehicle.imageUrl,
    pickup: trip.origin,
    dropoff: trip.destination,
    pickupLabel: formatSchedule(trip.pickupAt),
    distanceKm: trip.distanceKm,
    status: trip.status,
    statusLabel: tripLabel(trip.status),
  };
}

export async function driverForProfile(profileId: string) {
  const repo = await db();
  const driver = await repo.getDriverByProfile(profileId);
  if (!driver || !driver.appAccess || driver.accountStatus !== "active") {
    throw new ServiceError("Driver access is not active.");
  }
  return { repo, driver };
}

function tripsForDriver(driverId: string, data: Awaited<ReturnType<typeof world>>) {
  return data.assignments
    .filter((item) => item.driverId === driverId)
    .map((item) => data.trips.find((trip) => trip.id === item.tripId))
    .filter((trip): trip is Trip => Boolean(trip))
    .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
}

export async function getDriverHome(profileId: string): Promise<DriverHome> {
  const { repo, driver } = await driverForProfile(profileId);
  const data = await world(repo);
  const mine = tripsForDriver(driver.id, data).filter((trip) => trip.status !== "cancelled" && trip.status !== "delivered");
  const current = mine.find((trip) => ["arrived_pickup", "inspected", "collected", "in_transit", "destination_reached"].includes(trip.status))
    ?? mine.find((trip) => trip.status === "assigned")
    ?? null;
  const next = mine.find((trip) => trip.id !== current?.id && trip.status === "assigned") ?? null;
  const notes = await repo.listNotifications(profileId);
  const card = (trip: Trip | null) => {
    if (!trip) return null;
    const vehicle = data.vehicles.find((item) => item.id === trip.vehicleId);
    return vehicle ? toSummary(trip, vehicle) : null;
  };
  return {
    name: driver.fullName,
    driverCode: driver.driverCode,
    unread: notes.filter((item) => !item.read).length,
    current: card(current),
    next: card(next),
  };
}

export async function listDriverTrips(profileId: string) {
  const { repo, driver } = await driverForProfile(profileId);
  const data = await world(repo);
  return tripsForDriver(driver.id, data)
    .map((trip) => {
      const vehicle = data.vehicles.find((item) => item.id === trip.vehicleId);
      return vehicle ? toSummary(trip, vehicle) : null;
    })
    .filter((item): item is TripSummary => Boolean(item))
    .reverse();
}

async function ownTrip(profileId: string, tripId: string) {
  const { repo, driver } = await driverForProfile(profileId);
  const trip = await repo.getTrip(tripId);
  if (!trip) throw new ServiceError("Trip not found.");
  const assignments = await repo.listAssignments();
  const mine = assignments.find((item) => item.tripId === tripId && item.driverId === driver.id && item.active);
  if (!mine) throw new ServiceError("This trip is not assigned to you.");
  const vehicle = await repo.getVehicle(trip.vehicleId);
  if (!vehicle) throw new ServiceError("Vehicle not found.");
  return { repo, driver, trip, vehicle };
}

export async function getTripDetail(profileId: string, tripId: string): Promise<TripDetail> {
  const { repo, trip, vehicle } = await ownTrip(profileId, tripId);
  const photos = await repo.listPhotos(trip.id);
  const inspection = await repo.getInspection(trip.id);
  const summary = toSummary(trip, vehicle);
  return {
    ...summary,
    reference: vehicle.referenceNumber,
    etaLabel: formatSchedule(trip.eta),
    steps: tripProgress(trip.status),
    photos: photos.map((photo) => ({ id: photo.id, slot: photo.slot, url: photo.url })),
    inspected: Boolean(inspection),
    canArrive: trip.status === "assigned",
    canInspect: trip.status === "arrived_pickup" || trip.status === "inspected",
    canStart: trip.status === "collected",
    canTrack: trip.status === "in_transit" || trip.status === "destination_reached",
    canHandover: trip.status === "in_transit",
    canFinish: trip.status === "in_transit" || trip.status === "destination_reached",
  };
}

export async function getDriverTracking(profileId: string, tripId: string): Promise<DriverTracking> {
  const { repo, trip, vehicle } = await ownTrip(profileId, tripId);
  const checkpoints = await repo.listCheckpoints();
  const location = await repo.latestLocation(trip.id);
  const route = trip.checkpointIds
    .map((id) => checkpoints.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({ latitude: item.latitude, longitude: item.longitude, label: item.name }));
  return {
    tripId: trip.id,
    title: `${vehicle.make} ${vehicle.model}`,
    registration: vehicle.registration,
    imageUrl: vehicle.imageUrl,
    pickup: trip.origin,
    dropoff: trip.destination,
    status: trip.status,
    statusLabel: tripLabel(trip.status),
    distanceKm: trip.distanceKm,
    startedAt: trip.startedAt,
    speedKmh: location?.speedKmh ?? null,
    route,
    position: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    pickupPoint: { latitude: trip.originLat, longitude: trip.originLng, label: trip.origin },
    destinationPoint: { latitude: trip.destinationLat, longitude: trip.destinationLng, label: trip.destination },
  };
}

export async function arriveAtPickup(profileId: string, tripId: string, coords: { latitude: number; longitude: number } | null) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status !== "assigned" && trip.status !== "arrived_pickup") {
    throw new ServiceError("Arrival is already recorded.");
  }
  if (trip.status === "assigned") {
    trip.status = "arrived_pickup";
    trip.arrivedAt = nowIso();
    trip.arrivedLat = coords?.latitude ?? null;
    trip.arrivedLng = coords?.longitude ?? null;
    await repo.saveTrip(trip);
    vehicle.status = "assigned";
    await repo.saveVehicle(vehicle);
    driver.lastActiveAt = nowIso();
    await repo.saveDriver(driver);
    await audit(repo, await actor(repo, profileId), "driver_arrived", "trip", trip.id, `${driver.fullName} arrived for ${vehicle.registration}.`);
  }
}

export async function saveTripPhoto(profileId: string, tripId: string, slot: PhotoSlot, url: string) {
  const { repo, trip } = await ownTrip(profileId, tripId);
  if (!["arrived_pickup", "inspected", "collected"].includes(trip.status)) {
    throw new ServiceError("Photos can be added after you arrive at pickup.");
  }
  await repo.savePhoto({ id: crypto.randomUUID(), tripId, slot, url, createdAt: nowIso() });
}

export async function submitInspection(profileId: string, tripId: string, input: Omit<Inspection, "tripId" | "completedAt">) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status !== "arrived_pickup" && trip.status !== "inspected") {
    throw new ServiceError("Inspection is not available for this trip.");
  }
  const photos = await repo.listPhotos(trip.id);
  const slots = new Set(photos.map((photo) => photo.slot));
  const missing = REQUIRED_PHOTOS.filter((slot) => !slots.has(slot));
  if (missing.length) throw new ServiceError(`Add photos first: ${missing.join(", ")}.`);
  await repo.saveInspection({ ...input, tripId, completedAt: nowIso() });
  trip.status = "collected";
  vehicle.status = "collected";
  await repo.saveTrip(trip);
  await repo.saveVehicle(vehicle);
  await audit(repo, await actor(repo, profileId), "vehicle_collected", "vehicle", vehicle.id, `${driver.fullName} collected ${vehicle.registration}.`);
  const client = await repo.getClient(vehicle.ownerId);
  if (client?.profileId) {
    await notify(repo, client.profileId, "Vehicle collected", `${vehicle.make} ${vehicle.model} has been collected.`, `/owner/vehicle/${vehicle.id}`);
  }
}

export async function startTrip(profileId: string, tripId: string, coords: { latitude: number; longitude: number } | null) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status === "in_transit") return;
  if (trip.status !== "collected") throw new ServiceError("Complete pickup and inspection before starting.");
  trip.status = "in_transit";
  trip.startedAt = nowIso();
  trip.startedLat = coords?.latitude ?? null;
  trip.startedLng = coords?.longitude ?? null;
  vehicle.status = "in_transit";
  driver.lastActiveAt = nowIso();
  await repo.saveTrip(trip);
  await repo.saveVehicle(vehicle);
  await repo.saveDriver(driver);
  if (coords) {
    await repo.saveLocation({
      id: crypto.randomUUID(),
      tripId,
      driverId: driver.id,
      vehicleId: vehicle.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: null,
      heading: null,
      speedKmh: 0,
      recordedAt: nowIso(),
    });
  }
  await audit(repo, await actor(repo, profileId), "trip_started", "trip", trip.id, `${vehicle.registration} is in transit with ${driver.fullName}.`);
  const admins = await profilesByRole(repo, ["admin", "super_admin"]);
  for (const admin of admins) {
    await notify(repo, admin.id, "Trip started", `${vehicle.registration} left ${trip.origin}.`, "/admin/live");
  }
}

export async function finishTrip(profileId: string, tripId: string, coords: { latitude: number; longitude: number } | null) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status === "delivered") return;
  if (trip.status !== "in_transit" && trip.status !== "destination_reached") {
    throw new ServiceError("Start the trip before completing it.");
  }
  trip.status = "delivered";
  trip.completedAt = nowIso();
  trip.completedLat = coords?.latitude ?? null;
  trip.completedLng = coords?.longitude ?? null;
  vehicle.status = "delivered";
  driver.carsTransported += 1;
  driver.lastActiveAt = nowIso();
  await repo.saveTrip(trip);
  await repo.saveVehicle(vehicle);
  await repo.saveDriver(driver);
  const assignment = activeAssignment(await repo.listAssignments(), trip.id);
  if (assignment) {
    assignment.active = false;
    assignment.unassignedAt = nowIso();
    await repo.saveAssignment(assignment);
  }
  await audit(repo, await actor(repo, profileId), "vehicle_delivered", "vehicle", vehicle.id, `${vehicle.registration} was delivered.`);
  const client = await repo.getClient(vehicle.ownerId);
  if (client?.profileId) {
    await notify(repo, client.profileId, "Vehicle delivered", `${vehicle.make} ${vehicle.model} has been delivered.`, `/owner/vehicle/${vehicle.id}`);
  }
}

export async function recordLocation(
  profileId: string,
  tripId: string,
  reading: { latitude: number; longitude: number; accuracy: number | null; heading: number | null; speedKmh: number | null },
) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status !== "in_transit" && trip.status !== "destination_reached") return { saved: false, milestone: null as string | null };
  const previous = await repo.latestLocation(trip.id);
  const recordedAt = nowIso();
  if (!shouldStoreLocation(previous, { ...reading, recordedAt })) return { saved: false, milestone: null };
  await repo.saveLocation({
    id: crypto.randomUUID(),
    tripId,
    driverId: driver.id,
    vehicleId: vehicle.id,
    latitude: reading.latitude,
    longitude: reading.longitude,
    accuracy: reading.accuracy,
    heading: reading.heading,
    speedKmh: reading.speedKmh,
    recordedAt,
  });
  if (previous) {
    driver.distanceKm += haversineMeters(previous, reading) / 1000;
  }
  driver.lastActiveAt = recordedAt;
  const checkpoints = await repo.listCheckpoints();
  const reached = await repo.listReached(trip.id);
  const hit = checkpoints.find((checkpoint) => {
    if (!trip.checkpointIds.includes(checkpoint.id) || !checkpoint.active) return false;
    if (reached.some((item) => item.checkpointId === checkpoint.id)) return false;
    return haversineMeters(reading, { latitude: checkpoint.latitude, longitude: checkpoint.longitude }) <= checkpoint.radiusMeters;
  });
  let milestone: string | null = null;
  if (hit) {
    await repo.saveReached({
      id: crypto.randomUUID(),
      tripId: trip.id,
      vehicleId: vehicle.id,
      checkpointId: hit.id,
      reachedAt: recordedAt,
      source: "geofence",
    });
    vehicle.status = "at_checkpoint";
    milestone = `${hit.city}, ${hit.country}`;
    await audit(repo, await actor(repo, profileId), "checkpoint_reached", "vehicle", vehicle.id, `${vehicle.registration} entered ${hit.name}.`);
    const client = await repo.getClient(vehicle.ownerId);
    if (client?.profileId) {
      await notify(repo, client.profileId, "Checkpoint reached", `Your vehicle entered ${hit.city}, ${hit.country}.`, `/owner/vehicle/${vehicle.id}/track`);
    }
  } else if (vehicle.status === "at_checkpoint") {
    const inside = checkpoints.some((checkpoint) => haversineMeters(reading, checkpoint) <= checkpoint.radiusMeters);
    if (!inside) vehicle.status = "in_transit";
  }
  await repo.saveVehicle(vehicle);
  await repo.saveDriver(driver);
  return { saved: true, milestone };
}

export async function getDriverMoney(profileId: string): Promise<DriverMoney> {
  const { repo, driver } = await driverForProfile(profileId);
  const rows = (await repo.listDriverPayments(driver.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const received = rows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0);
  const pending = rows.filter((row) => row.status !== "paid").reduce((sum, row) => sum + row.amount, 0);
  return {
    earned: received + pending,
    received,
    pending,
    rows: rows.map((row) => ({
      id: row.id,
      route: row.route,
      amount: row.amount,
      status: row.status,
      reference: row.reference,
      dateLabel: formatDate(row.paidOn ?? row.createdAt),
    })),
  };
}

export async function getDriverProfile(profileId: string) {
  const { repo, driver } = await driverForProfile(profileId);
  const documents = await repo.listDocuments(driver.id);
  const handovers = (await repo.listHandovers()).filter((item) => item.fromDriverId === driver.id || item.toDriverId === driver.id);
  return {
    name: driver.fullName,
    code: driver.driverCode,
    phone: driver.phone,
    email: driver.email,
    status: driver.accountStatus,
    cars: driver.carsTransported,
    distance: formatKm(driver.distanceKm),
    licence: driver.licenceNumber,
    licenceExpiry: driver.licenceExpiry,
    nationalId: driver.nationalId,
    documents: documents.map((item) => ({ id: item.id, kind: item.kind, fileName: item.fileName })),
    handovers: await Promise.all(handovers.map(async (item) => {
      const vehicle = await repo.getVehicle(item.vehicleId);
      const from = await repo.getDriver(item.fromDriverId);
      const to = item.toDriverId ? await repo.getDriver(item.toDriverId) : null;
      return {
        id: item.id,
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : "Vehicle",
        from: from?.fullName ?? "Driver",
        to: to?.fullName ?? "Pending",
        status: item.status,
        when: formatDate(item.acceptedAt ?? item.createdAt),
      };
    })),
  };
}

export async function openHandover(profileId: string, tripId: string) {
  const { repo, driver, trip, vehicle } = await ownTrip(profileId, tripId);
  if (trip.status !== "in_transit") throw new ServiceError("Handover is available once the trip is in transit.");
  const existing = (await repo.listHandovers(trip.id)).find((item) => item.status === "pending" && new Date(item.expiresAt).getTime() > Date.now());
  if (existing) return { code: existing.code, token: existing.token, vehicle: `${vehicle.make} ${vehicle.model}`, registration: vehicle.registration, destination: trip.destination };
  const token = crypto.randomUUID().replaceAll("-", "");
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  await repo.saveHandover({
    id: crypto.randomUUID(),
    tripId: trip.id,
    vehicleId: vehicle.id,
    fromDriverId: driver.id,
    toDriverId: null,
    token,
    code,
    status: "pending",
    expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    latitude: null,
    longitude: null,
    notes: null,
    createdAt: nowIso(),
    acceptedAt: null,
  });
  return { code, token, vehicle: `${vehicle.make} ${vehicle.model}`, registration: vehicle.registration, destination: trip.destination };
}

export async function acceptHandover(profileId: string, tokenOrCode: string, coords: { latitude: number; longitude: number } | null) {
  const { repo, driver } = await driverForProfile(profileId);
  const handover = await repo.findHandover(tokenOrCode);
  if (!handover || handover.status !== "pending") throw new ServiceError("Handover code was not found.");
  if (new Date(handover.expiresAt).getTime() < Date.now()) {
    handover.status = "expired";
    await repo.saveHandover(handover);
    throw new ServiceError("This handover code has expired.");
  }
  if (handover.fromDriverId === driver.id) throw new ServiceError("Another driver must accept this vehicle.");
  const trip = await repo.getTrip(handover.tripId);
  const vehicle = trip ? await repo.getVehicle(trip.vehicleId) : null;
  if (!trip || !vehicle || trip.status !== "in_transit") throw new ServiceError("This trip is not available for handover.");
  const assignments = await repo.listAssignments();
  const current = assignments.find((item) => item.tripId === trip.id && item.active);
  if (current) {
    current.active = false;
    current.unassignedAt = nowIso();
    await repo.saveAssignment(current);
  }
  await repo.saveAssignment({
    id: crypto.randomUUID(),
    tripId: trip.id,
    driverId: driver.id,
    assignedAt: nowIso(),
    unassignedAt: null,
    active: true,
  });
  handover.toDriverId = driver.id;
  handover.status = "accepted";
  handover.acceptedAt = nowIso();
  handover.latitude = coords?.latitude ?? null;
  handover.longitude = coords?.longitude ?? null;
  await repo.saveHandover(handover);
  const from = await repo.getDriver(handover.fromDriverId);
  await audit(repo, await actor(repo, profileId), "vehicle_handed_over", "vehicle", vehicle.id, `${vehicle.registration} handed from ${from?.fullName ?? "driver"} to ${driver.fullName}.`);
  const admins = await profilesByRole(repo, ["admin", "super_admin"]);
  for (const admin of admins) {
    await notify(repo, admin.id, "Vehicle handover", `${vehicle.registration} is now with ${driver.fullName}.`, `/admin/vehicles/${vehicle.id}`);
  }
  return { tripId: trip.id, registration: vehicle.registration, destination: trip.destination };
}

export async function listNotifications(profileId: string) {
  const repo = await db();
  return repo.listNotifications(profileId);
}

export async function markNotificationsRead(profileId: string) {
  const repo = await db();
  const items = await repo.listNotifications(profileId);
  for (const item of items) {
    if (!item.read) {
      item.read = true;
      await repo.saveNotification(item);
    }
  }
}

async function actor(repo: Repo, profileId: string): Promise<Profile | null> {
  return repo.getProfile(profileId);
}

async function profilesByRole(repo: Repo, roles: Profile["role"][]) {
  return (await repo.listProfiles()).filter((profile) => roles.includes(profile.role) && profile.accountStatus === "active");
}

export type { Driver };
