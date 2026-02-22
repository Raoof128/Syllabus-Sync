/**
 * Ground Control Point (GCP) Calibration Module
 *
 * This module implements industry-standard GCP-based georeferencing for the
 * campus map. It uses known landmark positions (pixel coordinates on the raster
 * map image) paired with their real GPS coordinates to compute optimal bounds
 * that minimize positioning error across all control points.
 *
 * Workflow:
 * 1. Define GCPs with pixel positions (from the 4678x3307 map image) and
 *    corresponding GPS coordinates (from OSM or GPS device)
 * 2. Run the solver to compute optimal bounds
 * 3. Calculate error metrics (RMSE, per-point residuals)
 * 4. Update MAP_CONFIG with the calibrated bounds
 *
 * @author Syllabus Sync Team
 * @version 1.0.0
 * @date 2026-01-10
 */

import { createDevLogger } from "@/lib/utils/devLog";

// Create a logger for GCP calibration
const gcpLog = createDevLogger("GCP");

// Map dimensions (must match the actual image size)
export const GCP_MAP_WIDTH = 4678;
export const GCP_MAP_HEIGHT = 3307;

/**
 * Ground Control Point type
 * Represents a known landmark with both pixel and GPS coordinates
 */
export interface GCP {
  id: string;
  name: string;
  pixel: [number, number]; // [x, y] pixel coordinates on the map image
  gps: {
    lat: number;
    lng: number;
  };
  source?: string; // e.g., 'OSM', 'GPS', 'surveyed'
}

/**
 * Geographic bounds for the map image overlay
 */
export interface MapBounds {
  south: number; // minimum latitude (bottom)
  north: number; // maximum latitude (top)
  west: number; // minimum longitude (left)
  east: number; // maximum longitude (right)
}

/**
 * Error metrics for a single GCP
 */
export interface GCPError {
  id: string;
  name: string;
  expectedPixel: [number, number];
  computedPixel: [number, number];
  pixelError: number; // Euclidean distance in pixels
  gpsError: {
    lat: number;
    lng: number;
    total: number; // Euclidean distance in degrees
  };
}

/**
 * Calibration result with bounds and error metrics
 */
export interface CalibrationResult {
  bounds: MapBounds;
  errors: GCPError[];
  rmsePixels: number; // Root Mean Square Error in pixels
  rmseMeters: number; // Approximate RMSE in meters (at this latitude)
  maxErrorPixels: number;
  maxErrorBuilding: string;
}

// ============================================
// GROUND CONTROL POINTS DEFINITION
// ============================================

/**
 * Primary GCPs - High-confidence landmarks with verified GPS coordinates
 * These are used for the main calibration
 *
 * NOTE: Pixel positions are calculated from GPS using calibrated bounds.
 * The 3 anchor GCPs (18WW, LIB, UBAR) have GPS-verified positions.
 * Other GCPs derive their pixel positions from OSM GPS coordinates.
 */
export const PRIMARY_GCPS: GCP[] = [
  {
    id: "18WW",
    name: "18 Wally's Walk (Central Hub)",
    pixel: [1692, 1870], // Anchor GCP - GPS verified
    gps: { lat: -33.77551, lng: 151.11259 },
    source: "GPS verified (anchor)",
  },
  {
    id: "LIB",
    name: "Waranara Library",
    pixel: [1735, 2409], // Anchor GCP - GPS verified
    gps: { lat: -33.77842, lng: 151.11277 },
    source: "GPS verified (anchor)",
  },
  {
    id: "UBAR",
    name: "UBar & Central Courtyard",
    pixel: [1945, 1590], // Anchor GCP - GPS verified
    gps: { lat: -33.774, lng: 151.11365 },
    source: "GPS verified (anchor)",
  },
  {
    id: "HOSP",
    name: "MQ University Hospital",
    pixel: [3001, 1557], // Calculated from GPS using calibrated bounds
    gps: { lat: -33.773819, lng: 151.118075 },
    source: "OSM (pixel from GPS)",
  },
  {
    id: "SPORT",
    name: "Sport & Aquatic Centre",
    pixel: [1258, 1342], // Calculated from GPS using calibrated bounds
    gps: { lat: -33.772661, lng: 151.110771 },
    source: "OSM (pixel from GPS)",
  },
  {
    id: "DLC",
    name: "Dunmore Lang College",
    pixel: [2520, 2363], // Calculated from GPS using calibrated bounds
    gps: { lat: -33.77817, lng: 151.11606 },
    source: "OSM (pixel from GPS)",
  },
];

