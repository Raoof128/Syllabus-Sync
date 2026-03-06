export const GOOGLE_ROUTES_FIELD_MASK = [
  'routes.distanceMeters',
  'routes.duration',
  'routes.polyline.encodedPolyline',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.travelMode',
  'routes.legs.steps.navigationInstruction.instructions',
  'routes.legs.steps.transitDetails',
].join(',');
