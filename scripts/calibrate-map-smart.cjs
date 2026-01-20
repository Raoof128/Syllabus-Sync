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

// simple linear regression to find y = mx + c
function linearRegression(x, y) {
  const n = x.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Parse the TypeScript file roughly to get data
function extractData() {
  const content = fs.readFileSync(BUILDINGS_PATH, 'utf8');

  // Regex to find objects with both position and location
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
  console.log(`\n🔍 AUDIT START: ${buildings.length} total data points.`);

  // --- PASS 1: Initial rough calibration to identify outliers ---
  let lngReg = linearRegression(
    buildings.map((b) => b.x),
    buildings.map((b) => b.lng),
  );
  let latReg = linearRegression(
    buildings.map((b) => b.y),
    buildings.map((b) => b.lat),
  );

  let west = lngReg.intercept;
  let east = lngReg.slope * MAP_WIDTH + west;
  let north = latReg.intercept;
  let south = latReg.slope * MAP_HEIGHT + north;

  // Identify outliers based on Pass 1
  const OUTLIER_THRESHOLD = 150; // meters
  const cleanBuildings = [];
  const outliers = [];

  console.log('\n🧹 FILTERING OUTLIERS (Threshold: ' + OUTLIER_THRESHOLD + 'm)...');

  buildings.forEach((b) => {
    const xNorm = b.x / MAP_WIDTH;
    const yNorm = b.y / MAP_HEIGHT;
    const projLng = west + xNorm * (east - west);
    const projLat = north - yNorm * (north - south);
    const dist = getDistanceFromLatLonInM(b.lat, b.lng, projLat, projLng);

    if (dist < OUTLIER_THRESHOLD) {
      cleanBuildings.push(b);
    } else {
      outliers.push({ ...b, error: dist });
      // console.log(`   🗑️  Removing outlier: ${b.id} (${dist.toFixed(0)}m error)`);
    }
  });

  console.log(
    `   -> Removed ${outliers.length} outliers. keeping ${cleanBuildings.length} good points.`,
  );

  // --- PASS 2: Fine-tuned calibration using only clean data ---
  lngReg = linearRegression(
    cleanBuildings.map((b) => b.x),
    cleanBuildings.map((b) => b.lng),
  );
  latReg = linearRegression(
    cleanBuildings.map((b) => b.y),
    cleanBuildings.map((b) => b.lat),
  );

  const calculatedWest = lngReg.intercept;
  const calculatedEast = lngReg.slope * MAP_WIDTH + calculatedWest;
  const calculatedNorth = latReg.intercept;
  const calculatedSouth = latReg.slope * MAP_HEIGHT + calculatedNorth;

  console.log('\n💎 REFINED OPTIMAL BOUNDS (Based on ' + cleanBuildings.length + ' clean points):');
  console.log(`   North: ${calculatedNorth.toFixed(6)}`);
  console.log(`   South: ${calculatedSouth.toFixed(6)}`);
  console.log(`   West:  ${calculatedWest.toFixed(6)}`);
  console.log(`   East:  ${calculatedEast.toFixed(6)}`);

  // --- VERIFY ACCURACY OF REFINED MODEL ---
  let totalError = 0;
  cleanBuildings.forEach((b) => {
    const xNorm = b.x / MAP_WIDTH;
    const yNorm = b.y / MAP_HEIGHT;
    const projLng = calculatedWest + xNorm * (calculatedEast - calculatedWest);
    const projLat = calculatedNorth - yNorm * (calculatedNorth - calculatedSouth);
    const dist = getDistanceFromLatLonInM(b.lat, b.lng, projLat, projLng);
    totalError += dist;
  });

  const avgError = totalError / cleanBuildings.length;
  console.log(`\n✅ FINAL ACCURACY (Clean Data):`);
  console.log(`   Average Error: ${avgError.toFixed(2)} meters`);

  if (avgError < 30) {
    console.log('\n✨ Calibration Status: EXCELLENT');
  }
}

audit();