/**
 * Secondary GCPs - Additional landmarks for validation
 * These can be used to verify calibration accuracy
 * Pixel positions calculated from GPS using calibrated bounds
 */
export const SECONDARY_GCPS: GCP[] = [
  {
    id: "4ER",
    name: "4 Eastern Road (Business School)",
    pixel: [2502, 1925], // Calculated from GPS
    gps: { lat: -33.775808, lng: 151.115985 },
    source: "OSM (pixel from GPS)",
  },
  {
    id: "OBS",
    name: "Observatory",
    pixel: [1342, 915], // Calculated from GPS
    gps: { lat: -33.770357, lng: 151.111125 },
    source: "OSM (pixel from GPS)",
  },
  {
    id: "COCHLEAR",
    name: "Cochlear Limited",
    pixel: [1934, 2230], // Calculated from GPS
    gps: { lat: -33.777452, lng: 151.113603 },
    source: "OSM (pixel from GPS)",
  },
  {
    id: "LOTUS",
    name: "Lotus Theatre",
    pixel: [1230, 1707], // Calculated from GPS
    gps: { lat: -33.774631, lng: 151.110656 },
    source: "OSM (pixel from GPS)",
  },
];

// ============================================
// COORDINATE CONVERSION FUNCTIONS
// ============================================

/**
 * Convert pixel coordinates to GPS using given bounds
 */
export function pixelToGpsWithBounds(
  x: number,
  y: number,
  bounds: MapBounds,
): { lat: number; lng: number } {
  const xNorm = x / GCP_MAP_WIDTH;
  const yNorm = y / GCP_MAP_HEIGHT;

  const lng = bounds.west + xNorm * (bounds.east - bounds.west);
  const lat = bounds.north - yNorm * (bounds.north - bounds.south);

  return { lat, lng };
}

/**
 * Convert GPS coordinates to pixel using given bounds
 */
export function gpsToPixelWithBounds(
  lat: number,
  lng: number,
  bounds: MapBounds,
): [number, number] {
  const xNorm = (lng - bounds.west) / (bounds.east - bounds.west);
  const yNorm = (bounds.north - lat) / (bounds.north - bounds.south);

  const x = Math.round(xNorm * GCP_MAP_WIDTH);
  const y = Math.round(yNorm * GCP_MAP_HEIGHT);

  return [x, y];
}

// ============================================
// LEAST-SQUARES BOUNDS SOLVER
// ============================================

/**
 * Solve for optimal bounds using least-squares optimization
 *
 * The problem: Given N GCPs with known (pixel, gps) pairs, find bounds
 * [south, north, west, east] that minimize the total squared error.
 *
 * The linear mapping equations are:
 *   lng = west + (x / width) * (east - west)
 *   lat = north - (y / height) * (north - south)
 *
 * Rearranging:
 *   lng = west + x * (east - west) / width
 *   lat = north - y * (north - south) / height
 *
 * Let:
 *   dLng = east - west (longitude span)
 *   dLat = north - south (latitude span)
 *
 * Then:
 *   lng = west + (x / width) * dLng
 *   lat = north - (y / height) * dLat
 *
 * This is a linear system that can be solved analytically.
 */
export function solveForOptimalBounds(gcps: GCP[]): MapBounds {
  if (gcps.length < 2) {
    throw new Error("Need at least 2 GCPs to solve for bounds");
  }

  // For a simple linear fit, we solve two independent 1D problems:
  // 1. Longitude: lng_i = west + (x_i / width) * dLng
  // 2. Latitude: lat_i = north - (y_i / height) * dLat

  // Collect normalized coordinates
  const xNorms = gcps.map((gcp) => gcp.pixel[0] / GCP_MAP_WIDTH);
  const yNorms = gcps.map((gcp) => gcp.pixel[1] / GCP_MAP_HEIGHT);
  const lngs = gcps.map((gcp) => gcp.gps.lng);
  const lats = gcps.map((gcp) => gcp.gps.lat);

  // Solve for longitude: lng = west + xNorm * dLng
  // Linear regression: lng = a + b * xNorm
  // where a = west, b = dLng
  const { intercept: west, slope: dLng } = linearRegression(xNorms, lngs);
  const east = west + dLng;

  // Solve for latitude: lat = north - yNorm * dLat
  // Rewrite as: lat = north - yNorm * dLat
  // Linear regression: lat = a + b * yNorm
  // where a = north, b = -dLat
  const { intercept: north, slope: negDLat } = linearRegression(yNorms, lats);
  const dLat = -negDLat;
  const south = north - dLat;

  return { south, north, west, east };
}

