export type RoutePreview = {
  distanceMeters: number;
  durationSeconds: number;
  steps: { text: string; distance: number; time: number }[];
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param point1 - First coordinate {lat, lng}
 * @param point2 - Second coordinate {lat, lng}
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate walking time based on distance
 * @param distanceMeters - Distance in meters
 * @param speedKmh - Walking speed in km/h (default: 5)
 * @returns Estimated time in seconds
 */
export function estimateWalkingTime(
  distanceMeters: number,
  speedKmh: number = 5,
): number {
  const speedMs = speedKmh / 3.6; // Convert km/h to m/s
  return Math.round(distanceMeters / speedMs);
}

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  return mins < 60
    ? `${mins} min`
    : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export function openGoogleMaps(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  const d = `${dest.lat},${dest.lng}`;
  const url = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${d}&travelmode=walking`
    : `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=walking`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openAppleMaps(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  const daddr = `${dest.lat},${dest.lng}`;
  const url = origin
    ? `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${daddr}&dirflg=w`
    : `https://maps.apple.com/?daddr=${daddr}&dirflg=w`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openBestNavApp(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  // User preference: Always use Google Maps instead of Apple Maps
  // const ua = navigator.userAgent.toLowerCase();
  // const isApple = /iphone|ipad|macintosh/.test(ua);
  // if (isApple) return openAppleMaps(origin, dest);
  return openGoogleMaps(origin, dest);
}
