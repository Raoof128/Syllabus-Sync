/**
 * Debug script to test GCP calibration with real coordinates
 * Run with: npx tsx scripts/debug-calibration.ts
 */

// Import the calibration module
import {
  gpsToPixelCalibrated,
  compareTransformMethods,
  getCalibrationDiagnostics,
  GROUND_CONTROL_POINTS,
} from '../lib/map/geospatialCalibration';
import { MAP_CONFIG } from '../lib/map/buildings';

// Your live location coordinates (Library)
const LIVE_LOCATION = {
  lat: -33.775621,
  lng: 151.113441,
  description: '16 Macquarie Walk (near Library)',
};

console.log('='.repeat(70));
console.log('GCP CALIBRATION DEBUG REPORT (AFFINE)');
console.log('='.repeat(70));
console.log(`\nTest Location: ${LIVE_LOCATION.description}`);
console.log(`GPS: ${LIVE_LOCATION.lat}, ${LIVE_LOCATION.lng}\n`);

// 1. Get calibration diagnostics
console.log('-'.repeat(70));
console.log('1. CALIBRATION DIAGNOSTICS');
console.log('-'.repeat(70));

const diagnostics = getCalibrationDiagnostics();
console.log(`GCP Count: ${diagnostics.gcpCount}`);
console.log(`Method:  ${diagnostics.method}`);
console.log(
  `RMSE:    ${diagnostics.rmsePixels.toFixed(2)} pixels (~${diagnostics.rmseMeters.toFixed(2)}m)`,
);

console.log('\nGCP Residuals (error per control point):');
diagnostics.gcpResiduals.forEach((r) => {
  const gcp = GROUND_CONTROL_POINTS.find((g) => g.id === r.id);
  console.log(
    `  ${r.id.padEnd(15)} error: ${r.error.toFixed(1).padStart(6)}px  (dx: ${r.dx.toFixed(1)}, dy: ${r.dy.toFixed(1)}) - ${gcp?.name}`,
  );
});

// 2. Compare transformation methods
console.log('\n' + '-'.repeat(70));
console.log('2. TRANSFORMATION COMPARISON');
console.log('-'.repeat(70));

const comparison = compareTransformMethods(LIVE_LOCATION.lat, LIVE_LOCATION.lng);
console.log(
  `\nNaive Linear (Bound-based): pixel [${comparison.linear[0]}, ${comparison.linear[1]}]`,
);
console.log(
  `Affine (GCP-Optimized):     pixel [${comparison.gcpOptimized[0]}, ${comparison.gcpOptimized[1]}]`,
);
console.log(
  `\nOffset/Correction: ${comparison.offsetPixels.toFixed(1)} pixels (~${comparison.offsetMeters.toFixed(1)}m)`,
);

// 3. Calibrated result
console.log('\n' + '-'.repeat(70));
console.log('3. CALIBRATED RESULT');
console.log('-'.repeat(70));

const result = gpsToPixelCalibrated(LIVE_LOCATION.lat, LIVE_LOCATION.lng);
console.log(`\nPixel Position: [${result.pixel[0]}, ${result.pixel[1]}]`);
console.log(`CRS.Simple: { lat: ${result.crsSimple.lat}, lng: ${result.crsSimple.lng} }`);
console.log(`On Campus: ${result.isOnCampus}`);
console.log(`Accuracy: ±${result.accuracy.toFixed(1)} pixels`);

// 4. Compare with nearby GCPs
console.log('\n' + '-'.repeat(70));
console.log('4. DISTANCE FROM NEARBY GCPS');
console.log('-'.repeat(70));

const libraryGcp = GROUND_CONTROL_POINTS.find((g) => g.id === 'GCP_LIBRARY')!;
const distFromLibrary = Math.sqrt(
  Math.pow(result.pixel[0] - libraryGcp.pixel[0], 2) +
    Math.pow(result.pixel[1] - libraryGcp.pixel[1], 2),
);
const metersPerPixel = 2000 / MAP_CONFIG.width;

console.log(`\nDistance from Library GCP:`);
console.log(`  Pixel: [${libraryGcp.pixel[0]}, ${libraryGcp.pixel[1]}] (GCP)`);
console.log(`  Your location: [${result.pixel[0]}, ${result.pixel[1]}]`);
console.log(
  `  Distance: ${distFromLibrary.toFixed(1)} pixels (~${(distFromLibrary * metersPerPixel).toFixed(1)}m)`,
);

// 5. Recommendations
console.log('\n' + '-'.repeat(70));
console.log('5. STATUS');
console.log('-'.repeat(70));

if (diagnostics.rmsePixels < 50) {
  console.log('\n✅ Calibration is HEALTHY and ACCURATE.');
} else {
  console.log('\n⚠️  Calibration RMSE is high. Check for outlier GCPs.');
}

console.log('\n' + '='.repeat(70));
console.log('END OF REPORT');
console.log('='.repeat(70) + '\n');
