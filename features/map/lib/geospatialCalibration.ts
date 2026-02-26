/**
 * geospatialCalibration.ts - GCP-based Affine Transformation for GPS-to-Pixel Mapping
 *
 * This module provides accurate coordinate transformation between WGS84 GPS coordinates
 * and the CRS.Simple pixel-based campus map using Ground Control Points (GCPs).
 *
 * It uses a Multiple Linear Regression (Affine Transformation) to handle:
 * - Translation (Offset)
 * - Scaling (Zoom)
 * - Rotation (Map alignment vs True North)
 * - Shearing (Projection distortion)
 *
 * @author Syllabus Sync Team
 * @version 3.0.0 (Affine)
 * @since 2026-01-24
 */

import { MAP_CONFIG, pixelToCrsSimple } from './buildings';

// =============================================================================
// TYPES
// =============================================================================

export interface GroundControlPoint {
  id: string;
  name: string;
  gps: { lat: number; lng: number };
  pixel: [number, number];
  source: 'google_maps' | 'osm' | 'survey' | 'exif';
  verifiedDate: string;
}

export interface AffineCoefficients {
  x: [number, number, number]; // [Bias, Lng, Lat]
  y: [number, number, number]; // [Bias, Lng, Lat]
  normalization: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface TransformResult {
  pixel: [number, number];
  crsSimple: { lat: number; lng: number };
  isOnCampus: boolean;
  accuracy: number;
  method: 'gcp_affine';
}

export interface ExifGpsData {
  latitude: number;
  latitudeRef: 'N' | 'S';
  longitude: number;
  longitudeRef: 'E' | 'W';
  altitude?: number;
  timestamp?: Date;
}

// =============================================================================
// VERIFIED GROUND CONTROL POINTS
// =============================================================================

export const GROUND_CONTROL_POINTS: GroundControlPoint[] = [
  {
    id: 'GCP_LIBRARY',
    name: 'Waranara Library (Main Entrance)',
    gps: { lat: -33.7756994, lng: 151.1131306 },
    pixel: [2455, 2388], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_SPORT',
    name: 'Macquarie University Sport and Aquatic Centre',
    gps: { lat: -33.7726489, lng: 151.1105693 },
    pixel: [1781, 1162], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_COURTYARD',
    name: 'Central Courtyard',
    gps: { lat: -33.7738842, lng: 151.1135164 },
    pixel: [2638, 1618], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_18WW',
    name: "18 Wally's Walk (Central Hub)",
    gps: { lat: -33.7739781, lng: 151.1126116 },
    pixel: [2392, 1881], // +110px offset applied
    source: 'osm',
    verifiedDate: '2026-02-26',
  },
  {
    id: 'GCP_4ER',
    name: '4 Eastern Road (Business School)',
    gps: { lat: -33.775787, lng: 151.1160258 },
    pixel: [3176, 2352], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-20',
  },
  {
    id: 'GCP_HOSP',
    name: 'MQ University Hospital',
    gps: { lat: -33.7735912, lng: 151.1179502 },
    pixel: [3909, 1568], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_INCUB',
    name: 'MQ Incubator',
    gps: { lat: -33.7763444, lng: 151.1090529 },
    pixel: [1295, 2537], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_OBS',
    name: 'Observatory',
    gps: { lat: -33.7703261, lng: 151.1111248 },
    pixel: [1865, 492], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_19ER',
    name: '19 Eastern Road (Chancellery)',
    gps: { lat: -33.7724696, lng: 151.1148539 },
    pixel: [3052, 1203], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_BANKSIA',
    name: 'Banksia Cottage',
    gps: { lat: -33.7752254, lng: 151.1090476 },
    pixel: [1305, 2175], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_17WW',
    name: "17 Wally's Walk (Law)",
    gps: { lat: -33.7748805, lng: 151.1133652 },
    pixel: [2621, 1916], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_29WW',
    name: "29 Wally's Walk (Walanga Muru)",
    gps: { lat: -33.7743082, lng: 151.1104628 },
    pixel: [1661, 1879], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_CHAP',
    name: '10 Hadenfeld Ave (Chaplaincy)',
    gps: { lat: -33.7760151, lng: 151.1080508 },
    pixel: [1085, 2580], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_LAKESIDE',
    name: 'Lakeside Hotel',
    gps: { lat: -33.7713301, lng: 151.1158846 },
    pixel: [3309, 719], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_SHOPPING',
    name: 'Macquarie Centre',
    gps: { lat: -33.7772506, lng: 151.1211352 },
    pixel: [4314, 2607], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_HEARING',
    name: 'Australian Hearing Hub',
    gps: { lat: -33.7764943, lng: 151.1118029 },
    pixel: [1932, 2706], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_21WW',
    name: 'Macquarie Theatre',
    gps: { lat: -33.7746449, lng: 151.1122661 },
    pixel: [2188, 1950], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_12SW',
    name: 'Student Services (12SW)',
    gps: { lat: -33.775054, lng: 151.113053 },
    pixel: [2287, 2120], // +110px offset applied
    source: 'google_maps',
    verifiedDate: '2026-01-24',
  },
  {
    id: 'GCP_8SCO',
    name: '8 Sir Christopher Ondaatje Ave',
    gps: { lat: -33.77578, lng: 151.11473 },
    pixel: [2933, 2260], // +110px offset applied
    source: 'survey',
    verifiedDate: '2026-01-24',
  },
];

// =============================================================================
// MATH HELPERS (Affine Transformation)
// =============================================================================

function invert3x3(m: number[][]): number[][] | null {
  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[2][1] * m[1][2]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  if (Math.abs(det) < 1e-10) return null;

  const invDet = 1 / det;
  const minv: number[][] = [];

  for (let i = 0; i < 3; i++) minv[i] = [];

  minv[0][0] = (m[1][1] * m[2][2] - m[2][1] * m[1][2]) * invDet;
  minv[0][1] = (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet;
  minv[0][2] = (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet;

  minv[1][0] = (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet;
  minv[1][1] = (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet;
  minv[1][2] = (m[1][0] * m[0][2] - m[0][0] * m[1][2]) * invDet;

  minv[2][0] = (m[1][0] * m[2][1] - m[2][0] * m[1][1]) * invDet;
  minv[2][1] = (m[2][0] * m[0][1] - m[0][0] * m[2][1]) * invDet;
  minv[2][2] = (m[0][0] * m[1][1] - m[1][0] * m[0][1]) * invDet;

  return minv;
}

function multiplyMatrixVector(m: number[][], v: number[]): number[] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function solveMultipleRegression(inputs: number[][], outputs: number[]): number[] | null {
  const n = inputs.length;
  const xtx = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const xty = [0, 0, 0];

  for (let i = 0; i < n; i++) {
    const row = inputs[i];
    const y = outputs[i];
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        xtx[j][k] += row[j] * row[k];
      }
      xty[j] += row[j] * y;
    }
  }

  const xtxInv = invert3x3(xtx);
  if (!xtxInv) return null;

  return multiplyMatrixVector(xtxInv, xty);
}

// =============================================================================
// CALIBRATION LOGIC
// =============================================================================

let _cachedCoeffs: AffineCoefficients | null = null;
let _cachedRmse = 0;

/**
 * Manual offset to fine-tune the final result (in pixels).
 * Use this to correct small global shifts visible in testing.
 * X is Left/Right (East is positive). Y is Top/Bottom.
 */
const MANUAL_OFFSET = { x: 0, y: 0 }; // Reset to 0 as GCPs now include the offset

export function computeAffineCoefficients(gcps: GroundControlPoint[]): AffineCoefficients {
  if (gcps.length < 3) throw new Error('Need at least 3 GCPs for affine transformation');

  const lats = gcps.map((g) => g.gps.lat);
  const lngs = gcps.map((g) => g.gps.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const normalize = (val: number, min: number, max: number) => (val - min) / (max - min);

  const inputs = gcps.map((g) => [
    1,
    normalize(g.gps.lng, minLng, maxLng),
    normalize(g.gps.lat, minLat, maxLat),
  ]);

  const xParams = solveMultipleRegression(
    inputs,
    gcps.map((g) => g.pixel[0]),
  );
  const yParams = solveMultipleRegression(
    inputs,
    gcps.map((g) => g.pixel[1]),
  );

  if (!xParams || !yParams) {
    throw new Error('Failed to solve regression matrix - points may be collinear');
  }

  return {
    x: xParams as [number, number, number],
    y: yParams as [number, number, number],
    normalization: { minLat, maxLat, minLng, maxLng },
  };
}

export function getAffineCoefficients(): AffineCoefficients {
  if (!_cachedCoeffs) {
    _cachedCoeffs = computeAffineCoefficients(GROUND_CONTROL_POINTS);
    _cachedRmse = computeRMSE(_cachedCoeffs, GROUND_CONTROL_POINTS);
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[GeoCalibration] Affine transformation computed from ${GROUND_CONTROL_POINTS.length} GCPs. RMSE: ${_cachedRmse.toFixed(2)} px`,
      );
    }
  }
  return _cachedCoeffs;
}

function gpsToPixelAffine(lat: number, lng: number, coeffs: AffineCoefficients): [number, number] {
  const { minLat, maxLat, minLng, maxLng } = coeffs.normalization;
  const normLng = (lng - minLng) / (maxLng - minLng);
  const normLat = (lat - minLat) / (maxLat - minLat);

  const x = coeffs.x[0] + coeffs.x[1] * normLng + coeffs.x[2] * normLat;
  const y = coeffs.y[0] + coeffs.y[1] * normLng + coeffs.y[2] * normLat;

  // Apply manual fine-tuning offset
  return [Math.round(x + MANUAL_OFFSET.x), Math.round(y + MANUAL_OFFSET.y)];
}

function computeRMSE(coeffs: AffineCoefficients, gcps: GroundControlPoint[]): number {
  let sumSqError = 0;
  for (const gcp of gcps) {
    const predicted = gpsToPixelAffine(gcp.gps.lat, gcp.gps.lng, coeffs);
    const dx = predicted[0] - gcp.pixel[0];
    const dy = predicted[1] - gcp.pixel[1];
    sumSqError += dx * dx + dy * dy;
  }
  return Math.sqrt(sumSqError / gcps.length);
}

// =============================================================================
// PUBLIC API
// =============================================================================

export function gpsToPixelCalibrated(lat: number, lng: number): TransformResult {
  const coeffs = getAffineCoefficients();
  const pixel = gpsToPixelAffine(lat, lng, coeffs);

  const margin = 100;
  const isOnCampus =
    pixel[0] >= -margin &&
    pixel[0] <= MAP_CONFIG.width + margin &&
    pixel[1] >= -margin &&
    pixel[1] <= MAP_CONFIG.height + margin;

  const clampedPixel: [number, number] = [
    Math.max(0, Math.min(MAP_CONFIG.width, pixel[0])),
    Math.max(0, Math.min(MAP_CONFIG.height, pixel[1])),
  ];

  const crsSimple = pixelToCrsSimple(clampedPixel[0], clampedPixel[1]);

  return {
    pixel: clampedPixel,
    crsSimple,
    isOnCampus,
    accuracy: _cachedRmse,
    method: 'gcp_affine',
  };
}

export function gpsToCrsSimple(lat: number, lng: number): { lat: number; lng: number } | null {
  const result = gpsToPixelCalibrated(lat, lng);
  return result.isOnCampus ? result.crsSimple : null;
}

export function calibratePhotoMarker(exifData: ExifGpsData): TransformResult {
  let lat = exifData.latitude;
  let lng = exifData.longitude;
  if (exifData.latitudeRef === 'S') lat = -Math.abs(lat);
  if (exifData.longitudeRef === 'W') lng = -Math.abs(lng);
  return gpsToPixelCalibrated(lat, lng);
}

export function calibratePhotoMarkerFromCoords(lat: number, lng: number): TransformResult {
  return gpsToPixelCalibrated(lat, lng);
}

export function getCalibrationDiagnostics() {
  const coeffs = getAffineCoefficients();
  const { width } = MAP_CONFIG;
  const metersPerPixel = 2000 / width;

  const residuals = GROUND_CONTROL_POINTS.map((gcp) => {
    const predicted = gpsToPixelAffine(gcp.gps.lat, gcp.gps.lng, coeffs);
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
    method: 'Affine (Multiple Regression)',
    gcpResiduals: residuals,
  };
}

export function compareTransformMethods(
  lat: number,
  lng: number,
): {
  linear: [number, number];
  gcpOptimized: [number, number];
  offsetPixels: number;
  offsetMeters: number;
} {
  const { width, height } = MAP_CONFIG;
  const coeffs = getAffineCoefficients();

  // Linear interpolation using normalization bounds (Naive)
  const { minLat, maxLat, minLng, maxLng } = coeffs.normalization;
  const xNorm = (lng - minLng) / (maxLng - minLng);
  const yNorm = (maxLat - lat) / (maxLat - minLat); // Lat increases Up, Y Down
  const linearX = Math.round(xNorm * width);
  const linearY = Math.round(yNorm * height);

  // Affine transformation
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
