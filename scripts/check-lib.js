const MAP_CONFIG = {
  width: 4678,
  height: 3307,
  bounds: {
    south: -33.778701,
    north: -33.768799,
    west: 151.105206,
    east: 151.120932,
  },
};

const LIB = {
  x: 2345,
  y: 2388,
  lat: -33.7756994,
  lng: 151.1131306,
};

function checkError() {
  const { width, height, bounds } = MAP_CONFIG;
  const { south, north, west, east } = bounds;

  // Calculate normalized position (0-1)
  const xNorm = (LIB.lng - west) / (east - west);
  const yNorm = (north - LIB.lat) / (north - south);

  // Convert to pixel coordinates
  const calcX = Math.round(xNorm * width);
  const calcY = Math.round(yNorm * height);

  console.log(`Expected Pixel: [${LIB.x}, ${LIB.y}]`);
  console.log(`Calculated:     [${calcX}, ${calcY}]`);

  const dx = calcX - LIB.x;
  const dy = calcY - LIB.y;
  const distPx = Math.sqrt(dx * dx + dy * dy);
  // Approx 0.32m per pixel
  const distM = distPx * 0.32;

  console.log(`Error Pixels:   ${distPx.toFixed(2)}`);
  console.log(`Error Meters:   ~${distM.toFixed(2)}m`);
  console.log(`Delta:          X: ${dx}, Y: ${dy}`);
}

checkError();
