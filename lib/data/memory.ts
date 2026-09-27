import "server-only";
import { hashSecret, randomPin } from "@/lib/auth/pin";
import { ids, routeIds } from "@/lib/data/ids";
import type {
  Activity,
  AdminSecret,
  AppNotification,
  Assignment,
  AuthAttempt,
  Checkpoint,
  Client,
  CompanySettings,
  Conversation,
  Credential,
  Driver,
  DriverDocument,
  DriverPayment,
  Handover,
  Inspection,
  Invoice,
  Message,
  Payment,
  Profile,
  Receipt,
  Repo,
  Trip,
  TripCheckpoint,
  TripLocation,
  TripPhoto,
  Vehicle,
} from "@/lib/data/types";

const SEED_VERSION = 1;

function harareIso(offsetDays: number, hour: number, minute = 0) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays, hour - 2, minute, 0)).toISOString();
}

function stamp(profile: Omit<Profile, "createdAt" | "updatedAt">): Profile {
  return { ...profile, createdAt: harareIso(-120, 9), updatedAt: harareIso(-1, 9) };
}

export class MemoryRepo implements Repo {
  version = SEED_VERSION;
  profiles: Profile[] = [];
  credentials: Credential[] = [];
  admins: AdminSecret[] = [];
  attempts: AuthAttempt[] = [];
  drivers: Driver[] = [];
  clients: Client[] = [];
  vehicles: Vehicle[] = [];
  trips: Trip[] = [];
  assignments: Assignment[] = [];
  photos: TripPhoto[] = [];
  inspections: Inspection[] = [];
  locations: TripLocation[] = [];
  checkpoints: Checkpoint[] = [];
  reached: TripCheckpoint[] = [];
  handovers: Handover[] = [];
  documents: DriverDocument[] = [];
  invoices: Invoice[] = [];
  payments: Payment[] = [];
  receipts: Receipt[] = [];
  driverPayments: DriverPayment[] = [];
  conversations: Conversation[] = [];
  messages: Message[] = [];
  notifications: AppNotification[] = [];
  activity: Activity[] = [];
  settings: CompanySettings = {
    companyName: "Reliance Mobility Solutions",
    tagline: "Driving Possibilities. Delivering Trust.",
    supportPhone: "+263 77 200 0000",
    supportEmail: "operations@reliancemobility.co.zw",
    paymentInstructions:
      "Bank: CBZ Bank\nAccount name: Reliance Mobility Solutions\nAccount number: 0123456789012\nBranch: Borrowdale\nReference: your invoice number",
  };
  private invoiceSeq = 2;
  private receiptSeq = 2;

  constructor() {
    this.seed();
  }