/**
 * Simple linear regression: y = intercept + slope * x
 * Uses least squares to find optimal intercept and slope
 */
function linearRegression(
  x: number[],
  y: number[],
): { intercept: number; slope: number } {
  const n = x.length;

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  // Calculate slope: sum((xi - xMean)(yi - yMean)) / sum((xi - xMean)^2)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  return { intercept, slope };
}

// ============================================
// ERROR CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate error metrics for a set of GCPs against given bounds
 */
export function calculateErrors(gcps: GCP[], bounds: MapBounds): GCPError[] {
  return gcps.map((gcp) => {
    // Compute what pixel position the GPS coords would map to with these bounds
    const computedPixel = gpsToPixelWithBounds(
      gcp.gps.lat,
      gcp.gps.lng,
      bounds,
    );

    // Compute what GPS coords the pixel position would map to
    const computedGps = pixelToGpsWithBounds(
      gcp.pixel[0],
      gcp.pixel[1],
      bounds,
    );

    // Calculate pixel error
    const pixelDx = computedPixel[0] - gcp.pixel[0];
    const pixelDy = computedPixel[1] - gcp.pixel[1];
    const pixelError = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);

    // Calculate GPS error
    const gpsDLat = computedGps.lat - gcp.gps.lat;
    const gpsDLng = computedGps.lng - gcp.gps.lng;
    const gpsTotal = Math.sqrt(gpsDLat * gpsDLat + gpsDLng * gpsDLng);

    return {
      id: gcp.id,
      name: gcp.name,
      expectedPixel: gcp.pixel,
      computedPixel,
      pixelError,
      gpsError: {
        lat: gpsDLat,
        lng: gpsDLng,
        total: gpsTotal,
      },
    };
  });
}

/**
 * Calculate RMSE (Root Mean Square Error) in pixels
 */
export function calculateRMSE(errors: GCPError[]): number {
  if (errors.length === 0) return 0;

  const sumSquaredErrors = errors.reduce(
    (sum, err) => sum + err.pixelError * err.pixelError,
    0,
  );
  return Math.sqrt(sumSquaredErrors / errors.length);
}

/**
 * Convert pixel error to approximate meters
 * At this latitude (~33.77S), 1 degree latitude ~ 110.9km, 1 degree longitude ~ 92.7km
 */
export function pixelErrorToMeters(
  pixelError: number,
  bounds: MapBounds,
): number {
  // Calculate meters per pixel
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;

  // At latitude ~33.77, approximate conversions
  const LAT_DEG_TO_METERS = 110900; // meters per degree latitude
  const LNG_DEG_TO_METERS = 92700; // meters per degree longitude at this latitude

  const metersPerPixelLat = (latSpan * LAT_DEG_TO_METERS) / GCP_MAP_HEIGHT;
  const metersPerPixelLng = (lngSpan * LNG_DEG_TO_METERS) / GCP_MAP_WIDTH;

  // Average meters per pixel
  const avgMetersPerPixel = (metersPerPixelLat + metersPerPixelLng) / 2;

  return pixelError * avgMetersPerPixel;
}

// ============================================
// MAIN CALIBRATION FUNCTION
// ============================================

/**
 * Run full calibration and return results with error metrics
 */
