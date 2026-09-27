export type Role = "super_admin" | "admin" | "driver" | "client";
export type AccountStatus = "pending" | "active" | "suspended" | "disabled";
export type VehicleStatus =
  | "awaiting_shipment"
  | "shipping"
  | "ready_for_collection"
  | "assigned"
  | "collected"
  | "in_transit"
  | "at_checkpoint"
  | "delayed"
  | "arrived"
  | "delivered";
export type TripStatus =
  | "draft"
  | "assigned"
  | "arrived_pickup"
  | "inspected"
  | "collected"
  | "in_transit"
  | "destination_reached"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "approved" | "paid" | "overdue" | "awaiting_verification" | "cancelled";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";
export type PhotoSlot = "front" | "rear" | "left" | "right" | "interior" | "dashboard" | "damage" | "additional";
export type Condition = "good" | "fair" | "poor";
export type FuelLevel = "full" | "three_quarter" | "half" | "quarter" | "empty";

export interface Profile {
  id: string;
  role: Role;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  profileId: string;
  phone: string;
  pinHash: string;
  failedAttempts: number;
  lockedUntil: string | null;
}

export interface AdminSecret {
  profileId: string;
  email: string;
  passwordHash: string;
}

export interface Driver {
  id: string;
  profileId: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  driverCode: string;
  licenceNumber: string;
  licenceExpiry: string | null;
  nationalId: string | null;
  accountStatus: AccountStatus;
  appAccess: boolean;
  carsTransported: number;
  distanceKm: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  profileId: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  company: string | null;
  address: string | null;
  accountStatus: AccountStatus;
  appAccess: boolean;
  chatOverride: "auto" | "open" | "closed";
  createdAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registration: string;
  referenceNumber: string;
  vin: string;
  engineNumber: string;
  insuranceStatus: "insured" | "not_insured";
  insuranceProvider: string | null;
  insuranceExpiry: string | null;
  origin: string;
  destination: string;
  expectedDeparture: string | null;
  estimatedArrival: string | null;
  shippingReference: string | null;
  status: VehicleStatus;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupAt: string;
  eta: string;
  status: TripStatus;
  distanceKm: number;
  shippingReference: string;
  checkpointIds: string[];
  notes: string | null;
  arrivedAt: string | null;
  arrivedLat: number | null;
  arrivedLng: number | null;
  startedAt: string | null;
  startedLat: number | null;
  startedLng: number | null;
  completedAt: string | null;
  completedLat: number | null;
  completedLng: number | null;
  createdAt: string;
}

export interface Assignment {
  id: string;
  tripId: string;
  driverId: string;
  assignedAt: string;
  unassignedAt: string | null;
  active: boolean;
}

export interface TripPhoto {
  id: string;
  tripId: string;
  slot: PhotoSlot;
  url: string;
  createdAt: string;
}

export interface Inspection {
  tripId: string;
  exterior: Condition;
  tyres: Condition;
  windows: Condition;
  lights: Condition;
  fuelLevel: FuelLevel;
  visibleDamage: boolean;
  notes: string;
  completedAt: string;
}

export interface TripLocation {
  id: string;
  tripId: string;
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speedKmh: number | null;
  recordedAt: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  sortOrder: number;
}

export interface TripCheckpoint {
  id: string;
  tripId: string;
  vehicleId: string;
  checkpointId: string;
  reachedAt: string;
  source: "geofence" | "admin";
}

export interface Handover {
  id: string;
  tripId: string;
  vehicleId: string;
  fromDriverId: string;
  toDriverId: string | null;
  token: string;
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
  acceptedAt: string | null;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  kind: "licence" | "national_id" | "passport" | "other";
  fileName: string;
  url: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  vehicleId: string;
  status: InvoiceStatus;
  issuedOn: string;
  dueOn: string;
  notes: string | null;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  vehicleId: string;
  invoiceId: string | null;
  kind: "transport_fee" | "insurance" | "deposit" | "stage_payment" | "final_payment" | "other";
  description: string;
  amount: number;
  status: PaymentStatus;
  method: string | null;
  reference: string | null;
  proofUrl: string | null;
  paidOn: string | null;
  createdAt: string;
}