  private seed() {
    const pin = (profileId: string, phone: string): Credential => ({
      profileId,
      phone,
      pinHash: hashSecret(phone.endsWith("0101") ? "2580" : phone.endsWith("0202") ? "3691" : phone.endsWith("0303") ? "1470" : randomPin()),
      failedAttempts: 0,
      lockedUntil: null,
    });

    this.profiles = [
      stamp({ id: ids.admin, role: "super_admin", fullName: "Admin", phone: null, email: "admin@reliancemobility.co.zw", avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.tapiwaProfile, role: "driver", fullName: "Tapiwa Moyo", phone: "+263771000101", email: "tapiwa@reliancemobility.co.zw", avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.tendaiProfile, role: "client", fullName: "Tendai Mafidi", phone: "+263771000202", email: "tendai@example.com", avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.rudoProfile, role: "client", fullName: "Rudo Ndlovu", phone: "+263771000303", email: "rudo@example.com", avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.kelvinProfile, role: "driver", fullName: "Kelvin Dube", phone: "+263772000201", email: null, avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.faraiProfile, role: "driver", fullName: "Farai Chiweshe", phone: "+263772000301", email: null, avatarUrl: null, accountStatus: "active" }),
      stamp({ id: ids.tinasheProfile, role: "driver", fullName: "Tinashe Ruzive", phone: "+263772000401", email: null, avatarUrl: null, accountStatus: "active" }),
    ];
    this.credentials = [
      pin(ids.tapiwaProfile, "+263771000101"),
      pin(ids.tendaiProfile, "+263771000202"),
      pin(ids.rudoProfile, "+263771000303"),
      pin(ids.kelvinProfile, "+263772000201"),
      pin(ids.faraiProfile, "+263772000301"),
      pin(ids.tinasheProfile, "+263772000401"),
    ];
    this.admins = [
      { profileId: ids.admin, email: "admin@reliancemobility.co.zw", passwordHash: hashSecret("Reliance#2026") },
    ];

    const driver = (partial: Omit<Driver, "createdAt" | "lastActiveAt"> & { lastActiveAt?: string | null }): Driver => ({
      ...partial,
      lastActiveAt: partial.lastActiveAt ?? harareIso(0, 8),
      createdAt: harareIso(-200, 9),
    });
    this.drivers = [
      driver({ id: ids.tapiwa, profileId: ids.tapiwaProfile, fullName: "Tapiwa Moyo", phone: "+263771000101", email: "tapiwa@reliancemobility.co.zw", driverCode: "D-1024", licenceNumber: "ZW-DL-449210", licenceExpiry: "2028-04-30", nationalId: "63-123456-A-12", accountStatus: "active", appAccess: true, carsTransported: 28, distanceKm: 3896 }),
      driver({ id: ids.kelvin, profileId: ids.kelvinProfile, fullName: "Kelvin Dube", phone: "+263772000201", email: null, driverCode: "D-1041", licenceNumber: "ZW-DL-552811", licenceExpiry: "2027-11-12", nationalId: "63-998121-B-42", accountStatus: "active", appAccess: true, carsTransported: 19, distanceKm: 6120 }),
      driver({ id: ids.farai, profileId: ids.faraiProfile, fullName: "Farai Chiweshe", phone: "+263772000301", email: null, driverCode: "D-1066", licenceNumber: "ZW-DL-330194", licenceExpiry: "2027-06-01", nationalId: "08-221098-C-19", accountStatus: "active", appAccess: true, carsTransported: 14, distanceKm: 2404 }),
      driver({ id: ids.tinashe, profileId: ids.tinasheProfile, fullName: "Tinashe Ruzive", phone: "+263772000401", email: null, driverCode: "D-1088", licenceNumber: "ZW-DL-118273", licenceExpiry: "2026-12-20", nationalId: "22-441902-D-07", accountStatus: "active", appAccess: true, carsTransported: 22, distanceKm: 5102 }),
    ];

    const client = (partial: Omit<Client, "createdAt">): Client => ({ ...partial, createdAt: harareIso(-90, 10) });
    this.clients = [
      client({ id: ids.tendai, profileId: ids.tendaiProfile, fullName: "Tendai Mafidi", phone: "+263771000202", email: "tendai@example.com", company: null, address: "Borrowdale, Harare", accountStatus: "active", appAccess: true, chatOverride: "auto" }),
      client({ id: ids.rudo, profileId: ids.rudoProfile, fullName: "Rudo Ndlovu", phone: "+263771000303", email: "rudo@example.com", company: "Ndlovu Family Trust", address: "Mount Pleasant, Harare", accountStatus: "active", appAccess: true, chatOverride: "auto" }),
      client({ id: ids.panashe, profileId: null, fullName: "Panashe Dube", phone: "+263773111222", email: "panashe@example.com", company: null, address: "Bulawayo", accountStatus: "pending", appAccess: false, chatOverride: "closed" }),
      client({ id: ids.nyasha, profileId: null, fullName: "Nyasha Chirwa", phone: "+263774333444", email: "nyasha@example.com", company: "Chirwa Logistics", address: "Gweru", accountStatus: "pending", appAccess: false, chatOverride: "auto" }),
    ];

    const vehicle = (partial: Omit<Vehicle, "createdAt">): Vehicle => ({ ...partial, createdAt: harareIso(-20, 11) });
    this.vehicles = [
      vehicle({ id: ids.lc, ownerId: ids.tendai, make: "Toyota", model: "Land Cruiser 300", year: 2024, colour: "White", registration: "AFR 2345", referenceNumber: "RMS-2026-0045", vin: "JTMHX05J400123456", engineNumber: "1VD-FTY-12345", insuranceStatus: "insured", insuranceProvider: "NicozDiamond", insuranceExpiry: "2027-03-15", origin: "Harare, Zimbabwe", destination: "Pretoria, South Africa", expectedDeparture: harareIso(0, 10), estimatedArrival: harareIso(3, 16), shippingReference: "RMS-2026-0045", status: "ready_for_collection", imageUrl: "/vehicles/suv-white.svg", notes: "Collect at Beitbridge border post." }),
      vehicle({ id: ids.bmw, ownerId: ids.rudo, make: "BMW", model: "X5", year: 2023, colour: "Black", registration: "BWR 7789", referenceNumber: "RMS-2026-0038", vin: "WBA12AB34CD567890", engineNumber: "B58-88921", insuranceStatus: "insured", insuranceProvider: "Old Mutual", insuranceExpiry: "2027-01-20", origin: "Harare, Zimbabwe", destination: "Pretoria, South Africa", expectedDeparture: harareIso(-2, 7), estimatedArrival: harareIso(1, 15), shippingReference: "RMS-2026-0038", status: "in_transit", imageUrl: "/vehicles/suv-dark.svg", notes: null }),
      vehicle({ id: ids.hilux, ownerId: ids.panashe, make: "Toyota", model: "Hilux Revo", year: 2022, colour: "Silver", registration: "HLX 3380", referenceNumber: "RMS-2026-0041", vin: "MR0HA3CD200441122", engineNumber: "2GD-44112", insuranceStatus: "not_insured", insuranceProvider: null, insuranceExpiry: null, origin: "Harare, Zimbabwe", destination: "Johannesburg, South Africa", expectedDeparture: harareIso(-1, 6), estimatedArrival: harareIso(2, 18), shippingReference: "RMS-2026-0041", status: "in_transit", imageUrl: "/vehicles/suv-dark.svg", notes: null }),
      vehicle({ id: ids.ranger, ownerId: ids.nyasha, make: "Ford", model: "Ranger", year: 2021, colour: "Blue", registration: "RRS 9001", referenceNumber: "RMS-2026-0033", vin: "MPBXXMXA1MX123456", engineNumber: "P5AT-22019", insuranceStatus: "insured", insuranceProvider: "First Mutual", insuranceExpiry: "2026-12-01", origin: "Bulawayo, Zimbabwe", destination: "Gaborone, Botswana", expectedDeparture: harareIso(-4, 8), estimatedArrival: harareIso(-1, 12), shippingReference: "RMS-2026-0033", status: "delayed", imageUrl: "/vehicles/suv-dark.svg", notes: "Holding for customs papers." }),
      vehicle({ id: ids.gle, ownerId: ids.panashe, make: "Mercedes-Benz", model: "GLE", year: 2022, colour: "White", registration: "MBZ 6677", referenceNumber: "RMS-2026-0029", vin: "W1N16712345678901", engineNumber: "M256-77821", insuranceStatus: "insured", insuranceProvider: "NicozDiamond", insuranceExpiry: "2026-11-02", origin: "Harare, Zimbabwe", destination: "Polokwane, South Africa", expectedDeparture: harareIso(-3, 9), estimatedArrival: harareIso(1, 11), shippingReference: "RMS-2026-0029", status: "at_checkpoint", imageUrl: "/vehicles/suv-white.svg", notes: null }),
      vehicle({ id: ids.prado, ownerId: ids.nyasha, make: "Toyota", model: "Prado", year: 2020, colour: "Pearl", registration: "PRD 4410", referenceNumber: "RMS-2026-0012", vin: "JTEBH3FJ20K123987", engineNumber: "1GR-33910", insuranceStatus: "insured", insuranceProvider: "Old Mutual", insuranceExpiry: "2026-10-10", origin: "Harare, Zimbabwe", destination: "Lusaka, Zambia", expectedDeparture: harareIso(-18, 8), estimatedArrival: harareIso(-14, 17), shippingReference: "RMS-2026-0012", status: "delivered", imageUrl: "/vehicles/suv-white.svg", notes: null }),
      vehicle({ id: ids.fortuner, ownerId: ids.rudo, make: "Toyota", model: "Fortuner", year: 2019, colour: "Grey", registration: "FTN 2201", referenceNumber: "RMS-2026-0008", vin: "MHFAB8FS9K0123456", engineNumber: "1GD-10028", insuranceStatus: "not_insured", insuranceProvider: null, insuranceExpiry: null, origin: "Harare, Zimbabwe", destination: "Bulawayo, Zimbabwe", expectedDeparture: harareIso(-40, 8), estimatedArrival: harareIso(-39, 16), shippingReference: "RMS-2026-0008", status: "delivered", imageUrl: "/vehicles/suv-dark.svg", notes: null }),
    ];

    const trip = (partial: Omit<Trip, "createdAt">): Trip => ({ ...partial, createdAt: harareIso(-5, 9) });
    this.trips = [
      trip({ id: ids.tripLc, vehicleId: ids.lc, origin: "Beitbridge Border Post", destination: "Pretoria, South Africa", originLat: -22.2167, originLng: 30, destinationLat: -25.7479, destinationLng: 28.2293, pickupAt: harareIso(0, 10), eta: harareIso(3, 16), status: "assigned", distanceKm: 820, shippingReference: "RMS-2026-0045", checkpointIds: routeIds, notes: "Keys with border agent.", arrivedAt: null, arrivedLat: null, arrivedLng: null, startedAt: null, startedLat: null, startedLng: null, completedAt: null, completedLat: null, completedLng: null }),
      trip({ id: ids.tripBmw, vehicleId: ids.bmw, origin: "Harare, Zimbabwe", destination: "Pretoria, South Africa", originLat: -17.8292, originLng: 31.0522, destinationLat: -25.7479, destinationLng: 28.2293, pickupAt: harareIso(-2, 7), eta: harareIso(1, 15), status: "in_transit", distanceKm: 820, shippingReference: "RMS-2026-0038", checkpointIds: routeIds, notes: null, arrivedAt: harareIso(-2, 6, 40), arrivedLat: -17.83, arrivedLng: 31.05, startedAt: harareIso(-2, 7, 10), startedLat: -17.83, startedLng: 31.05, completedAt: null, completedLat: null, completedLng: null }),
      trip({ id: ids.tripHilux, vehicleId: ids.hilux, origin: "Harare, Zimbabwe", destination: "Johannesburg, South Africa", originLat: -17.8292, originLng: 31.0522, destinationLat: -26.2041, destinationLng: 28.0473, pickupAt: harareIso(-1, 6), eta: harareIso(2, 18), status: "in_transit", distanceKm: 1100, shippingReference: "RMS-2026-0041", checkpointIds: [...routeIds, ids.johannesburg], notes: null, arrivedAt: harareIso(-1, 5, 50), arrivedLat: -17.82, arrivedLng: 31.04, startedAt: harareIso(-1, 6, 20), startedLat: -17.82, startedLng: 31.04, completedAt: null, completedLat: null, completedLng: null }),
      trip({ id: ids.tripRanger, vehicleId: ids.ranger, origin: "Bulawayo, Zimbabwe", destination: "Gaborone, Botswana", originLat: -20.15, originLng: 28.58, destinationLat: -24.6282, destinationLng: 25.9231, pickupAt: harareIso(-4, 8), eta: harareIso(-1, 12), status: "in_transit", distanceKm: 540, shippingReference: "RMS-2026-0033", checkpointIds: [ids.beitbridge], notes: "Delayed at the border.", arrivedAt: harareIso(-4, 8), arrivedLat: -20.15, arrivedLng: 28.58, startedAt: harareIso(-4, 9), startedLat: -20.15, startedLng: 28.58, completedAt: null, completedLat: null, completedLng: null }),
      trip({ id: ids.tripGle, vehicleId: ids.gle, origin: "Harare, Zimbabwe", destination: "Polokwane, South Africa", originLat: -17.8292, originLng: 31.0522, destinationLat: -23.9045, destinationLng: 29.4688, pickupAt: harareIso(-3, 9), eta: harareIso(1, 11), status: "in_transit", distanceKm: 760, shippingReference: "RMS-2026-0029", checkpointIds: routeIds.slice(0, 5), notes: null, arrivedAt: harareIso(-3, 8, 30), arrivedLat: -17.8, arrivedLng: 31.05, startedAt: harareIso(-3, 9, 15), startedLat: -17.8, startedLng: 31.05, completedAt: null, completedLat: null, completedLng: null }),
    ];

    this.assignments = [
      { id: "00000000-0000-4000-8000-000000000801", tripId: ids.tripLc, driverId: ids.tapiwa, assignedAt: harareIso(-1, 16), unassignedAt: null, active: true },
      { id: "00000000-0000-4000-8000-000000000802", tripId: ids.tripBmw, driverId: ids.kelvin, assignedAt: harareIso(-2, 6), unassignedAt: null, active: true },
      { id: "00000000-0000-4000-8000-000000000803", tripId: ids.tripHilux, driverId: ids.farai, assignedAt: harareIso(-1, 5), unassignedAt: null, active: true },
      { id: "00000000-0000-4000-8000-000000000804", tripId: ids.tripRanger, driverId: ids.tinashe, assignedAt: harareIso(-4, 7), unassignedAt: null, active: true },
      { id: "00000000-0000-4000-8000-000000000805", tripId: ids.tripGle, driverId: ids.kelvin, assignedAt: harareIso(-3, 8), unassignedAt: harareIso(-2, 18), active: false },
      { id: "00000000-0000-4000-8000-000000000806", tripId: ids.tripGle, driverId: ids.tinashe, assignedAt: harareIso(-2, 18), unassignedAt: null, active: true },
    ];

    const loc = (id: string, tripId: string, driverId: string, vehicleId: string, latitude: number, longitude: number, speed: number, minutesAgo: number): TripLocation => ({
      id, tripId, driverId, vehicleId, latitude, longitude, accuracy: 12, heading: 190, speedKmh: speed, recordedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    });
    this.locations = [
      loc("00000000-0000-4000-8000-000000000901", ids.tripBmw, ids.kelvin, ids.bmw, -22.351, 30.048, 72, 4),
      loc("00000000-0000-4000-8000-000000000902", ids.tripHilux, ids.farai, ids.hilux, -23.82, 29.51, 81, 6),
      loc("00000000-0000-4000-8000-000000000903", ids.tripRanger, ids.tinashe, ids.ranger, -21.72, 28.05, 0, 95),
      loc("00000000-0000-4000-8000-000000000904", ids.tripGle, ids.tinashe, ids.gle, -22.21, 29.99, 0, 18),
    ];

    this.checkpoints = [
      { id: ids.harare, name: "Harare", city: "Harare", country: "Zimbabwe", latitude: -17.8292, longitude: 31.0522, radiusMeters: 20000, active: true, sortOrder: 1 },
      { id: ids.masvingo, name: "Masvingo", city: "Masvingo", country: "Zimbabwe", latitude: -20.0744, longitude: 30.8328, radiusMeters: 15000, active: true, sortOrder: 2 },
      { id: ids.beitbridge, name: "Beitbridge", city: "Beitbridge", country: "Zimbabwe", latitude: -22.2167, longitude: 30, radiusMeters: 6000, active: true, sortOrder: 3 },
      { id: ids.musina, name: "Musina", city: "Musina", country: "South Africa", latitude: -22.3381, longitude: 30.0417, radiusMeters: 8000, active: true, sortOrder: 4 },
      { id: ids.polokwane, name: "Polokwane", city: "Polokwane", country: "South Africa", latitude: -23.9045, longitude: 29.4688, radiusMeters: 15000, active: true, sortOrder: 5 },
      { id: ids.pretoria, name: "Pretoria", city: "Pretoria", country: "South Africa", latitude: -25.7479, longitude: 28.2293, radiusMeters: 18000, active: true, sortOrder: 6 },
      { id: ids.johannesburg, name: "Johannesburg", city: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473, radiusMeters: 20000, active: true, sortOrder: 7 },
    ];

    const reach = (id: string, tripId: string, vehicleId: string, checkpointId: string, when: string): TripCheckpoint => ({
      id, tripId, vehicleId, checkpointId, reachedAt: when, source: "geofence",
    });
    this.reached = [
      reach("00000000-0000-4000-8000-000000000a01", ids.tripBmw, ids.bmw, ids.harare, harareIso(-2, 8)),
      reach("00000000-0000-4000-8000-000000000a02", ids.tripBmw, ids.bmw, ids.masvingo, harareIso(-2, 12)),
      reach("00000000-0000-4000-8000-000000000a03", ids.tripBmw, ids.bmw, ids.beitbridge, harareIso(-1, 9)),
      reach("00000000-0000-4000-8000-000000000a04", ids.tripBmw, ids.bmw, ids.musina, harareIso(0, 10, 24)),
      reach("00000000-0000-4000-8000-000000000a05", ids.tripHilux, ids.hilux, ids.harare, harareIso(-1, 7)),
      reach("00000000-0000-4000-8000-000000000a06", ids.tripHilux, ids.hilux, ids.masvingo, harareIso(-1, 13)),
      reach("00000000-0000-4000-8000-000000000a07", ids.tripHilux, ids.hilux, ids.beitbridge, harareIso(0, 7)),
      reach("00000000-0000-4000-8000-000000000a08", ids.tripHilux, ids.hilux, ids.musina, harareIso(0, 9)),
      reach("00000000-0000-4000-8000-000000000a09", ids.tripHilux, ids.hilux, ids.polokwane, harareIso(0, 14)),
      reach("00000000-0000-4000-8000-000000000a10", ids.tripGle, ids.gle, ids.harare, harareIso(-3, 10)),
      reach("00000000-0000-4000-8000-000000000a11", ids.tripGle, ids.gle, ids.masvingo, harareIso(-2, 15)),
      reach("00000000-0000-4000-8000-000000000a12", ids.tripGle, ids.gle, ids.beitbridge, harareIso(0, 8)),
    ];

    this.handovers = [
      {
        id: "00000000-0000-4000-8000-000000000b01",
        tripId: ids.tripGle,
        vehicleId: ids.gle,
        fromDriverId: ids.kelvin,
        toDriverId: ids.tinashe,
        token: "accepted-gle",
        code: "449120",
        status: "accepted",
        expiresAt: harareIso(-2, 20),
        latitude: -20.07,
        longitude: 30.83,
        notes: "Handover at Masvingo fuel stop.",
        createdAt: harareIso(-2, 17),
        acceptedAt: harareIso(-2, 18),
      },
    ];

    this.documents = [
      { id: "00000000-0000-4000-8000-000000000c01", driverId: ids.tapiwa, kind: "licence", fileName: "tapiwa-moyo-licence.pdf", url: "private://tapiwa-licence.txt", createdAt: harareIso(-80, 10) },
      { id: "00000000-0000-4000-8000-000000000c02", driverId: ids.tapiwa, kind: "national_id", fileName: "tapiwa-moyo-national-id.pdf", url: "private://tapiwa-id.txt", createdAt: harareIso(-80, 10) },
    ];

    this.invoices = [
      {
        id: "00000000-0000-4000-8000-000000000d01",
        number: "INV-2026-0001",
        clientId: ids.tendai,
        vehicleId: ids.lc,
        status: "pending",
        issuedOn: harareIso(-6, 9),
        dueOn: harareIso(8, 17),
        notes: "Stage transport for Harare to Pretoria.",
        createdAt: harareIso(-6, 9),
        items: [
          { id: "00000000-0000-4000-8000-000000000d11", description: "Vehicle transport — Harare to Pretoria", quantity: 1, unitPrice: 4200, total: 4200 },
          { id: "00000000-0000-4000-8000-000000000d12", description: "Border handling", quantity: 1, unitPrice: 350, total: 350 },
        ],
      },
      {
        id: "00000000-0000-4000-8000-000000000d02",
        number: "INV-2026-0002",
        clientId: ids.rudo,
        vehicleId: ids.bmw,
        status: "pending",
        issuedOn: harareIso(-10, 9),
        dueOn: harareIso(4, 17),
        notes: "Balance due before delivery in Pretoria.",
        createdAt: harareIso(-10, 9),
        items: [
          { id: "00000000-0000-4000-8000-000000000d21", description: "Vehicle transport — Harare to Pretoria", quantity: 1, unitPrice: 11450, total: 11450 },
          { id: "00000000-0000-4000-8000-000000000d22", description: "Transit insurance", quantity: 1, unitPrice: 1000, total: 1000 },
        ],
      },
    ];

    this.payments = [
      { id: "00000000-0000-4000-8000-000000000e01", clientId: ids.tendai, vehicleId: ids.lc, invoiceId: "00000000-0000-4000-8000-000000000d01", kind: "deposit", description: "Deposit", amount: 2000, status: "paid", method: "Bank transfer", reference: "DEP-LC-2000", proofUrl: null, paidOn: harareIso(-12, 11), createdAt: harareIso(-12, 11) },
      { id: "00000000-0000-4000-8000-000000000e02", clientId: ids.tendai, vehicleId: ids.lc, invoiceId: "00000000-0000-4000-8000-000000000d01", kind: "stage_payment", description: "Stage payment", amount: 2550, status: "pending", method: null, reference: null, proofUrl: null, paidOn: null, createdAt: harareIso(-6, 9) },
      { id: "00000000-0000-4000-8000-000000000e03", clientId: ids.rudo, vehicleId: ids.bmw, invoiceId: "00000000-0000-4000-8000-000000000d02", kind: "final_payment", description: "Final payment", amount: 5000, status: "paid", method: "Bank transfer", reference: "FN-5000", proofUrl: null, paidOn: harareIso(-16, 10), createdAt: harareIso(-16, 10) },
      { id: "00000000-0000-4000-8000-000000000e04", clientId: ids.rudo, vehicleId: ids.bmw, invoiceId: "00000000-0000-4000-8000-000000000d02", kind: "stage_payment", description: "Transport fee (stage 2)", amount: 3250, status: "paid", method: "Bank transfer", reference: "ST2-3250", proofUrl: null, paidOn: harareIso(-25, 10), createdAt: harareIso(-25, 10) },
      { id: "00000000-0000-4000-8000-000000000e05", clientId: ids.rudo, vehicleId: ids.bmw, invoiceId: "00000000-0000-4000-8000-000000000d02", kind: "stage_payment", description: "Transport fee (stage 1)", amount: 3200, status: "paid", method: "Bank transfer", reference: "ST1-3200", proofUrl: null, paidOn: harareIso(-33, 10), createdAt: harareIso(-33, 10) },
      { id: "00000000-0000-4000-8000-000000000e06", clientId: ids.rudo, vehicleId: ids.bmw, invoiceId: "00000000-0000-4000-8000-000000000d02", kind: "insurance", description: "Insurance", amount: 1000, status: "paid", method: "Bank transfer", reference: "INS-1000", proofUrl: null, paidOn: harareIso(-38, 10), createdAt: harareIso(-38, 10) },
    ];
    this.receipts = [
      { id: "00000000-0000-4000-8000-000000000f01", number: "RCT-2026-0001", paymentId: "00000000-0000-4000-8000-000000000e01", clientId: ids.tendai, vehicleId: ids.lc, invoiceId: "00000000-0000-4000-8000-000000000d01", amount: 2000, method: "Bank transfer", reference: "DEP-LC-2000", issuedOn: harareIso(-12, 11) },
      { id: "00000000-0000-4000-8000-000000000f02", number: "RCT-2026-0002", paymentId: "00000000-0000-4000-8000-000000000e03", clientId: ids.rudo, vehicleId: ids.bmw, invoiceId: "00000000-0000-4000-8000-000000000d02", amount: 5000, method: "Bank transfer", reference: "FN-5000", issuedOn: harareIso(-16, 10) },
    ];

    const paid = (id: string, route: string, amount: number, reference: string, offset: number): DriverPayment => ({
      id, driverId: ids.tapiwa, tripId: null, vehicleId: null, route, amount, status: "paid", reference, paidOn: harareIso(offset, 15), createdAt: harareIso(offset, 15),
    });
    this.driverPayments = [
      paid("00000000-0000-4000-8000-000000001001", "Harare → Johannesburg", 320, "DP-320", -15),
      paid("00000000-0000-4000-8000-000000001002", "Bulawayo → Beitbridge", 180, "DP-180", -19),
      paid("00000000-0000-4000-8000-000000001003", "Pretoria → Harare", 410, "DP-410", -23),
      paid("00000000-0000-4000-8000-000000001004", "Gaborone → Pretoria", 260, "DP-260", -30),
      paid("00000000-0000-4000-8000-000000001005", "Johannesburg → Durban", 390, "DP-390", -38),
      paid("00000000-0000-4000-8000-000000001006", "Lusaka → Harare", 700, "DP-700", -50),
      paid("00000000-0000-4000-8000-000000001007", "Mutare → Harare", 600, "DP-600", -61),
    ];

    this.conversations = [
      { id: ids.chatTapiwa, kind: "driver_admin", participantId: ids.tapiwa, profileId: ids.tapiwaProfile, title: "Reliance Operations", lastMessage: "Your Land Cruiser pickup is scheduled for today at Beitbridge.", lastMessageAt: harareIso(0, 7, 30), unreadForProfile: 1, unreadForAdmin: 0 },
      { id: ids.chatTendai, kind: "client_admin", participantId: ids.tendai, profileId: ids.tendaiProfile, title: "Reliance Mobility", lastMessage: "We will open this chat once your vehicle is en route.", lastMessageAt: harareIso(-1, 9), unreadForProfile: 0, unreadForAdmin: 0 },
      { id: ids.chatRudo, kind: "client_admin", participantId: ids.rudo, profileId: ids.rudoProfile, title: "Reliance Mobility", lastMessage: "Next stop is Polokwane. We will update you after the checkpoint.", lastMessageAt: harareIso(0, 10, 28), unreadForProfile: 1, unreadForAdmin: 0 },
      { id: ids.chatKelvin, kind: "driver_admin", participantId: ids.kelvin, profileId: ids.kelvinProfile, title: "Reliance Operations", lastMessage: "BMW X5 is on track through Musina.", lastMessageAt: harareIso(0, 10, 10), unreadForProfile: 0, unreadForAdmin: 0 },
    ];
    this.messages = [
      { id: "00000000-0000-4000-8000-000000001101", conversationId: ids.chatTapiwa, senderRole: "admin", senderName: "Reliance Operations", body: "Your Land Cruiser pickup is scheduled for today at Beitbridge.", createdAt: harareIso(0, 7, 30) },
      { id: "00000000-0000-4000-8000-000000001102", conversationId: ids.chatRudo, senderRole: "admin", senderName: "Reliance Mobility", body: "Your vehicle has entered the Musina checkpoint.", createdAt: harareIso(0, 10, 24) },
      { id: "00000000-0000-4000-8000-000000001103", conversationId: ids.chatRudo, senderRole: "client", senderName: "Rudo Ndlovu", body: "Great, thank you for the update.", createdAt: harareIso(0, 10, 26) },
      { id: "00000000-0000-4000-8000-000000001104", conversationId: ids.chatRudo, senderRole: "admin", senderName: "Reliance Mobility", body: "Next stop is Polokwane. We will update you after the checkpoint.", createdAt: harareIso(0, 10, 28) },
      { id: "00000000-0000-4000-8000-000000001105", conversationId: ids.chatKelvin, senderRole: "admin", senderName: "Reliance Operations", body: "BMW X5 is on track through Musina.", createdAt: harareIso(0, 10, 10) },
    ];
    this.notifications = [
      { id: "00000000-0000-4000-8000-000000001201", profileId: ids.tapiwaProfile, title: "Pickup today", body: "Toyota Land Cruiser 300 is ready at Beitbridge Border Post.", href: `/driver/trips/${ids.tripLc}`, read: false, createdAt: harareIso(0, 7) },
      { id: "00000000-0000-4000-8000-000000001202", profileId: ids.rudoProfile, title: "Checkpoint reached", body: "Your BMW X5 entered Musina, South Africa.", href: `/owner/vehicle/${ids.bmw}/track`, read: false, createdAt: harareIso(0, 10, 24) },
      { id: "00000000-0000-4000-8000-000000001203", profileId: ids.admin, title: "Tracking delay", body: "Ford Ranger RRS 9001 has not reported location for over an hour.", href: "/admin/live", read: false, createdAt: harareIso(0, 9) },
    ];
    this.activity = [
      { id: "00000000-0000-4000-8000-000000001301", actorId: ids.admin, actorName: "Admin", eventType: "trip_assigned", entity: "trip", entityId: ids.tripLc, message: "Assigned Tapiwa Moyo to AFR 2345.", createdAt: harareIso(-1, 16) },
      { id: "00000000-0000-4000-8000-000000001302", actorId: ids.kelvinProfile, actorName: "Kelvin Dube", eventType: "checkpoint_reached", entity: "vehicle", entityId: ids.bmw, message: "BMW X5 entered Musina checkpoint.", createdAt: harareIso(0, 10, 24) },
      { id: "00000000-0000-4000-8000-000000001303", actorId: ids.admin, actorName: "Admin", eventType: "vehicle_handed_over", entity: "vehicle", entityId: ids.gle, message: "Mercedes GLE handed from Kelvin Dube to Tinashe Ruzive.", createdAt: harareIso(-2, 18) },
      { id: "00000000-0000-4000-8000-000000001304", actorId: ids.admin, actorName: "Admin", eventType: "invoice_created", entity: "invoice", entityId: "00000000-0000-4000-8000-000000000d01", message: "Created invoice INV-2026-0001 for Tendai Mafidi.", createdAt: harareIso(-6, 9) },
    ];
  }

