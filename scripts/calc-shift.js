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

function calculateShift() {
  const b = MAP_CONFIG.bounds;
  const h = MAP_CONFIG.height;
  const w = MAP_CONFIG.width;

  // Current pixels
  const yRange = b.north - b.south;
  const xRange = b.east - b.west;

  const latPerPx = yRange / h;
  const lngPerPx = xRange / w;

  // Error (Calculated - Expected)
  // From previous run: X: 12, Y: -83
  // We calculated 2357, expected 2345 -> Diff +12
  // We calculated 2305, expected 2388 -> Diff -83

  // To fix X (remove 12px):
  // We need the calculated pixel to be lower.
  // X = (lng - west) / xRange * width.
  // Effectively we want to "move the map" underneath the point.
  // If pixel is too high (right), we need to shift the map bounds to the RIGHT (East).
  // So add dLng to both West and East.
  const xShiftPx = 12;
  const lngShift = xShiftPx * lngPerPx;

  // To fix Y (add 83px):
  // Y = (north - lat) / yRange * height.
  // Y is too low (top). We want it higher (down).
  // Increasing Y means increasing the (north - lat) term.
  // So we need to increase North (move map Up).
  // Wait, Y=0 is top.
  // Y=2305 (calculated) vs 2388 (expected).
  // We are "too high up" on the map. We need to be "lower down".
  // This means the map needs to shift UP relative to the GPS point.
  // So North needs to move NORTH (higher lat).
  // Yes, Lat grows Up. Y grows Down.
  // To increase Y (move down), we need to increase (North - Lat).
  // So increase North.
  const yShiftPx = -83; // (Calculated - Expected)
  // Correction: We want to ADD 83 pixels to the result.
  // So we need a positive shift in bounds?
  // Let's just apply the delta directly.
  // If Y is -83 px off (too small), we need to add 83px worth of Lat to the North bound?
  const latShift = Math.abs(yShiftPx) * latPerPx;

  // New Bounds
  // Shift East (positive lng) to reduce X pixel
  const newWest = b.west + lngShift;
  const newEast = b.east + lngShift;

  // Shift South (lower lat)? No, let's look at the formula again.
  // yNorm = (north - lat) / range
  // If we want yNorm to be LARGER (0.72 instead of 0.69)
  // We need (north - lat) to be LARGER.
  // So we must INCREASE North.
  const newNorth = b.north + latShift;
  const newSouth = b.south + latShift;

  console.log('Original Bounds:', b);
  console.log(' Shifts:', { lngShift, latShift });
  console.log('New Bounds:', {
    south: newSouth,
    north: newNorth,
    west: newWest,
    east: newEast,
  });
}

calculateShift();
