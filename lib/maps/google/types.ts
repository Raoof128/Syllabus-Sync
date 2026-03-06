export type GoogleTravelMode = 'WALK' | 'DRIVE' | 'BICYCLE' | 'TRANSIT';

export type GoogleMapProvider = 'google-js';

export interface MapLatLng {
  lat: number;
  lng: number;
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

export type SelectedDestination =
  | {
      kind: 'building';
      buildingId: string;
      label: string;
      lat: number;
      lng: number;
      entranceLat?: number;
      entranceLng?: number;
      googlePlaceId?: string;
    }
  | {
      kind: 'place';
      placeId: string;
      label: string;
      lat: number;
      lng: number;
    };

export interface GoogleRouteState {
  mode: GoogleTravelMode;
  destination: SelectedDestination | null;
  userLocation: MapLatLng | null;
  route: GoogleComputedRoute | null;
  isLoading: boolean;
  error: string | null;
}
