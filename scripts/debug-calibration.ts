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
import { MAP_CONFIG, gpsToPixel, pixelToCrsSimple } from '../lib/map/buildings';

// Your live location coordinates
const LIVE_LOCATION = {
  lat: -33.775621,
  lng: 151.113441,
  description: '16 Macquarie Walk (near Library)',
};

console.log('='.repeat(70));
console.log('GCP CALIBRATION DEBUG REPORT');
console.log('='.repeat(70));
console.log(`\nTest Location: ${LIVE_LOCATION.description}`);
console.log(`GPS: ${LIVE_LOCATION.lat}, ${LIVE_LOCATION.lng}\n`);

// 1. Get calibration diagnostics
console.log('-'.repeat(70));
console.log('1. CALIBRATION DIAGNOSTICS');
console.log('-'.repeat(70));

const diagnostics = getCalibrationDiagnostics();
console.log(`GCP Count: ${diagnostics.gcpCount}`);
console.log(
  `RMSE: ${diagnostics.rmsePixels.toFixed(2)} pixels (~${diagnostics.rmseMeters.toFixed(2)}m)`,
);
console.log('\nOptimized GPS Bounds:');
console.log(`  North: ${diagnostics.optimizedBounds.north.toFixed(6)}`);
console.log(`  South: ${diagnostics.optimizedBounds.south.toFixed(6)}`);
console.log(`  East:  ${diagnostics.optimizedBounds.east.toFixed(6)}`);
console.log(`  West:  ${diagnostics.optimizedBounds.west.toFixed(6)}`);
console.log('\nOriginal GPS Bounds (MAP_CONFIG):');
console.log(`  North: ${diagnostics.originalBounds.north}`);
console.log(`  South: ${diagnostics.originalBounds.south}`);
console.log(`  East:  ${diagnostics.originalBounds.east}`);
console.log(`  West:  ${diagnostics.originalBounds.west}`);

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
  `\nLinear Interpolation (OLD): pixel [${comparison.linear[0]}, ${comparison.linear[1]}]`,
);
console.log(
  `GCP-Optimized (NEW): pixel [${comparison.gcpOptimized[0]}, ${comparison.gcpOptimized[1]}]`,
);
console.log(
  `\nOffset: ${comparison.offsetPixels.toFixed(1)} pixels (~${comparison.offsetMeters.toFixed(1)}m)`,
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

// Google Maps says you're at the Library
console.log(`\nGoogle Maps verification:`);
console.log(`  Library GPS: ${libraryGcp.gps.lat}, ${libraryGcp.gps.lng}`);
console.log(`  Your GPS:    ${LIVE_LOCATION.lat}, ${LIVE_LOCATION.lng}`);
const gpsDistLat = (LIVE_LOCATION.lat - libraryGcp.gps.lat) * 111000; // rough m/deg
const gpsDistLng =
  (LIVE_LOCATION.lng - libraryGcp.gps.lng) * 111000 * Math.cos((LIVE_LOCATION.lat * Math.PI) / 180);
const realDistance = Math.sqrt(gpsDistLat * gpsDistLat + gpsDistLng * gpsDistLng);
console.log(`  Real-world distance: ~${realDistance.toFixed(1)}m`);

// 5. Check if offset correction is working
console.log('\n' + '-'.repeat(70));
console.log('5. OFFSET ANALYSIS');
console.log('-'.repeat(70));

if (comparison.offsetPixels > 20) {
  console.log(`\n⚠️  SIGNIFICANT OFFSET DETECTED: ${comparison.offsetPixels.toFixed(1)} pixels`);
  console.log(
    `   The affine transformation is correcting a ${comparison.offsetMeters.toFixed(1)}m offset.`,
  );
} else {
  console.log(`\n✓ Offset is minimal (${comparison.offsetPixels.toFixed(1)} pixels).`);
  console.log(`  Linear and affine methods give similar results for this location.`);
}

// 6. Suggest GCP improvements if needed
console.log('\n' + '-'.repeat(70));
console.log('6. RECOMMENDATIONS');
console.log('-'.repeat(70));

const maxResidual = Math.max(...diagnostics.gcpResiduals.map((r) => r.error));
const avgResidual =
  diagnostics.gcpResiduals.reduce((sum, r) => sum + r.error, 0) / diagnostics.gcpResiduals.length;

if (diagnostics.rmsePixels > 50) {
  console.log(`\n⚠️  High RMSE (${diagnostics.rmsePixels.toFixed(1)}px). Consider:`);
  console.log(`   - Verifying GCP pixel positions on the map image`);
  console.log(`   - Adding more GCPs in different areas of campus`);
  console.log(`   - Checking for outlier GCPs with high residuals`);
} else if (maxResidual > 100) {
  const outlier = diagnostics.gcpResiduals.find((r) => r.error === maxResidual);
  console.log(`\n⚠️  Outlier GCP detected: ${outlier?.id} (${maxResidual.toFixed(1)}px error)`);
  console.log(`   Consider re-verifying this GCP's pixel position.`);
} else {
  console.log(
    `\n✓ Calibration quality is good (RMSE: ${diagnostics.rmsePixels.toFixed(1)}px, avg: ${avgResidual.toFixed(1)}px)`,
  );
}

console.log('\n' + '='.repeat(70));
console.log('END OF REPORT');
console.log('='.repeat(70) + '\n');
