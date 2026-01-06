export type RoutePreview = {
  distanceMeters: number;
  durationSeconds: number;
  steps: { text: string; distance: number; time: number }[];
};

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export function openGoogleMaps(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  const d = `${dest.lat},${dest.lng}`;
  const url = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${d}&travelmode=walking`
    : `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=walking`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openAppleMaps(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  const daddr = `${dest.lat},${dest.lng}`;
  const url = origin
    ? `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${daddr}&dirflg=w`
    : `https://maps.apple.com/?daddr=${daddr}&dirflg=w`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openBestNavApp(
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number },
) {
  const ua = navigator.userAgent.toLowerCase();
  const isApple = /iphone|ipad|macintosh/.test(ua);
  if (isApple) return openAppleMaps(origin, dest);
  return openGoogleMaps(origin, dest);
}
