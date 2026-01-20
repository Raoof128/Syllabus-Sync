/**
 * geospatialCalibration.ts - GCP-based Linear Transformation for GPS-to-Pixel Mapping
 *
 * This module provides accurate coordinate transformation between WGS84 GPS coordinates
 * and the CRS.Simple pixel-based campus map using Ground Control Points (GCPs).
 *
 * The transformation uses GCP-optimized linear bounds that minimize the RMSE across
 * all control points. This is more numerically stable than full affine transformation
 * for the small GPS range of a campus map.
 *
 * COORDINATE SYSTEMS:
 * 1. WGS84 GPS: { lat, lng } - Real-world coordinates from Geolocation API / EXIF
 * 2. Image Pixels: [x, y] - Pixel position on the 4678x3307 campus map image
 * 3. CRS.Simple: { lat, lng } - Leaflet coordinates where lat = height - y, lng = x
 *
 * @author Syllabus Sync Team
 * @version 2.0.0
 * @since 2026-01-20
 */

import { MAP_CONFIG, pixelToCrsSimple } from './buildings';

// =============================================================================
// TYPES
// =============================================================================

/** Ground Control Point - links a known GPS location to a pixel position */
export interface GroundControlPoint {
  /** Unique identifier for the GCP */
  id: string;
  /** Human-readable name (e.g., "Waranara Library entrance") */
  name: string;
  /** WGS84 GPS coordinates from Google Maps */
  gps: { lat: number; lng: number };
  /** Corresponding pixel position on the map image [x, y] */
  pixel: [number, number];
  /** Source of the GPS data for verification */
  source: 'google_maps' | 'osm' | 'survey' | 'exif';
  /** Date the GCP was verified */
  verifiedDate: string;
}

/** Optimized GPS bounds computed from GCPs */
export interface OptimizedBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Result of coordinate transformation with metadata */
export interface TransformResult {
  /** Transformed pixel coordinates [x, y] */
  pixel: [number, number];
  /** CRS.Simple coordinates for Leaflet */
  crsSimple: { lat: number; lng: number };
  /** Is the point within the calibrated campus bounds? */
  isOnCampus: boolean;
  /** Estimated accuracy in pixels (based on GCP residuals) */
  accuracy: number;
  /** Transformation method used */
  method: 'gcp_linear' | 'linear_fallback';
}

/** EXIF GPS data extracted from a photo */
export interface ExifGpsData {
  latitude: number;
  latitudeRef: 'N' | 'S';
  longitude: number;
  longitudeRef: 'E' | 'W';
  altitude?: number;
  timestamp?: Date;
}

// =============================================================================
// VERIFIED GROUND CONTROL POINTS (from Google Maps MCP - 2026-01-20)
// =============================================================================

/**
 * Ground Control Points verified via Google Maps API.
 * These are well-defined, permanent landmarks with clear pixel positions.
 *
 * CALIBRATION METHODOLOGY:
 * 1. Select 4+ well-distributed landmarks across the campus
 * 2. Get precise GPS coordinates from Google Maps API
 * 3. Identify the exact pixel position on the map image
 * 4. Use least-squares to compute optimized linear bounds
 */