export function runCalibration(gcps: GCP[] = PRIMARY_GCPS): CalibrationResult {
  // Solve for optimal bounds
  const bounds = solveForOptimalBounds(gcps);

  // Calculate errors
  const errors = calculateErrors(gcps, bounds);

  // Calculate RMSE
  const rmsePixels = calculateRMSE(errors);
  const rmseMeters = pixelErrorToMeters(rmsePixels, bounds);

  // Find max error
  const maxError = errors.reduce(
    (max, err) =>
      err.pixelError > max.error ? { error: err.pixelError, id: err.id } : max,
    { error: 0, id: "" },
  );

  return {
    bounds,
    errors,
    rmsePixels,
    rmseMeters,
    maxErrorPixels: maxError.error,
    maxErrorBuilding: maxError.id,
  };
}

/**
 * Validate calibration against secondary GCPs
 */
export function validateCalibration(
  bounds: MapBounds,
  validationGcps: GCP[] = SECONDARY_GCPS,
): CalibrationResult {
  const errors = calculateErrors(validationGcps, bounds);
  const rmsePixels = calculateRMSE(errors);
  const rmseMeters = pixelErrorToMeters(rmsePixels, bounds);

  const maxError = errors.reduce(
    (max, err) =>
      err.pixelError > max.error ? { error: err.pixelError, id: err.id } : max,
    { error: 0, id: "" },
  );

  return {
    bounds,
    errors,
    rmsePixels,
    rmseMeters,
    maxErrorPixels: maxError.error,
    maxErrorBuilding: maxError.id,
  };
}

// ============================================
// LOGGING AND REPORTING
// ============================================

/**
 * Format calibration result as a human-readable string
 */
export function formatCalibrationReport(result: CalibrationResult): string {
  const lines: string[] = [
    "=== GCP Calibration Report ===",
    "",
    "Optimized Bounds:",
    `  south: ${result.bounds.south.toFixed(7)}`,
    `  north: ${result.bounds.north.toFixed(7)}`,
    `  west:  ${result.bounds.west.toFixed(7)}`,
    `  east:  ${result.bounds.east.toFixed(7)}`,
    "",
    "Error Metrics:",
    `  RMSE: ${result.rmsePixels.toFixed(2)} pixels (~${result.rmseMeters.toFixed(1)}m)`,
    `  Max Error: ${result.maxErrorPixels.toFixed(2)} pixels (${result.maxErrorBuilding})`,
    "",
    "Per-GCP Errors:",
  ];

  for (const err of result.errors) {
    lines.push(
      `  ${err.id.padEnd(12)} ${err.pixelError.toFixed(1).padStart(6)}px  ` +
        `(expected: [${err.expectedPixel[0]}, ${err.expectedPixel[1]}], ` +
        `computed: [${err.computedPixel[0]}, ${err.computedPixel[1]}])`,
    );
  }

  return lines.join("\n");
}

/**
 * Get bounds as a TypeScript object literal for copy-paste
 */
export function getBoundsAsCode(bounds: MapBounds): string {
  return `bounds: {
    south: ${bounds.south},
    north: ${bounds.north},
    west: ${bounds.west},
    east: ${bounds.east},
  }`;
}

/**
 * Get CAMPUS_BOUNDS as Leaflet format for copy-paste
 */
export function getBoundsAsLeaflet(bounds: MapBounds): string {
  return `const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [${bounds.south}, ${bounds.west}], // SW (bottom-left)
  [${bounds.north}, ${bounds.east}], // NE (top-right)
];`;
}

// ============================================
// DEVELOPMENT HELPERS
// ============================================

/**
 * Run calibration and log results (for development/debugging)
 */
export function runCalibrationWithLogging(): CalibrationResult {
  gcpLog.log("Running GCP calibration...");
  gcpLog.log(`Using ${PRIMARY_GCPS.length} primary GCPs`);

  const result = runCalibration();
  gcpLog.log(formatCalibrationReport(result));

  gcpLog.log("\n--- Code to update MAP_CONFIG ---");
  gcpLog.log(getBoundsAsCode(result.bounds));

  gcpLog.log("\n--- Code to update CAMPUS_BOUNDS ---");
  gcpLog.log(getBoundsAsLeaflet(result.bounds));

  // Validate against secondary GCPs
  gcpLog.log("\n=== Validation against Secondary GCPs ===");
  const validation = validateCalibration(result.bounds);
  gcpLog.log(
    `Validation RMSE: ${validation.rmsePixels.toFixed(2)} pixels (~${validation.rmseMeters.toFixed(1)}m)`,
  );

  return result;
}

