// GPS bounds for checking if user is on campus (approximate)
export const GPS_CAMPUS_BOUNDS = {
  south: -33.7833,
  north: -33.7654,
  west: 151.1055,
  east: 151.1251,
};

// Campus image path
export const CAMPUS_IMAGE_URL = '/maps/raster/mq-campus.png';

// Real GPS coordinates for campus center (used ONLY for geolocation comparison)
export const CAMPUS_CENTRE_GPS = { lat: -33.7742, lng: 151.1127 };

// Map dimensions from VRT file (4678x3307 pixels)
export const MAP_DIMS = { width: 4678, height: 3307 };

// Pixel-based bounds for CRS.Simple: [[minY, minX], [maxY, maxX]]
// In CRS.Simple, bounds are [y, x] format
export const PIXEL_BOUNDS: [[number, number], [number, number]] = [
  [0, 0], // Bottom-left corner (origin)
  [MAP_DIMS.height, MAP_DIMS.width], // Top-right corner
];

// Campus center in pixel coordinates (for initial view)
export const CAMPUS_CENTER_PIXEL: [number, number] = [MAP_DIMS.height / 2, MAP_DIMS.width / 2];
