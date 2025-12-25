import type { Borough, Location } from '../types';
import { seededRandom } from './seededRandom';

// Accurate borough polygons traced from NYC official boundaries
// Coordinates are [lat, lng] pairs
// Source: Manually traced from Google Maps following actual borough lines
export const BOROUGH_POLYGONS: Record<Borough, [number, number][]> = {
  // Manhattan- manually traced
  manhattan: [
    [40.68126433858643, -74.0291517567261], 
    [40.76149713162689, -74.01029837708306],
    [40.87864424060163, -73.92723757376679],
    [40.87240746885964, -73.90781521796612],
    [40.836275044173334, -73.93213736923651],
    [40.807000325663154, -73.93282979929154],
    [40.80960958473422, -73.9342233763734],
    [40.806477652330976, -73.93282926503568],
    [40.79546675057071, -73.91140708962105],
    [40.7808201182952, -73.93011959754004],
    [40.77821465669549, -73.93909586153207],
    [40.771929716083044, -73.93634626673534],
    [40.771933065673096, -73.93841285710289],
    [40.73845164565836, -73.96540154779102],
    [40.73531264440969, -73.96816775356079],
    [40.70864842394448, -73.97375303941509],
    [40.7096926327299, -73.97305989754712],
    [40.70460573396007, -74.00046585504396],
    [40.68715237163914, -74.0100793764405]
  ],

  // Brooklyn - from Greenpoint down to Coney Island and across to Bay Ridge
  brooklyn: [
    [40.73629386897676, -73.96444230590834],
    [40.740634030826925, -73.95802580359617],
    [40.73671183072771, -73.94005673037316],
    [40.731358453815425, -73.93749275164627],
    [40.72892269601986, -73.92979131085069],
    [40.68316356477681, -73.897149089712],
    [40.693858436821436, -73.86887013699231],
    [40.64519449519324, -73.85284500542429],
    [40.62426791765585, -73.88814732333088],
    [40.57751653986169, -73.8734816946647],
    [40.56858318096941, -74.00890802249643],
    [40.625401945100826, -74.05112935901697],
    [40.66293339266549, -74.01846336291977],
    [40.68020899154909, -74.02044337137328]
  ],

  // Queens - manually traced
  queens: [
    [40.73862099476879, -73.96910413124213],
    [40.770419420374125, -73.9414112108164],
    [40.78011889869474, -73.93573007235709],
    [40.77954149502072, -73.92717660653416],
    [40.791981443282545, -73.91012824783112],
    [40.78333245534953, -73.87455781239036],
    [40.7979123742779, -73.85676458969195],
    [40.80003799689737, -73.77919009530689],
    [40.75354920142421, -73.70116726796496],
    [40.751935330811484, -73.69974315594015],
    [40.72986499517277, -73.69766392509482],
    [40.7239811702012, -73.72824472475571],
    [40.596900853721, -73.73482065264014],
    [40.53607200309264, -73.94324422179844],
    [40.55599589386053, -73.9532001939263],
    [40.59272332046096, -73.84615472839401],
    [40.6955247474601, -73.8717315901404],
    [40.68417623489565, -73.89582891222894],
    [40.72834785379519, -73.9300173909308],
    [40.729959112167016, -73.93783755625022],
    [40.73642022673035, -73.94282669274806],
    [40.74022234336197, -73.95780201616941]
  ],

  // Bronx - manually traced
  bronx: [
    [40.91447105119144, -73.9130607825868],
    [40.901088933509044, -73.85969071239772],
    [40.90712757030269, -73.85328114297972],
    [40.904386633175825, -73.84085957793967],
    [40.89439239027338, -73.83845632445005],
    [40.88045904133593, -73.78063942323618],
    [40.881064651833306, -73.77903275722456],
    [40.8398061546862, -73.7778967292317],
    [40.84011059421668, -73.77909966092358],
    [40.80371416241037, -73.78716885661343],
    [40.802551320177955, -73.85649789962453],
    [40.78284056242357, -73.87334286097185],
    [40.798917255377035, -73.92221673488268],
    [40.808923708164365, -73.93464291181544],
    [40.83469903837089, -73.93424982908125],
    [40.835605737466395, -73.93464869981773],
    [40.87140083691761, -73.91020540602685],
    [40.878398708898644, -73.9286652653061]
  ],

  // Staten Island - manually traced
  staten_island: [
    [40.64626394680467, -74.1775395310462],
    [40.64296956509763, -74.12596268428277],
    [40.650791816041654, -74.07269398030843],
    [40.62451181921219, -74.06964714338302],
    [40.600487919053485, -74.05062154882371],
    [40.60015949511812, -74.0510555502427],
    [40.527857179329665, -74.13473971115262],
    [40.49236994086907, -74.2514890246737],
    [40.50944558677322, -74.25714438040123],
    [40.52294403815129, -74.24461452095309],
    [40.54595712500419, -74.24895404240392],
    [40.557145803393496, -74.22473072265875],
    [40.55910964528681, -74.21477279465734],
    [40.59364997898164, -74.20525432225011],
    [40.59792510281852, -74.20092339980931],
    [40.632046642841516, -74.20090735998758]
  ],
};

// Check if a point is inside a polygon using ray-casting algorithm
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];

    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Get bounding box for a polygon
function getBoundingBox(polygon: [number, number][]): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const lats = polygon.map(p => p[0]);
  const lngs = polygon.map(p => p[1]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

// Counter for endless mode to ensure unique seeds
let endlessSeedCounter = 0;

// Generate a random point within a borough
export function generateRandomLocation(borough: Borough, rng: () => number): Location {
  const polygon = BOROUGH_POLYGONS[borough];
  const bounds = getBoundingBox(polygon);

  // Keep trying until we get a point inside the polygon
  let attempts = 0;
  while (attempts < 1000) {
    const lat = bounds.minLat + rng() * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + rng() * (bounds.maxLng - bounds.minLng);

    if (isPointInPolygon(lat, lng, polygon)) {
      return { lat, lng, borough };
    }
    attempts++;
  }

  // Fallback to centroid if we can't find a valid point (shouldn't happen with good polygons)
  console.warn(`Failed to find point in ${borough} after 1000 attempts, using centroid`);
  const centroidLat = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const centroidLng = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
  return { lat: centroidLat, lng: centroidLng, borough };
}

// Generate daily locations (12 total: 3 per borough, no Staten Island)
export function generateDailyLocations(dateString: string): Location[] {
  const rng = seededRandom(`newyawkr-${dateString}`);
  const boroughs: Borough[] = ['manhattan', 'brooklyn', 'queens', 'bronx'];
  const locations: Location[] = [];

  // 3 locations per borough
  for (const borough of boroughs) {
    for (let i = 0; i < 3; i++) {
      locations.push(generateRandomLocation(borough, rng));
    }
  }

  // Shuffle the locations so boroughs aren't grouped
  for (let i = locations.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [locations[i], locations[j]] = [locations[j], locations[i]];
  }

  console.log('generateDailyLocations: Generated locations for', dateString, locations);
  return locations;
}

// Generate endless mode location with guaranteed unique seed
export function generateEndlessLocation(boroughs: Borough[]): Location {
  const seed = `endless-${Date.now()}-${endlessSeedCounter++}`;
  const rng = seededRandom(seed);
  const borough = boroughs[Math.floor(rng() * boroughs.length)];
  return generateRandomLocation(borough, rng);
}

// Get today's date string in YYYY-MM-DD format
export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
