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
  // This is a rough parser, assuming standard formatting
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
  const buildings = extractData();
  console.log(`\n🔍 AUDIT: Found ${buildings.length} buildings with valid GPS & Pixel data.`);

  // --- 1. OPTIMIZE LONGITUDE (X-AXIS) ---
  // Formula: Lng = Slope * x + Intercept
  // Where Intercept = West Bound
  // And Slope = (East - West) / Width
  const lngReg = linearRegression(
    buildings.map((b) => b.x),
    buildings.map((b) => b.lng),
  );

  const calculatedWest = lngReg.intercept;
  const calculatedEast = lngReg.slope * MAP_WIDTH + calculatedWest;

  // --- 2. OPTIMIZE LATITUDE (Y-AXIS) ---
  // Formula: Lat = Slope * y + Intercept
  // Note: Y grows DOWN, Lat grows UP. So slope should be negative.
  // Intercept = North Bound (at y=0)
  // Lat at Height = South Bound
  const latReg = linearRegression(
    buildings.map((b) => b.y),
    buildings.map((b) => b.lat),
  );

  const calculatedNorth = latReg.intercept;
  const calculatedSouth = latReg.slope * MAP_HEIGHT + calculatedNorth;

  console.log('\n📐 OPTIMAL CALCULATED BOUNDS (Based on ' + buildings.length + ' points):');
  console.log(`   North: ${calculatedNorth.toFixed(6)}`);
  console.log(`   South: ${calculatedSouth.toFixed(6)}`);
  console.log(`   West:  ${calculatedWest.toFixed(6)}`);
  console.log(`   East:  ${calculatedEast.toFixed(6)}`);

  // --- 3. VERIFY ACCURACY ---
  console.log('\n📊 ACCURACY CHECK (Difference between Real GPS and Calculated GPS):');
  let totalError = 0;
  let maxError = 0;
  let maxErrorBuilding = '';

  buildings.forEach((b) => {
    // Project pixel back to GPS using NEW bounds
    const xNorm = b.x / MAP_WIDTH;
    const yNorm = b.y / MAP_HEIGHT;

    const projLng = calculatedWest + xNorm * (calculatedEast - calculatedWest);
    const projLat = calculatedNorth - yNorm * (calculatedNorth - calculatedSouth);

    const dist = getDistanceFromLatLonInM(b.lat, b.lng, projLat, projLng);
    totalError += dist;

    if (dist > maxError) {
      maxError = dist;
      maxErrorBuilding = b.id;
    }

    // Log significant errors
    if (dist > 30) {
      console.log(`   ⚠️  ${b.id}: ${dist.toFixed(1)}m off`);
    }
  });

  const avgError = totalError / buildings.length;
  console.log(`\n✅ RESULTS:`);
  console.log(`   Average Error: ${avgError.toFixed(2)} meters`);
  console.log(`   Max Error:     ${maxError.toFixed(2)} meters (${maxErrorBuilding})`);

  if (avgError < 20) {
    console.log('\n✨ Calibration Status: EXCELLENT');
  } else if (avgError < 50) {
    console.log('\n⚠️ Calibration Status: ACCEPTABLE (Some drift)');
  } else {
    console.log('\n❌ Calibration Status: POOR (Requires manual check of outliers)');
  }
}

audit();
