import type { InvoiceStatus, PaymentStatus, TripStatus, VehicleStatus } from "@/lib/data/types";

const vehicleLabels: Record<VehicleStatus, string> = {
  awaiting_shipment: "Awaiting Shipment",
  shipping: "Shipping",
  ready_for_collection: "Ready for Collection",
  assigned: "Assigned",
  collected: "Collected",
  in_transit: "In Transit",
  at_checkpoint: "At Checkpoint",
  delayed: "Delayed",
  arrived: "Arrived",
  delivered: "Delivered",
};

const tripLabels: Record<TripStatus, string> = {
  draft: "Draft",
  assigned: "Assigned",
  arrived_pickup: "Arrived at Pickup",
  inspected: "Inspected",
  collected: "Collected",
  in_transit: "In Transit",
  destination_reached: "Destination Reached",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function vehicleLabel(status: VehicleStatus) {
  return vehicleLabels[status];
}

export function tripLabel(status: TripStatus) {
  return tripLabels[status];
}

export function clientStatusLabel(status: VehicleStatus) {
  if (status === "in_transit") return "In Transit";
  if (status === "ready_for_collection" || status === "assigned") return "Ready for Collection";
  return vehicleLabels[status];
}

export function toneForStatus(status: string): "green" | "amber" | "red" | "blue" | "grey" {
  if (["delivered", "paid", "active", "insured", "approved"].includes(status)) return "green";
  if (["pending", "assigned", "shipping", "ready_for_collection", "awaiting_verification", "draft"].includes(status)) return "amber";
  if (["delayed", "overdue", "suspended", "disabled", "cancelled"].includes(status)) return "red";
  if (["in_transit", "at_checkpoint", "collected", "arrived", "arrived_pickup", "inspected"].includes(status)) return "blue";
  return "grey";
}

export function paymentLabel(status: PaymentStatus | InvoiceStatus | "pending" | "approved" | "paid") {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