// Export all GCPs for use in debug visualization
export const ALL_GCPS = [...PRIMARY_GCPS, ...SECONDARY_GCPS];

// ============================================
// AFFINE TRANSFORMATION
// ============================================

/**
 * Affine transformation coefficients
 * Transforms pixel coordinates (x, y) to GPS coordinates (lng, lat):
 *   lng = a * x + b * y + c
 *   lat = d * x + e * y + f
 */
export interface AffineTransform {
  // Longitude coefficients
  a: number; // x coefficient for longitude
  b: number; // y coefficient for longitude
  c: number; // constant for longitude

  // Latitude coefficients
  d: number; // x coefficient for latitude
  e: number; // y coefficient for latitude
  f: number; // constant for latitude
}

/**
 * Solve for affine transformation matrix using least-squares
 *
 * Given N GCPs with known (pixel, gps) pairs, solves the overdetermined system:
 *   lng_i = a * x_i + b * y_i + c
 *   lat_i = d * x_i + e * y_i + f
 *
 * For 3 GCPs, this is an exact solution.
 * For more GCPs, uses least-squares to minimize total error.
 *
 * Uses the normal equations: (A^T * A) * coeffs = A^T * b
 */
export function solveAffineTransform(gcps: GCP[]): AffineTransform {
  if (gcps.length < 3) {
    throw new Error("Need at least 3 GCPs to solve affine transformation");
  }

  const n = gcps.length;

  // Build the design matrix A and target vectors bLng, bLat
  // A = [[x1, y1, 1], [x2, y2, 1], ...]
  // bLng = [lng1, lng2, ...]
  // bLat = [lat1, lat2, ...]

  // For least squares: (A^T * A)^-1 * A^T * b

  // Calculate A^T * A (3x3 matrix)
  let sumX2 = 0,
    sumY2 = 0,
    sumXY = 0,
    sumX = 0,
    sumY = 0;
  for (const gcp of gcps) {
    const x = gcp.pixel[0];
    const y = gcp.pixel[1];
    sumX2 += x * x;
    sumY2 += y * y;
    sumXY += x * y;
    sumX += x;
    sumY += y;
  }

  // A^T * A matrix:
  // [[sumX2, sumXY, sumX],
  //  [sumXY, sumY2, sumY],
  //  [sumX,  sumY,  n   ]]

  // Calculate A^T * bLng and A^T * bLat
  let sumXLng = 0,
    sumYLng = 0,
    sumLng = 0;
  let sumXLat = 0,
    sumYLat = 0,
    sumLat = 0;
  for (const gcp of gcps) {
    const x = gcp.pixel[0];
    const y = gcp.pixel[1];
    const lng = gcp.gps.lng;
    const lat = gcp.gps.lat;

    sumXLng += x * lng;
    sumYLng += y * lng;
    sumLng += lng;

    sumXLat += x * lat;
    sumYLat += y * lat;
    sumLat += lat;
  }

  // Solve the 3x3 linear system using Cramer's rule or direct inversion
  // Matrix M = A^T * A
  const M = [
    [sumX2, sumXY, sumX],
    [sumXY, sumY2, sumY],
    [sumX, sumY, n],
  ];

  // Calculate determinant of 3x3 matrix
  const det =
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

  if (Math.abs(det) < 1e-10) {
    throw new Error(
      "GCPs are collinear or degenerate - cannot solve affine transformation",
    );
  }

  // Calculate inverse of M using adjugate / determinant
  const invDet = 1 / det;
  const Minv = [
    [
      (M[1][1] * M[2][2] - M[1][2] * M[2][1]) * invDet,
      (M[0][2] * M[2][1] - M[0][1] * M[2][2]) * invDet,
      (M[0][1] * M[1][2] - M[0][2] * M[1][1]) * invDet,
    ],
    [
      (M[1][2] * M[2][0] - M[1][0] * M[2][2]) * invDet,
      (M[0][0] * M[2][2] - M[0][2] * M[2][0]) * invDet,
      (M[0][2] * M[1][0] - M[0][0] * M[1][2]) * invDet,
    ],
    [
      (M[1][0] * M[2][1] - M[1][1] * M[2][0]) * invDet,
      (M[0][1] * M[2][0] - M[0][0] * M[2][1]) * invDet,
      (M[0][0] * M[1][1] - M[0][1] * M[1][0]) * invDet,
    ],
  ];

  // Solve for longitude coefficients: [a, b, c] = Minv * [sumXLng, sumYLng, sumLng]
  const a = Minv[0][0] * sumXLng + Minv[0][1] * sumYLng + Minv[0][2] * sumLng;
  const b = Minv[1][0] * sumXLng + Minv[1][1] * sumYLng + Minv[1][2] * sumLng;
  const c = Minv[2][0] * sumXLng + Minv[2][1] * sumYLng + Minv[2][2] * sumLng;

  // Solve for latitude coefficients: [d, e, f] = Minv * [sumXLat, sumYLat, sumLat]
  const d = Minv[0][0] * sumXLat + Minv[0][1] * sumYLat + Minv[0][2] * sumLat;
  const e = Minv[1][0] * sumXLat + Minv[1][1] * sumYLat + Minv[1][2] * sumLat;
  const f = Minv[2][0] * sumXLat + Minv[2][1] * sumYLat + Minv[2][2] * sumLat;

  return { a, b, c, d, e, f };
}