export interface Receipt {
  id: string;
  number: string;
  paymentId: string;
  clientId: string;
  vehicleId: string;
  invoiceId: string | null;
  amount: number;
  method: string;
  reference: string;
  issuedOn: string;
}

export interface DriverPayment {
  id: string;
  driverId: string;
  tripId: string | null;
  vehicleId: string | null;
  route: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  reference: string;
  paidOn: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  kind: "driver_admin" | "client_admin";
  participantId: string;
  profileId: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadForProfile: number;
  unreadForAdmin: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderRole: "admin" | "driver" | "client";
  senderName: string;
  body: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  profileId: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  actorId: string | null;
  actorName: string;
  eventType: string;
  entity: string;
  entityId: string;
  message: string;
  createdAt: string;
}

export interface AuthAttempt {
  id: string;
  phone: string;
  ip: string;
  success: boolean;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  paymentInstructions: string;
}

export interface Repo {
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  saveProfile(profile: Profile): Promise<void>;
  findCredential(phone: string): Promise<Credential | null>;
  saveCredential(credential: Credential): Promise<void>;
  findAdmin(email: string): Promise<AdminSecret | null>;
  saveAdmin(secret: AdminSecret): Promise<void>;
  logAttempt(attempt: AuthAttempt): Promise<void>;
  recentAttempts(ip: string, sinceIso: string): Promise<number>;
  getDriverByProfile(profileId: string): Promise<Driver | null>;
  getDriver(id: string): Promise<Driver | null>;
  listDrivers(): Promise<Driver[]>;
  saveDriver(driver: Driver): Promise<void>;
  getClientByProfile(profileId: string): Promise<Client | null>;
  getClient(id: string): Promise<Client | null>;
  listClients(): Promise<Client[]>;
  saveClient(client: Client): Promise<void>;
  listVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | null>;
  saveVehicle(vehicle: Vehicle): Promise<void>;
  listTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  listAssignments(): Promise<Assignment[]>;
  saveAssignment(assignment: Assignment): Promise<void>;
  listPhotos(tripId: string): Promise<TripPhoto[]>;
  savePhoto(photo: TripPhoto): Promise<void>;
  getInspection(tripId: string): Promise<Inspection | null>;
  saveInspection(inspection: Inspection): Promise<void>;
  latestLocation(tripId: string): Promise<TripLocation | null>;
  listLocations(tripId: string): Promise<TripLocation[]>;
  latestFleetLocations(): Promise<TripLocation[]>;
  saveLocation(location: TripLocation): Promise<void>;
  listCheckpoints(): Promise<Checkpoint[]>;
  listReached(tripId?: string): Promise<TripCheckpoint[]>;
  saveReached(entry: TripCheckpoint): Promise<void>;
  listHandovers(tripId?: string): Promise<Handover[]>;
  findHandover(tokenOrCode: string): Promise<Handover | null>;
  saveHandover(handover: Handover): Promise<void>;
  listDocuments(driverId: string): Promise<DriverDocument[]>;
  saveDocument(document: DriverDocument): Promise<void>;
  listInvoices(): Promise<Invoice[]>;
  saveInvoice(invoice: Invoice): Promise<void>;
  nextInvoiceNumber(): Promise<string>;
  nextReceiptNumber(): Promise<string>;
  listPayments(): Promise<Payment[]>;
  savePayment(payment: Payment): Promise<void>;
  listReceipts(): Promise<Receipt[]>;
  saveReceipt(receipt: Receipt): Promise<void>;
  listDriverPayments(driverId?: string): Promise<DriverPayment[]>;
  saveDriverPayment(payment: DriverPayment): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  saveConversation(conversation: Conversation): Promise<void>;
  listMessages(conversationId: string): Promise<Message[]>;
  saveMessage(message: Message): Promise<void>;
  listNotifications(profileId: string): Promise<AppNotification[]>;
  saveNotification(notification: AppNotification): Promise<void>;
  listActivity(): Promise<Activity[]>;
  logActivity(activity: Activity): Promise<void>;
  getSettings(): Promise<CompanySettings>;
  saveSettings(settings: CompanySettings): Promise<void>;
}