export const GROUND_CONTROL_POINTS: GroundControlPoint[] = [
  {
    id: 'GCP_LIBRARY',
    name: 'Waranara Library (Main Entrance)',
    gps: { lat: -33.7756994, lng: 151.1131306 },
    pixel: [2345, 2388], // From buildings.ts - LIB position
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_SPORT',
    name: 'Macquarie University Sport and Aquatic Centre',
    gps: { lat: -33.7726489, lng: 151.1105693 },
    pixel: [1671, 1162], // From buildings.ts - SPORT position (corrected)
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_COURTYARD',
    name: 'Central Courtyard',
    gps: { lat: -33.7738842, lng: 151.1135164 },
    pixel: [2528, 1618], // From buildings.ts - 1CC position
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_18WW',
    name: "18 Wally's Walk (Central Hub)",
    gps: { lat: -33.7741501, lng: 151.1127909 },
    pixel: [2282, 1881], // From buildings.ts - 18WW position
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_4ER',
    name: '4 Eastern Road (Business School)',
    gps: { lat: -33.775787, lng: 151.1160258 },
    pixel: [3066, 2352], // From buildings.ts - 4ER position
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
];

// =============================================================================
// OPTIMIZED BOUNDS COMPUTATION
// =============================================================================

/**
 * Compute optimized GPS bounds from GCPs using least-squares fitting.
 *
 * The linear transformation is:
 *   pixelX = (lng - west) / (east - west) * width
 *   pixelY = (north - lat) / (north - south) * height
 *
 * We solve for bounds that minimize the total squared error across all GCPs.
 */
export function computeOptimizedBounds(gcps: GroundControlPoint[]): OptimizedBounds {
  if (gcps.length < 2) {
    throw new Error('Need at least 2 GCPs to compute bounds');
  }

  const { width, height } = MAP_CONFIG;

  // For each GCP, we have:
  //   xNorm = pixel[0] / width = (lng - west) / (east - west)
  //   yNorm = pixel[1] / height = (north - lat) / (north - south)

  // Rearranging:
  //   west + xNorm * (east - west) = lng
  //   north - yNorm * (north - south) = lat

  // Using least-squares with constraints (west < east, south < north):
  // We'll use the GCPs to estimate the linear relationship directly

  // Calculate the linear regression coefficients for lng -> pixelX
  // pixelX = a * lng + b
  let sumLng = 0,
    sumLat = 0,
    sumPx = 0,
    sumPy = 0;
  let sumLng2 = 0,
    sumLat2 = 0;
  let sumLngPx = 0,
    sumLatPy = 0;
  const n = gcps.length;

  for (const gcp of gcps) {
    sumLng += gcp.gps.lng;
    sumLat += gcp.gps.lat;
    sumPx += gcp.pixel[0];
    sumPy += gcp.pixel[1];
    sumLng2 += gcp.gps.lng * gcp.gps.lng;
    sumLat2 += gcp.gps.lat * gcp.gps.lat;
    sumLngPx += gcp.gps.lng * gcp.pixel[0];
    sumLatPy += gcp.gps.lat * gcp.pixel[1];
  }

  // Linear regression for X: pixelX = aX * lng + bX
  const aX = (n * sumLngPx - sumLng * sumPx) / (n * sumLng2 - sumLng * sumLng);
  const bX = (sumPx - aX * sumLng) / n;

  // Linear regression for Y: pixelY = aY * lat + bY
  const aY = (n * sumLatPy - sumLat * sumPy) / (n * sumLat2 - sumLat * sumLat);
  const bY = (sumPy - aY * sumLat) / n;

  // Now convert back to bounds:
  // pixelX = (lng - west) / (east - west) * width
  // pixelX = width/(east-west) * lng - width*west/(east-west)
  // So: aX = width/(east-west), bX = -width*west/(east-west)
  // Therefore: west = -bX/aX, east = west + width/aX

  // For Y (note: lat increases upward, pixel Y increases downward):
  // pixelY = (north - lat) / (north - south) * height
  // pixelY = -height/(north-south) * lat + height*north/(north-south)
  // So: aY = -height/(north-south), bY = height*north/(north-south)
  // Therefore: north = bY / (height/(-aY)) = -bY * (north-south) / height
  // Actually: north - south = -height/aY
  // And: north = bY * (north-south) / height = bY * (-height/aY) / height = -bY/aY

  const west = -bX / aX;
  const east = west + width / aX;
  const north = -bY / aY;
  const south = north + height / aY; // aY is negative, so this subtracts

  return { north, south, east, west };
}

// =============================================================================
// CACHED OPTIMIZED BOUNDS
// =============================================================================

let _cachedBounds: OptimizedBounds | null = null;
let _cachedRmse: number = 0;

/**
 * Get the cached optimized bounds (computed from GCPs).
 * Lazy-loaded on first call.
 */
export function getOptimizedBounds(): OptimizedBounds {
  if (!_cachedBounds) {
    _cachedBounds = computeOptimizedBounds(GROUND_CONTROL_POINTS);
    _cachedRmse = computeRMSE(_cachedBounds, GROUND_CONTROL_POINTS);
    // Using console.warn as allowed by lint rules
    console.warn(
      `[GeoCalibration] Optimized bounds computed from ${GROUND_CONTROL_POINTS.length} GCPs. RMSE: ${_cachedRmse.toFixed(2)} pixels (~${(_cachedRmse * 0.43).toFixed(1)}m)`,
    );
  }
  return _cachedBounds;
}

/**
 * Compute Root Mean Square Error of the linear transformation against GCPs.
 * Lower is better - indicates how well the transform fits the control points.
 */
function computeRMSE(bounds: OptimizedBounds, gcps: GroundControlPoint[]): number {
  let sumSqError = 0;
  const { width, height } = MAP_CONFIG;

  for (const gcp of gcps) {
    const predicted = gpsToPixelWithBounds(gcp.gps.lat, gcp.gps.lng, bounds);
    const dx = predicted[0] - gcp.pixel[0];
    const dy = predicted[1] - gcp.pixel[1];
    sumSqError += dx * dx + dy * dy;
  }

  return Math.sqrt(sumSqError / gcps.length);
}

/**
 * Convert GPS to pixel using specific bounds.
 */
function gpsToPixelWithBounds(lat: number, lng: number, bounds: OptimizedBounds): [number, number] {
  const { width, height } = MAP_CONFIG;
  const { north, south, east, west } = bounds;

  const xNorm = (lng - west) / (east - west);
  const yNorm = (north - lat) / (north - south);

  return [Math.round(xNorm * width), Math.round(yNorm * height)];
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Transform GPS coordinates to pixel position using GCP-optimized linear bounds.
 * This is the PRIMARY function for accurate GPS-to-pixel conversion.
 *
 * @param lat - WGS84 latitude
 * @param lng - WGS84 longitude
 * @returns Transformation result with pixel coords, CRS.Simple coords, and metadata
 */
export function gpsToPixelCalibrated(lat: number, lng: number): TransformResult {
  const bounds = getOptimizedBounds();
  const pixel = gpsToPixelWithBounds(lat, lng, bounds);

  // Check if result is within map bounds (with some margin)
  const margin = 100; // pixels
  const isOnCampus =
    pixel[0] >= -margin &&
    pixel[0] <= MAP_CONFIG.width + margin &&
    pixel[1] >= -margin &&
    pixel[1] <= MAP_CONFIG.height + margin;

  // Clamp to valid range for display
  const clampedPixel: [number, number] = [
    Math.max(0, Math.min(MAP_CONFIG.width, pixel[0])),
    Math.max(0, Math.min(MAP_CONFIG.height, pixel[1])),
  ];

  // Convert to CRS.Simple for Leaflet
  const crsSimple = pixelToCrsSimple(clampedPixel[0], clampedPixel[1]);

  return {
    pixel: clampedPixel,
    crsSimple,
    isOnCampus,
    accuracy: _cachedRmse,
    method: 'gcp_linear',
  };
}

/**
 * Transform GPS coordinates to CRS.Simple coordinates for Leaflet.
 * Convenience wrapper around gpsToPixelCalibrated().
 *
 * @param lat - WGS84 latitude
 * @param lng - WGS84 longitude
 * @returns CRS.Simple coordinates { lat, lng } for Leaflet, or null if off-campus
 */
export function gpsToCrsSimple(lat: number, lng: number): { lat: number; lng: number } | null {
  const result = gpsToPixelCalibrated(lat, lng);
  return result.isOnCampus ? result.crsSimple : null;
}

/**
 * Calibrate a photo marker from EXIF GPS coordinates.
 * Applies the GCP-based transformation to place the photo accurately on the map.
 *
 * @param exifData - EXIF GPS data from photo
 * @returns Transformation result with corrected position
 */
export function calibratePhotoMarker(exifData: ExifGpsData): TransformResult {
  // Convert EXIF format to decimal degrees
  let lat = exifData.latitude;
  let lng = exifData.longitude;

  // Handle hemisphere references
  if (exifData.latitudeRef === 'S') lat = -Math.abs(lat);
  if (exifData.longitudeRef === 'W') lng = -Math.abs(lng);

  return gpsToPixelCalibrated(lat, lng);
}

/**
 * Calibrate a photo marker from decimal GPS coordinates.
 * Simplified version when you already have decimal lat/lng.
 *
 * @param lat - Decimal latitude (negative for south)
 * @param lng - Decimal longitude (negative for west)
 * @returns Transformation result with corrected position
 */
export function calibratePhotoMarkerFromCoords(lat: number, lng: number): TransformResult {
  return gpsToPixelCalibrated(lat, lng);
}

// =============================================================================
// DIAGNOSTIC FUNCTIONS
// =============================================================================

/**
 * Get diagnostic information about the current calibration.
 * Useful for debugging and displaying calibration quality in dev tools.
 */
export function getCalibrationDiagnostics(): {
  gcpCount: number;
  rmsePixels: number;
  rmseMeters: number;
  optimizedBounds: OptimizedBounds;
  originalBounds: typeof MAP_CONFIG.bounds;
  gcpResiduals: Array<{ id: string; dx: number; dy: number; error: number }>;
} {
  const bounds = getOptimizedBounds();
  const { width } = MAP_CONFIG;
  const metersPerPixel = 2000 / width; // Campus is ~2km wide

  // Calculate residuals for each GCP
  const residuals = GROUND_CONTROL_POINTS.map((gcp) => {
    const predicted = gpsToPixelWithBounds(gcp.gps.lat, gcp.gps.lng, bounds);
    const dx = predicted[0] - gcp.pixel[0];
    const dy = predicted[1] - gcp.pixel[1];
    return {
      id: gcp.id,
      dx,
      dy,
      error: Math.sqrt(dx * dx + dy * dy),
    };
  });

  return {
    gcpCount: GROUND_CONTROL_POINTS.length,
    rmsePixels: _cachedRmse,
    rmseMeters: _cachedRmse * metersPerPixel,
    optimizedBounds: bounds,
    originalBounds: MAP_CONFIG.bounds,
    gcpResiduals: residuals,
  };
}

/**
 * Compare linear interpolation (original bounds) vs GCP-optimized transformation.
 * Useful for understanding the offset being corrected.
 */
export function compareTransformMethods(
  lat: number,
  lng: number,
): {
  linear: [number, number];
  gcpOptimized: [number, number];
  offsetPixels: number;
  offsetMeters: number;
} {
  const { width, height, bounds } = MAP_CONFIG;

  // Linear interpolation with original bounds
  const xNorm = (lng - bounds.west) / (bounds.east - bounds.west);
  const yNorm = (bounds.north - lat) / (bounds.north - bounds.south);
  const linearX = Math.round(xNorm * width);
  const linearY = Math.round(yNorm * height);

  // GCP-optimized transformation
  const result = gpsToPixelCalibrated(lat, lng);

  // Calculate offset
  const dx = result.pixel[0] - linearX;
  const dy = result.pixel[1] - linearY;
  const offsetPixels = Math.sqrt(dx * dx + dy * dy);
  const metersPerPixel = 2000 / width;

  return {
    linear: [linearX, linearY],
    gcpOptimized: result.pixel,
    offsetPixels,
    offsetMeters: offsetPixels * metersPerPixel,
  };
}
