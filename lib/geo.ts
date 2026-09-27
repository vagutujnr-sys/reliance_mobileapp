export type LatLng = { latitude: number; longitude: number };

const EARTH = 6371000;

export function haversineMeters(a: LatLng, b: LatLng) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function shouldStoreLocation(
  previous: { latitude: number; longitude: number; recordedAt: string } | null,
  next: LatLng & { recordedAt: string },
) {
  if (!previous) return true;
  const moved = haversineMeters(previous, next);
  const elapsed = new Date(next.recordedAt).getTime() - new Date(previous.recordedAt).getTime();
  return moved >= 250 || elapsed >= 45_000;
}
