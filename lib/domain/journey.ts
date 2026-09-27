import type { Checkpoint, TripCheckpoint, TripStatus, VehicleStatus } from "@/lib/data/types";

export type MilestoneState = "done" | "current" | "upcoming";

export type Milestone = {
  key: string;
  title: string;
  detail: string | null;
  at: string | null;
  state: MilestoneState;
};

const rank: Record<VehicleStatus, number> = {
  awaiting_shipment: 0,
  shipping: 1,
  ready_for_collection: 2,
  assigned: 2,
  collected: 3,
  in_transit: 4,
  at_checkpoint: 4,
  delayed: 4,
  arrived: 5,
  delivered: 6,
};

export function journeyMilestones(input: {
  status: VehicleStatus;
  checkpointIds: string[];
  checkpoints: Checkpoint[];
  reached: TripCheckpoint[];
}): Milestone[] {
  const byId = new Map(input.checkpoints.map((item) => [item.id, item]));
  const reachedAt = new Map(input.reached.map((item) => [item.checkpointId, item.reachedAt]));
  const level = rank[input.status];
  const steps: Array<Omit<Milestone, "state"> & { done: boolean; checkpoint: boolean }> = [
    { key: "registered", title: "Vehicle registered", detail: null, at: null, done: true, checkpoint: false },
    { key: "shipping", title: "Shipping", detail: null, at: null, done: level >= 1, checkpoint: false },
    { key: "collected", title: "Vehicle collected", detail: null, at: null, done: level >= 3, checkpoint: false },
  ];
  for (const id of input.checkpointIds) {
    const checkpoint = byId.get(id);
    if (!checkpoint) continue;
    const at = reachedAt.get(id) ?? null;
    steps.push({
      key: id,
      title: checkpoint.name,
      detail: `${checkpoint.city}, ${checkpoint.country}`,
      at,
      done: Boolean(at),
      checkpoint: true,
    });
  }
  steps.push({
    key: "delivered",
    title: "Delivered",
    detail: null,
    at: null,
    done: input.status === "delivered",
    checkpoint: false,
  });

  let lastReached = -1;
  steps.forEach((step, index) => {
    if (step.checkpoint && step.done) lastReached = index;
  });
  const openIndex = steps.findIndex((step) => !step.done);
  const currentIndex = input.status === "delivered" ? -1 : lastReached >= 0 ? lastReached : openIndex;

  return steps.map((step, index) => {
    const { done, checkpoint, ...rest } = step;
    void checkpoint;
    let state: MilestoneState = "upcoming";
    if (currentIndex === -1 || (done && index < currentIndex)) state = "done";
    else if (index === currentIndex) state = done ? "current" : "current";
    else if (done) state = "done";
    return { ...rest, state };
  });
}

const tripOrder: TripStatus[] = [
  "assigned",
  "arrived_pickup",
  "inspected",
  "collected",
  "in_transit",
  "destination_reached",
  "delivered",
];

export function tripProgress(status: TripStatus) {
  const labels = [
    "Assigned",
    "Arrived at Pickup",
    "Vehicle Inspected",
    "Collected",
    "In Transit",
    "Destination Reached",
    "Delivered",
  ];
  const index = Math.max(0, tripOrder.indexOf(status));
  return labels.map((label, step) => ({
    key: tripOrder[step],
    label,
    state: (status === "delivered" ? "done" : step < index ? "done" : step === index ? "current" : "upcoming") as MilestoneState,
  }));
}

export function chatAllowed(input: {
  override: "auto" | "open" | "closed";
  appAccess: boolean;
  checkpoints: Checkpoint[];
  reached: TripCheckpoint[];
  status: VehicleStatus;
}) {
  if (!input.appAccess) return false;
  if (input.override === "open") return true;
  if (input.override === "closed") return false;
  if (input.status === "arrived" || input.status === "delivered") return true;
  return input.reached.some((item) => input.checkpoints.find((checkpoint) => checkpoint.id === item.checkpointId)?.country === "South Africa");
}
