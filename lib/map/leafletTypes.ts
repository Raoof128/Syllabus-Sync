/**
 * leafletTypes.ts - Type definitions for Leaflet-related modules
 *
 * This module centralizes type definitions and type-safe wrappers
 * for working with Leaflet and react-leaflet.
 *
 * All unsafe type assertions for dynamic module loading should be
 * isolated in useLeafletLoader.ts, not scattered throughout components.
 */

/**
 * Leaflet module type (the 'L' global)
 */
export type LeafletModule = typeof import('leaflet');

/**
 * React-Leaflet component types we use in the app
 */
export interface ReactLeafletComponents {
  MapContainer: typeof import('react-leaflet').MapContainer;
  Marker: typeof import('react-leaflet').Marker;
  Popup: typeof import('react-leaflet').Popup;
  Polyline: typeof import('react-leaflet').Polyline;
  useMap: typeof import('react-leaflet').useMap;
  useMapEvents: typeof import('react-leaflet').useMapEvents;
}

/**
 * Map instance type
 */
export type LeafletMap = import('leaflet').Map;

/**
 * Marker instance type
 */
export type LeafletMarker = import('leaflet').Marker;

/**
 * Circle instance type
 */
export type LeafletCircle = import('leaflet').Circle;

/**
 * Icon type
 */
export type LeafletIcon = import('leaflet').Icon;

/**
 * DivIcon type (used for custom HTML markers)
 */
export type LeafletDivIcon = import('leaflet').DivIcon;

/**
 * LatLng type
 */
export type LeafletLatLng = import('leaflet').LatLng;

/**
 * Bounds type
 */
export type LeafletLatLngBounds = import('leaflet').LatLngBounds;

/**
 * Props for components that render on top of the map
 */
export interface MapOverlayProps {
  /** The Leaflet map instance */
  map: LeafletMap;
  /** The Leaflet module (L) */
  L: LeafletModule;
}

/**
 * Coordinate types used throughout the map
 */
export interface PixelCoordinates {
  x: number;
  y: number;
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

/**
 * CRS.Simple coordinate (Leaflet's pixel-based coordinate system)
 * In CRS.Simple, lat corresponds to Y and lng corresponds to X
 */
export interface CrsSimpleCoordinates {
  lat: number; // Y in pixel space (inverted: 0 at bottom)
  lng: number; // X in pixel space
}
