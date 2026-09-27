const HARARE = "Africa/Harare";

export function formatUsd(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatKm(km: number) {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

export function harareParts(iso: string | Date) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: HARARE,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: HARARE,
  }).format(date);
  return { day, time };
}

export function formatDate(iso: string) {
  return harareParts(iso).day;
}

export function formatDateTime(iso: string) {
  const { day, time } = harareParts(iso);
  return `${day}, ${time}`;
}

export function formatSchedule(iso: string) {
  const { day, time } = harareParts(iso);
  const today = harareParts(new Date()).day;
  return `${day === today ? "Today" : day}, ${time}`;
}

export function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: HARARE,
    }).format(now),
  );
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