  async getProfile(id: string) { return this.profiles.find((item) => item.id === id) ?? null; }
  async listProfiles() { return [...this.profiles]; }
  async saveProfile(profile: Profile) { upsert(this.profiles, profile); }
  async findCredential(phone: string) { return this.credentials.find((item) => item.phone === phone) ?? null; }
  async saveCredential(credential: Credential) { upsert(this.credentials, credential, "profileId"); }
  async findAdmin(email: string) { return this.admins.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null; }
  async saveAdmin(secret: AdminSecret) { upsert(this.admins, secret, "profileId"); }
  async logAttempt(attempt: AuthAttempt) { this.attempts.push(attempt); }
  async recentAttempts(ip: string, sinceIso: string) {
    return this.attempts.filter((item) => item.ip === ip && item.createdAt >= sinceIso && !item.success).length;
  }
  async getDriverByProfile(profileId: string) { return this.drivers.find((item) => item.profileId === profileId) ?? null; }
  async getDriver(id: string) { return this.drivers.find((item) => item.id === id) ?? null; }
  async listDrivers() { return [...this.drivers]; }
  async saveDriver(driver: Driver) { upsert(this.drivers, driver); }
  async getClientByProfile(profileId: string) { return this.clients.find((item) => item.profileId === profileId) ?? null; }
  async getClient(id: string) { return this.clients.find((item) => item.id === id) ?? null; }
  async listClients() { return [...this.clients]; }
  async saveClient(client: Client) { upsert(this.clients, client); }
  async listVehicles() { return [...this.vehicles]; }
  async getVehicle(id: string) { return this.vehicles.find((item) => item.id === id) ?? null; }
  async saveVehicle(vehicle: Vehicle) { upsert(this.vehicles, vehicle); }
  async listTrips() { return [...this.trips]; }
  async getTrip(id: string) { return this.trips.find((item) => item.id === id) ?? null; }
  async saveTrip(trip: Trip) { upsert(this.trips, trip); }
  async listAssignments() { return [...this.assignments]; }
  async saveAssignment(assignment: Assignment) { upsert(this.assignments, assignment); }
  async listPhotos(tripId: string) { return this.photos.filter((item) => item.tripId === tripId); }
  async savePhoto(photo: TripPhoto) { upsert(this.photos, photo); }
  async getInspection(tripId: string) { return this.inspections.find((item) => item.tripId === tripId) ?? null; }
  async saveInspection(inspection: Inspection) {
    const index = this.inspections.findIndex((item) => item.tripId === inspection.tripId);
    if (index >= 0) this.inspections[index] = inspection;
    else this.inspections.push(inspection);
  }
  async latestLocation(tripId: string) {
    return this.locations.filter((item) => item.tripId === tripId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
  }
  async listLocations(tripId: string) {
    return this.locations.filter((item) => item.tripId === tripId).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }
  async latestFleetLocations() {
    const latest = new Map<string, TripLocation>();
    for (const location of this.locations) {
      const current = latest.get(location.tripId);
      if (!current || current.recordedAt < location.recordedAt) latest.set(location.tripId, location);
    }
    return [...latest.values()];
  }
  async saveLocation(location: TripLocation) { this.locations.push(location); }
  async listCheckpoints() { return [...this.checkpoints].sort((a, b) => a.sortOrder - b.sortOrder); }
  async listReached(tripId?: string) { return this.reached.filter((item) => !tripId || item.tripId === tripId); }
  async saveReached(entry: TripCheckpoint) { this.reached.push(entry); }
  async listHandovers(tripId?: string) { return this.handovers.filter((item) => !tripId || item.tripId === tripId); }
  async findHandover(tokenOrCode: string) {
    const key = tokenOrCode.trim().toLowerCase();
    return this.handovers.find((item) => item.token.toLowerCase() === key || item.code === tokenOrCode.trim()) ?? null;
  }
  async saveHandover(handover: Handover) { upsert(this.handovers, handover); }
  async listDocuments(driverId: string) { return this.documents.filter((item) => item.driverId === driverId); }
  async saveDocument(document: DriverDocument) { upsert(this.documents, document); }
  async listInvoices() { return [...this.invoices]; }
  async saveInvoice(invoice: Invoice) { upsert(this.invoices, invoice); }
  async nextInvoiceNumber() {
    this.invoiceSeq += 1;
    return `INV-${new Date().getFullYear()}-${String(this.invoiceSeq).padStart(4, "0")}`;
  }
  async nextReceiptNumber() {
    this.receiptSeq += 1;
    return `RCT-${new Date().getFullYear()}-${String(this.receiptSeq).padStart(4, "0")}`;
  }
  async listPayments() { return [...this.payments]; }
  async savePayment(payment: Payment) { upsert(this.payments, payment); }
  async listReceipts() { return [...this.receipts]; }
  async saveReceipt(receipt: Receipt) { upsert(this.receipts, receipt); }
  async listDriverPayments(driverId?: string) {
    return this.driverPayments.filter((item) => !driverId || item.driverId === driverId);
  }
  async saveDriverPayment(payment: DriverPayment) { upsert(this.driverPayments, payment); }
  async listConversations() { return [...this.conversations]; }
  async saveConversation(conversation: Conversation) { upsert(this.conversations, conversation); }
  async listMessages(conversationId: string) {
    return this.messages.filter((item) => item.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async saveMessage(message: Message) { this.messages.push(message); }
  async listNotifications(profileId: string) {
    return this.notifications.filter((item) => item.profileId === profileId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveNotification(notification: AppNotification) { upsert(this.notifications, notification); }
  async listActivity() { return [...this.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async logActivity(activity: Activity) { this.activity.unshift(activity); }
  async getSettings() { return this.settings; }
  async saveSettings(settings: CompanySettings) { this.settings = settings; }
}

function upsert<T>(rows: T[], row: T, key: keyof T = "id" as keyof T) {
  const index = rows.findIndex((item) => item[key] === row[key]);
  if (index >= 0) rows[index] = row;
  else rows.push(row);
}

const globalStore = globalThis as unknown as { __rms?: MemoryRepo };

export const memoryRepo = globalStore.__rms?.version === SEED_VERSION ? globalStore.__rms : new MemoryRepo();
globalStore.__rms = memoryRepo;
