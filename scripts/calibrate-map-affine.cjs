const fs = require('fs');
const path = require('path');

// Configuration
const MAP_WIDTH = 4678;
const MAP_HEIGHT = 3307;
const BUILDINGS_PATH = path.join(__dirname, '../lib/map/buildings.ts');

// Haversine formula for distance in meters
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Matrix Inverse for 3x3 (needed for Multiple Regression)
function invert3x3(m) {
  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[2][1] * m[1][2]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  if (Math.abs(det) < 1e-10) return null; // Singular matrix

  const invDet = 1 / det;
  const minv = [];

  minv[0] = [];
  minv[0][0] = (m[1][1] * m[2][2] - m[2][1] * m[1][2]) * invDet;
  minv[0][1] = (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet;
  minv[0][2] = (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet;

  minv[1] = [];
  minv[1][0] = (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet;
  minv[1][1] = (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet;
  minv[1][2] = (m[1][0] * m[0][2] - m[0][0] * m[1][2]) * invDet;

  minv[2] = [];
  minv[2][0] = (m[1][0] * m[2][1] - m[2][0] * m[1][1]) * invDet;
  minv[2][1] = (m[2][0] * m[0][1] - m[0][0] * m[2][1]) * invDet;
  minv[2][2] = (m[0][0] * m[1][1] - m[1][0] * m[0][1]) * invDet;

  return minv;
}

function multiplyMatrixVector(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

// Solve Multiple Linear Regression: y = b0 + b1*x1 + b2*x2
// Returns [b0, b1, b2]
function solveMultipleRegression(inputs, outputs) {
  // Inputs is array of [1, x1, x2] (1 for bias)
  // Outputs is array of y

  // Normal Equation: beta = (X^T * X)^-1 * X^T * Y

  const n = inputs.length;
  // XT * X (3x3 matrix)
  const xtx = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  // XT * Y (3x1 vector)
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

function extractData() {
  const content = fs.readFileSync(BUILDINGS_PATH, 'utf8');
  const buildings = [];
  const blockRegex =
    /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?position:\s*\[(\d+),\s*(\d+)\][\s\S]*?location:\s*\{\s*lat:\s*(-?[\d.]+),\s*lng:\s*([\d.]+)[\s\S]*?\}/g;
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    buildings.push({
      id: match[1],
      x: parseInt(match[2]),
      y: parseInt(match[3]),
      lat: parseFloat(match[4]),
      lng: parseFloat(match[5]),
    });
  }
  return buildings;
}

function audit() {
  let buildings = extractData();
  console.log(`\n🔍 AFFINE AUDIT START: ${buildings.length} total data points.`);

  // --- Filter Outliers ---
  const cleanBuildings = [];
  buildings.forEach((b) => {
    const roughLat = -33.77;
    const roughLng = 151.11;
    const dist = getDistanceFromLatLonInM(b.lat, b.lng, roughLat, roughLng);
    if (dist < 2000) {
      cleanBuildings.push(b);
    }
  });

  // --- NORMALIZE DATA (Critical for precision) ---
  // GPS Bounds (approximate, just for normalization)
  const minLat = Math.min(...cleanBuildings.map((b) => b.lat));
  const maxLat = Math.max(...cleanBuildings.map((b) => b.lat));
  const minLng = Math.min(...cleanBuildings.map((b) => b.lng));
  const maxLng = Math.max(...cleanBuildings.map((b) => b.lng));

  const normalize = (val, min, max) => (val - min) / (max - min);

  const inputs = cleanBuildings.map((b) => [
    1,
    normalize(b.lng, minLng, maxLng),
    normalize(b.lat, minLat, maxLat),
  ]);

  const xParams = solveMultipleRegression(
    inputs,
    cleanBuildings.map((b) => b.x),
  );
  const yParams = solveMultipleRegression(
    inputs,
    cleanBuildings.map((b) => b.y),
  );

  if (!xParams || !yParams) {
    console.error('Failed to solve regression matrix.');
    return;
  }

  console.log('\n📐 NORMALIZED AFFINE COEFFICIENTS:');
  console.log('   // GPS Normalization Bounds:');
  console.log(
    `   const REF_GPS = { minLat: ${minLat}, maxLat: ${maxLat}, minLng: ${minLng}, maxLng: ${maxLng} };`,
  );
  console.log('   // Matrix Coefficients:');
  console.log(
    `   const COEFFS_X = [${xParams[0]}, ${xParams[1]}, ${xParams[2]}]; // [Bias, Lng, Lat]`,
  );
  console.log(
    `   const COEFFS_Y = [${yParams[0]}, ${yParams[1]}, ${yParams[2]}]; // [Bias, Lng, Lat]`,
  );

  // --- VERIFY ACCURACY ---
  console.log('\n📊 ACCURACY CHECK:');
  let totalErrorMeters = 0;
  const PX_TO_M = 0.32;

  cleanBuildings.forEach((b) => {
    const normLng = normalize(b.lng, minLng, maxLng);
    const normLat = normalize(b.lat, minLat, maxLat);

    const predX = xParams[0] + xParams[1] * normLng + xParams[2] * normLat;
    const predY = yParams[0] + yParams[1] * normLng + yParams[2] * normLat;

    const dx = predX - b.x;
    const dy = predY - b.y;
    const distM = Math.sqrt(dx * dx + dy * dy) * PX_TO_M;

    totalErrorMeters += distM;
  });

  const avgErrorM = totalErrorMeters / cleanBuildings.length;
  console.log(`   Average Error: ~${avgErrorM.toFixed(2)} meters`);

  if (avgErrorM < 30) {
    console.log('\n✨ Calibration Status: EXCELLENT');
  }
}

audit();
