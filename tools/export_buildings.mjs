import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUILDING_PIXEL_OFFSET_X,
  buildings,
  MAP_CONFIG,
} from '../features/map/lib/buildings.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const syllabusRoot = path.resolve(__dirname, '..');
const flutterRoot = path.resolve(syllabusRoot, '../mq_navigation');

const flutterDataDir = path.join(flutterRoot, 'assets', 'data');
const flutterMapsDir = path.join(flutterRoot, 'assets', 'maps');
const outputBuildingsPath = path.join(flutterDataDir, 'buildings.json');
const outputOverlayMetaPath = path.join(
  flutterDataDir,
  'campus_overlay_meta.json',
);
const sourceOverlayPath = path.join(
  syllabusRoot,
  'public',
  'maps',
  'raster',
  'mq-campus.png',
);
const outputOverlayPath = path.join(flutterMapsDir, 'mq-campus.png');

const normalizedBuildings = buildings.map((building) => ({
  id: building.id,
  code: building.id,
  name: building.name,
  description: building.description ?? null,
  address: building.address ?? null,
  category: building.category ?? 'other',
  latitude: building.location?.lat ?? null,
  longitude: building.location?.lng ?? null,
  entranceLatitude: building.entranceLocation?.lat ?? null,
  entranceLongitude: building.entranceLocation?.lng ?? null,
  googlePlaceId: building.googlePlaceId ?? null,
  campusX: building.position?.[0] ?? null,
  campusY: building.position?.[1] ?? null,
  aliases: building.aliases ?? [],
  tags: building.tags ?? [],
  searchTokens: building.searchTokens ?? [],
  gridRef: building.gridRef ?? null,
  levels: building.levels ?? null,
  wheelchair: building.wheelchair ?? false,
}));

const campusOverlayMeta = {
  imageAsset: 'assets/maps/mq-campus.png',
  width: MAP_CONFIG.width,
  height: MAP_CONFIG.height,
  pixelOffsetX: BUILDING_PIXEL_OFFSET_X,
  gpsBounds: MAP_CONFIG.bounds,
  initialZoom: -0.6,
  minZoom: -1.5,
  maxZoom: 1.8,
};

await mkdir(flutterDataDir, { recursive: true });
await mkdir(flutterMapsDir, { recursive: true });

await writeFile(
  outputBuildingsPath,
  `${JSON.stringify(normalizedBuildings, null, 2)}\n`,
  'utf8',
);
await writeFile(
  outputOverlayMetaPath,
  `${JSON.stringify(campusOverlayMeta, null, 2)}\n`,
  'utf8',
);
await copyFile(sourceOverlayPath, outputOverlayPath);

console.log(
  `Exported ${normalizedBuildings.length} buildings, overlay metadata, and raster image to ${flutterRoot}`,
);