/**
 * Convert pixel coordinates to GPS using affine transformation
 */
export function pixelToGpsAffine(
  x: number,
  y: number,
  transform: AffineTransform,
): { lat: number; lng: number } {
  const lng = transform.a * x + transform.b * y + transform.c;
  const lat = transform.d * x + transform.e * y + transform.f;
  return { lat, lng };
}

/**
 * Convert GPS coordinates to pixel using inverse affine transformation
 *
 * Inverse of:
 *   lng = a * x + b * y + c
 *   lat = d * x + e * y + f
 *
 * Solving for x, y:
 *   x = (e * (lng - c) - b * (lat - f)) / (a * e - b * d)
 *   y = (a * (lat - f) - d * (lng - c)) / (a * e - b * d)
 */
export function gpsToPixelAffine(
  lat: number,
  lng: number,
  transform: AffineTransform,
): [number, number] {
  const { a, b, c, d, e, f } = transform;
  const det = a * e - b * d;

  if (Math.abs(det) < 1e-15) {
    throw new Error("Affine transformation is degenerate - cannot invert");
  }

  const x = (e * (lng - c) - b * (lat - f)) / det;
  const y = (a * (lat - f) - d * (lng - c)) / det;

  return [Math.round(x), Math.round(y)];
}

/**
 * Calculate affine transformation errors for validation
 */
export interface AffineCalibrationResult {
  transform: AffineTransform;
  errors: GCPError[];
  rmsePixels: number;
  rmseMeters: number;
  maxErrorPixels: number;
  maxErrorBuilding: string;
}

/**
 * Calculate errors using affine transformation
 */
export function calculateAffineErrors(
  gcps: GCP[],
  transform: AffineTransform,
): GCPError[] {
  return gcps.map((gcp) => {
    // Compute what pixel position the GPS coords would map to with this transform
    const computedPixel = gpsToPixelAffine(gcp.gps.lat, gcp.gps.lng, transform);

    // Compute what GPS coords the pixel position would map to
    const computedGps = pixelToGpsAffine(gcp.pixel[0], gcp.pixel[1], transform);

    // Calculate pixel error
    const pixelDx = computedPixel[0] - gcp.pixel[0];
    const pixelDy = computedPixel[1] - gcp.pixel[1];
    const pixelError = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);

    // Calculate GPS error
    const gpsDLat = computedGps.lat - gcp.gps.lat;
    const gpsDLng = computedGps.lng - gcp.gps.lng;
    const gpsTotal = Math.sqrt(gpsDLat * gpsDLat + gpsDLng * gpsDLng);

    return {
      id: gcp.id,
      name: gcp.name,
      expectedPixel: gcp.pixel,
      computedPixel,
      pixelError,
      gpsError: {
        lat: gpsDLat,
        lng: gpsDLng,
        total: gpsTotal,
      },
    };
  });
}

/**
 * Run affine calibration using GCPs
 */
