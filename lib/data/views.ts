import type { InvoiceStatus, PaymentStatus, PhotoSlot, TripStatus, VehicleStatus } from "@/lib/data/types";
import type { Milestone, MilestoneState } from "@/lib/domain/journey";

export type TripSummary = {
  id: string;
  vehicleId: string;
  title: string;
  colour: string;
  year: number;
  registration: string;
  imageUrl: string | null;
  pickup: string;
  dropoff: string;
  pickupLabel: string;
  distanceKm: number;
  status: TripStatus;
  statusLabel: string;
};

export type DriverHome = {
  name: string;
  driverCode: string;
  unread: number;
  current: TripSummary | null;
  next: TripSummary | null;
};

export type TripDetail = TripSummary & {
  reference: string;
  etaLabel: string;
  steps: { key: string; label: string; state: MilestoneState }[];
  photos: { id: string; slot: PhotoSlot; url: string }[];
  inspected: boolean;
  canArrive: boolean;
  canInspect: boolean;
  canStart: boolean;
  canTrack: boolean;
  canHandover: boolean;
  canFinish: boolean;
};

export type MapPoint = { latitude: number; longitude: number; label?: string };

export type DriverTracking = {
  tripId: string;
  title: string;
  registration: string;
  imageUrl: string | null;
  pickup: string;
  dropoff: string;
  status: TripStatus;
  statusLabel: string;
  distanceKm: number;
  startedAt: string | null;
  speedKmh: number | null;
  route: MapPoint[];
  position: MapPoint | null;
  pickupPoint: MapPoint;
  destinationPoint: MapPoint;
};

export type PaymentRow = {
  id: string;
  route: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  reference: string;
  dateLabel: string;
};

export type DriverMoney = {
  earned: number;
  received: number;
  pending: number;
  rows: PaymentRow[];
};

export type ClientVehicleCard = {
  id: string;
  title: string;
  colour: string;
  year: number;
  registration: string;
  reference: string;
  imageUrl: string | null;
  status: VehicleStatus;
  statusLabel: string;
  insured: boolean;
  insurer: string | null;
  insuranceExpiry: string | null;
  origin: string;
  destination: string;
  etaLabel: string | null;
  lastMilestone: string | null;
  managedBy: string;
  vinMasked: string;
  engineMasked: string;
};

export type ClientHome = {
  name: string;
  unread: number;
  vehicles: ClientVehicleCard[];
  chatOpen: boolean;
};

export type ClientJourney = {
  vehicleId: string;
  title: string;
  registration: string;
  imageUrl: string | null;
  statusLabel: string;
  insured: boolean;
  origin: string;
  destination: string;
  etaLabel: string | null;
  lastPlace: string | null;
  updatedLabel: string | null;
  milestones: Milestone[];
  route: MapPoint[];
};

export type ClientPaymentRow = {
  id: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  dateLabel: string;
  kind: string;
};

export type ClientPayments = {
  total: number;
  paid: number;
  outstanding: number;
  instructions: string;
  rows: ClientPaymentRow[];
};

export type InvoiceView = {
  id: string;
  number: string;
  status: InvoiceStatus;
  vehicle: string;
  client: string;
  issuedOn: string;
  dueOn: string;
  notes: string | null;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  total: number;
  paid: number;
  balance: number;
};

export type ChatMessage = {
  id: string;
  mine: boolean;
  sender: string;
  body: string;
  timeLabel: string;
};

export type ChatThread = {
  id: string;
  title: string;
  open: boolean;
  closedReason: string | null;
  messages: ChatMessage[];
};

export type FleetUnit = {
  tripId: string;
  vehicleId: string;
  title: string;
  registration: string;
  referenceNumber: string;
  imageUrl: string | null;
  origin: string;
  driverName: string;
  driverId: string;
  driverCode: string;
  driverPhone: string;
  driverAvatarUrl: string | null;
  driverStatus: string;
  driverLastActiveAt: string | null;
  status: string;
  statusLabel: string;
  destination: string;
  eta: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  speedKmh: number | null;
  recordedAt: string;
  updatedLabel: string;
  routePoints: { latitude: number; longitude: number; label: string }[];
  delayed: boolean;
  atCheckpoint: boolean;
};
