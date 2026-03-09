export type GoogleTravelMode = 'WALK' | 'DRIVE' | 'BICYCLE' | 'TRANSIT';

export interface MapLatLng {
  lat: number;
  lng: number;
  /** GPS accuracy in meters (from GeolocationCoordinates.accuracy) */
  accuracy?: number;
}

export interface GoogleRouteStep {
  distanceMeters: number;
  durationSeconds: number;
  instruction: string;
  travelMode?: string;
  transitLineName?: string;
  transitHeadsign?: string;
  transitStopCount?: number;
}

export interface GoogleComputedRoute {
  mode: GoogleTravelMode;
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  steps: GoogleRouteStep[];
}

/** External (non-building) destination from Google Places */
export interface ExternalDestination {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}