export function runAffineCalibration(
  gcps: GCP[] = PRIMARY_GCPS,
): AffineCalibrationResult {
  // Solve for affine transformation
  const transform = solveAffineTransform(gcps);

  // Calculate errors
  const errors = calculateAffineErrors(gcps, transform);

  // Calculate RMSE
  const rmsePixels =
    errors.length > 0
      ? Math.sqrt(
          errors.reduce(
            (sum, err) => sum + err.pixelError * err.pixelError,
            0,
          ) / errors.length,
        )
      : 0;

  // Approximate meters using latitude conversion
  const LAT_DEG_TO_METERS = 110900;
  const LNG_DEG_TO_METERS = 92700;
  const avgMetersPerPixel =
    ((Math.abs(transform.e) * GCP_MAP_HEIGHT * LAT_DEG_TO_METERS) /
      GCP_MAP_HEIGHT +
      (Math.abs(transform.a) * GCP_MAP_WIDTH * LNG_DEG_TO_METERS) /
        GCP_MAP_WIDTH) /
    2;
  const rmseMeters = rmsePixels * avgMetersPerPixel;

  // Find max error
  const maxError = errors.reduce(
    (max, err) =>
      err.pixelError > max.error ? { error: err.pixelError, id: err.id } : max,
    { error: 0, id: "" },
  );

  return {
    transform,
    errors,
    rmsePixels,
    rmseMeters,
    maxErrorPixels: maxError.error,
    maxErrorBuilding: maxError.id,
  };
}

/**
 * Format affine calibration report
 */
export function formatAffineCalibrationReport(
  result: AffineCalibrationResult,
): string {
  const { transform } = result;
  const lines: string[] = [
    "=== Affine Transformation Calibration Report ===",
    "",
    "Transformation Coefficients:",
    `  lng = ${transform.a.toExponential(6)} * x + ${transform.b.toExponential(6)} * y + ${transform.c.toFixed(7)}`,
    `  lat = ${transform.d.toExponential(6)} * x + ${transform.e.toExponential(6)} * y + ${transform.f.toFixed(7)}`,
    "",
    "Error Metrics:",
    `  RMSE: ${result.rmsePixels.toFixed(2)} pixels (~${result.rmseMeters.toFixed(1)}m)`,
    `  Max Error: ${result.maxErrorPixels.toFixed(2)} pixels (${result.maxErrorBuilding})`,
    "",
    "Per-GCP Errors:",
  ];

  for (const err of result.errors) {
    lines.push(
      `  ${err.id.padEnd(12)} ${err.pixelError.toFixed(1).padStart(6)}px  ` +
        `(expected: [${err.expectedPixel[0]}, ${err.expectedPixel[1]}], ` +
        `computed: [${err.computedPixel[0]}, ${err.computedPixel[1]}])`,
    );
  }

  return lines.join("\n");
}

/**
 * Get affine transform as TypeScript code for copy-paste
 */
export function getAffineTransformAsCode(transform: AffineTransform): string {
  return `const AFFINE_TRANSFORM: AffineTransform = {
  a: ${transform.a},
  b: ${transform.b},
  c: ${transform.c},
  d: ${transform.d},
  e: ${transform.e},
  f: ${transform.f},
};`;
}

/**
 * Pre-computed affine transformation from PRIMARY_GCPS
 * This is calculated at build time to avoid runtime computation
 */
export const PRECOMPUTED_AFFINE_TRANSFORM: AffineTransform = (() => {
  try {
    return solveAffineTransform(PRIMARY_GCPS);
  } catch {
    // Fallback to identity-like transform if computation fails
    // This should never happen with valid GCPs
    return {
      a: (151.1251008 - 151.1055008) / GCP_MAP_WIDTH,
      b: 0,
      c: 151.1055008,
      d: 0,
      e: -(-33.7654178 - -33.7832653) / GCP_MAP_HEIGHT,
      f: -33.7654178,
    };
  }
})();

/**
 * Convenience function: pixel to GPS using precomputed transform
 */
export function pixelToGps(x: number, y: number): { lat: number; lng: number } {
  return pixelToGpsAffine(x, y, PRECOMPUTED_AFFINE_TRANSFORM);
}

/**
 * Convenience function: GPS to pixel using precomputed transform
 */
export function gpsToPixel(lat: number, lng: number): [number, number] {
  return gpsToPixelAffine(lat, lng, PRECOMPUTED_AFFINE_TRANSFORM);
}
