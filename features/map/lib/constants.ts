// GPS bounds for checking if user is on campus (approximate)
export const GPS_CAMPUS_BOUNDS = {
  south: -33.7833,
  north: -33.7654,
  west: 151.1055,
  east: 151.1251,
};

// Campus image path (versioned to bust stale caches)
export const MAP_ASSET_VERSION = "2026-02-07-1";
export const CAMPUS_IMAGE_URL = `/maps/raster/mq-campus.png?v=${MAP_ASSET_VERSION}`;

// Real GPS coordinates for campus center (used ONLY for geolocation comparison)
export const CAMPUS_CENTRE_GPS = { lat: -33.7742, lng: 151.1127 };

// Map dimensions from VRT file (4678x3307 pixels)
export const MAP_DIMS = { width: 4678, height: 3307 };

// Pixel-based bounds for CRS.Simple: [[south, west], [north, east]]
// CRS.Simple: Y increases UPWARD from bottom-left origin
// Image: Y increases DOWNWARD from top-left origin
// Bounds are [lat, lng] where lat=Y, lng=X
// South-West corner: image [0, height] → CRS.Simple [height - height, 0] = [0, 0]
// North-East corner: image [width, 0] → CRS.Simple [height - 0, width] = [height, width]
export const PIXEL_BOUNDS: [[number, number], [number, number]] = [
  [0, 0], // South-West corner [lat=0, lng=0]
  [MAP_DIMS.height, MAP_DIMS.width], // North-East corner [lat=height, lng=width]
];

// Campus center in pixel coordinates (for initial view)
export const CAMPUS_CENTER_PIXEL: [number, number] = [
  MAP_DIMS.height / 2,
  MAP_DIMS.width / 2,
];
