import { useEffect, useRef, useState } from 'react';
import type { Borough, Location } from '../types';
import { BOROUGH_POLYGONS, generateRandomLocation } from '../utils/locations';
import { seededRandom } from '../utils/seededRandom';

const STORAGE_KEY = 'newyawkr-daily-progress';

// Get CSS variable value for use in Google Maps API
function getCSSColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

const BOROUGH_COLORS: Record<Borough, string> = {
  manhattan: 'var(--color-manhattan)',
  brooklyn: 'var(--color-brooklyn)',
  queens: 'var(--color-queens)',
  bronx: 'var(--color-bronx)',
  staten_island: 'var(--color-staten-island)',
};

// Get resolved colors for Google Maps (which needs actual hex values)
function getBoroughColor(borough: Borough): string {
  const varMap: Record<Borough, string> = {
    manhattan: '--color-manhattan',
    brooklyn: '--color-brooklyn',
    queens: '--color-queens',
    bronx: '--color-bronx',
    staten_island: '--color-staten-island',
  };
  return getCSSColor(varMap[borough]);
}

interface StreetViewTestResult {
  location: Location;
  hasStreetView: boolean;
  actualLocation?: { lat: number; lng: number };
  distance?: number;
}

interface DevModeProps {
  onClose: () => void;
}

// Get bounding box from polygon
function getBoundsFromPolygon(polygon: [number, number][]): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const lats = polygon.map(p => p[0]);
  const lngs = polygon.map(p => p[1]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

// Calculate distance between two points in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DevMode({ onClose }: DevModeProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [sampleCount, setSampleCount] = useState(100);
  const [showBounds, setShowBounds] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedPoints, setValidatedPoints] = useState<{ lat: number; lng: number; borough: Borough; googleBorough: string | null }[]>([]);
  const [streetViewTests, setStreetViewTests] = useState<StreetViewTestResult[]>([]);
  const [isTestingStreetView, setIsTestingStreetView] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const rectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const streetViewMarkersRef = useRef<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -73.9560 },
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: false,
    });
  }, []);

  // Draw bounding boxes
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing
    rectanglesRef.current.forEach(r => r.setMap(null));
    rectanglesRef.current = [];

    if (!showBounds) return;

    // Draw each borough's bounding box
    const boroughs = Object.keys(BOROUGH_POLYGONS) as Borough[];
    for (const borough of boroughs) {
      const bounds = getBoundsFromPolygon(BOROUGH_POLYGONS[borough]);
      const rectangle = new google.maps.Rectangle({
        bounds: {
          north: bounds.maxLat,
          south: bounds.minLat,
          east: bounds.maxLng,
          west: bounds.minLng,
        },
        strokeColor: getBoroughColor(borough),
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: getBoroughColor(borough),
        fillOpacity: 0.05,
        map: googleMapRef.current,
      });
      rectanglesRef.current.push(rectangle);
    }
  }, [showBounds]);

  // Draw actual polygons
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    if (!showPolygons) return;

    // Draw each borough's polygon
    const boroughs = Object.keys(BOROUGH_POLYGONS) as Borough[];
    for (const borough of boroughs) {
      const coords = BOROUGH_POLYGONS[borough].map(([lat, lng]) => ({ lat, lng }));
      const polygon = new google.maps.Polygon({
        paths: coords,
        strokeColor: getBoroughColor(borough),
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: getBoroughColor(borough),
        fillOpacity: 0.2,
        map: googleMapRef.current,
      });
      polygonsRef.current.push(polygon);
    }
  }, [showPolygons]);

  // Update markers when validated points change
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    for (const point of validatedPoints) {
      const isValid = point.googleBorough === null ||
        point.googleBorough.toLowerCase().includes(point.borough.replace('_', ' '));

      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: isValid ? getBoroughColor(point.borough) : getCSSColor('--color-invalid'),
          fillOpacity: isValid ? 0.9 : 0.3,
          strokeColor: isValid ? getCSSColor('--color-marker-stroke') : getCSSColor('--color-invalid-stroke'),
          strokeWeight: 1,
        },
        title: `${point.borough}${point.googleBorough ? ` (Google: ${point.googleBorough})` : ''}`,
      });
      markersRef.current.push(marker);
    }
  }, [validatedPoints]);

  const generateSamples = () => {
    setIsValidating(true);
    setValidatedPoints([]);

    const boroughs = Object.keys(BOROUGH_POLYGONS) as Borough[];
    const samplesPerBorough = Math.floor(sampleCount / boroughs.length);
    const results: { lat: number; lng: number; borough: Borough; googleBorough: string | null }[] = [];

    const rng = seededRandom(`dev-${Date.now()}`);

    for (const borough of boroughs) {
      for (let i = 0; i < samplesPerBorough; i++) {
        const location = generateRandomLocation(borough, rng);
        results.push({
          lat: location.lat,
          lng: location.lng,
          borough,
          googleBorough: null, // Not validated against API
        });
      }
    }

    setValidatedPoints(results);
    setIsValidating(false);
  };

  const validateWithGoogle = async () => {
    if (validatedPoints.length === 0) {
      generateSamples();
      return;
    }

    setIsValidating(true);
    const geocoder = new google.maps.Geocoder();
    const updated = [...validatedPoints];

    for (let i = 0; i < updated.length; i++) {
      const point = updated[i];
      try {
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ location: { lat: point.lat, lng: point.lng } }, (results, status) => {
            if (status === 'OK' && results) {
              resolve(results);
            } else {
              reject(status);
            }
          });
        });

        // Find borough from address components
        const addressComponents = result[0]?.address_components || [];
        const boroughComponent = addressComponents.find(c =>
          c.types.includes('sublocality_level_1') || c.types.includes('political')
        );
        updated[i] = { ...point, googleBorough: boroughComponent?.long_name || 'Unknown' };
      } catch {
        updated[i] = { ...point, googleBorough: 'Error' };
      }

      // Update progressively
      if (i % 5 === 0) {
        setValidatedPoints([...updated]);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    }

    setValidatedPoints(updated);
    setIsValidating(false);
  };

  // Update Street View test markers
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing Street View markers
    streetViewMarkersRef.current.forEach(m => m.setMap(null));
    streetViewMarkersRef.current = [];

    // Add new markers for Street View tests
    for (const test of streetViewTests) {
      // Original location marker
      const originalMarker = new google.maps.Marker({
        position: { lat: test.location.lat, lng: test.location.lng },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: test.hasStreetView ? getCSSColor('--color-success') : getCSSColor('--color-error'),
          fillOpacity: 0.9,
          strokeColor: getCSSColor('--color-marker-stroke'),
          strokeWeight: 2,
        },
        title: `${test.location.borough}: ${test.hasStreetView ? 'Has Street View' : 'No Street View'}${test.distance ? ` (${Math.round(test.distance)}m away)` : ''}`,
      });
      streetViewMarkersRef.current.push(originalMarker);

      // If Street View was found at a different location, draw a line to it
      if (test.hasStreetView && test.actualLocation) {
        const actualMarker = new google.maps.Marker({
          position: test.actualLocation,
          map: googleMapRef.current,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: getCSSColor('--color-primary'),
            fillOpacity: 0.9,
            strokeColor: getCSSColor('--color-marker-stroke'),
            strokeWeight: 1,
          },
          title: `Actual Street View location (${Math.round(test.distance || 0)}m from original)`,
        });
        streetViewMarkersRef.current.push(actualMarker);

        // Draw line between original and actual
        const line = new google.maps.Polyline({
          path: [
            { lat: test.location.lat, lng: test.location.lng },
            test.actualLocation,
          ],
          strokeColor: getCSSColor('--color-primary'),
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map: googleMapRef.current,
        });
        // Store as marker to clean up (it has setMap method)
        streetViewMarkersRef.current.push(line as unknown as google.maps.Marker);
      }
    }
  }, [streetViewTests]);

  const resetDailyProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    alert('Daily progress has been reset. Refresh the page to start a new daily game.');
  };

  const testStreetViewCoverage = async () => {
    setIsTestingStreetView(true);
    setStreetViewTests([]);

    const streetViewService = new google.maps.StreetViewService();
    const results: StreetViewTestResult[] = [];
    const boroughs: Borough[] = ['manhattan', 'brooklyn', 'queens', 'bronx'];
    const rng = seededRandom(`sv-test-${Date.now()}`);

    // Generate 10 random locations (roughly even across boroughs)
    for (let i = 0; i < 10; i++) {
      const borough = boroughs[i % boroughs.length];
      const location = generateRandomLocation(borough, rng);

      try {
        const result = await new Promise<StreetViewTestResult>((resolve) => {
          streetViewService.getPanorama(
            {
              location: { lat: location.lat, lng: location.lng },
              radius: 500, // Same radius as the game uses
              source: google.maps.StreetViewSource.OUTDOOR,
            },
            (data, status) => {
              if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
                const actualLat = data.location.latLng.lat();
                const actualLng = data.location.latLng.lng();
                const distance = calculateDistance(location.lat, location.lng, actualLat, actualLng);
                resolve({
                  location,
                  hasStreetView: true,
                  actualLocation: { lat: actualLat, lng: actualLng },
                  distance,
                });
              } else {
                resolve({
                  location,
                  hasStreetView: false,
                });
              }
            }
          );
        });

        results.push(result);
        setStreetViewTests([...results]); // Update progressively
      } catch {
        results.push({
          location,
          hasStreetView: false,
        });
        setStreetViewTests([...results]);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    setIsTestingStreetView(false);
  };

  const validCount = validatedPoints.filter(p =>
    p.googleBorough === null || p.googleBorough.toLowerCase().includes(p.borough.replace('_', ' '))
  ).length;
  const invalidCount = validatedPoints.length - validCount;
  const hasGoogleValidation = validatedPoints.some(p => p.googleBorough !== null);
  const streetViewSuccessCount = streetViewTests.filter(t => t.hasStreetView).length;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dev Mode - Borough Polygon Validation</h1>
        <button
          onClick={onClose}
          className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Close
        </button>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 border-t border-gray-700 flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showBounds}
            onChange={(e) => setShowBounds(e.target.checked)}
            className="w-4 h-4"
          />
          Bounding Boxes
        </label>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showPolygons}
            onChange={(e) => setShowPolygons(e.target.checked)}
            className="w-4 h-4"
          />
          Polygons
        </label>

        <label className="flex items-center gap-2 text-white">
          Samples:
          <input
            type="number"
            value={sampleCount}
            onChange={(e) => setSampleCount(Math.max(5, Math.min(500, parseInt(e.target.value) || 100)))}
            className="w-20 px-2 py-1 bg-gray-700 rounded text-white"
            min="5"
            max="500"
          />
        </label>

        <button
          onClick={generateSamples}
          disabled={isValidating}
          className={`px-4 py-2 rounded text-white ${
            isValidating ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Generate Samples
        </button>

        <button
          onClick={validateWithGoogle}
          disabled={isValidating}
          className={`px-4 py-2 rounded text-white ${
            isValidating ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isValidating ? 'Validating...' : 'Validate with Google API'}
        </button>

        {validatedPoints.length > 0 && hasGoogleValidation && (
          <div className="text-white">
            <span className="text-green-400">{validCount} valid</span>
            {' / '}
            <span className="text-gray-400">{invalidCount} invalid</span>
            {' '}
            ({Math.round(validCount / (validCount + invalidCount) * 100)}% hit rate)
          </div>
        )}

        {validatedPoints.length > 0 && !hasGoogleValidation && (
          <div className="text-yellow-400">
            {validatedPoints.length} points generated (not validated with API)
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-800 p-4 border-t border-gray-700 flex flex-wrap gap-4">
        {(Object.keys(BOROUGH_COLORS) as Borough[]).map(borough => (
          <div key={borough} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: BOROUGH_COLORS[borough] }}
            />
            <span className="text-white capitalize">{borough.replace('_', ' ')}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-gray-400">Invalid (wrong borough per Google)</span>
        </div>
      </div>

      {/* Street View Testing & Reset */}
      <div className="bg-gray-800 p-4 border-t border-gray-700 flex flex-wrap gap-4 items-center">
        <button
          onClick={resetDailyProgress}
          className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
        >
          Reset Daily Progress
        </button>

        <div className="h-8 w-px bg-gray-600" />

        <button
          onClick={testStreetViewCoverage}
          disabled={isTestingStreetView}
          className={`px-4 py-2 rounded text-white ${
            isTestingStreetView ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isTestingStreetView ? `Testing... (${streetViewTests.length}/10)` : 'Test Street View (10 spots)'}
        </button>

        {streetViewTests.length > 0 && (
          <div className="text-white">
            <span className="text-green-400">{streetViewSuccessCount} with coverage</span>
            {' / '}
            <span className="text-red-400">{streetViewTests.length - streetViewSuccessCount} without</span>
            {streetViewTests.length === 10 && (
              <span className="text-gray-400 ml-2">
                ({Math.round(streetViewSuccessCount / 10 * 100)}% success rate)
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setStreetViewTests([])}
          disabled={streetViewTests.length === 0}
          className={`px-3 py-2 rounded text-white text-sm ${
            streetViewTests.length === 0 ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          Clear SV Tests
        </button>
      </div>

      {/* Street View Test Results Table */}
      {streetViewTests.length > 0 && (
        <div className="bg-gray-800 p-4 border-t border-gray-700 max-h-48 overflow-y-auto">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-1 px-2">#</th>
                <th className="py-1 px-2">Borough</th>
                <th className="py-1 px-2">Original Coords</th>
                <th className="py-1 px-2">Status</th>
                <th className="py-1 px-2">Distance to SV</th>
              </tr>
            </thead>
            <tbody>
              {streetViewTests.map((test, i) => (
                <tr key={i} className={test.hasStreetView ? 'bg-green-900/20' : 'bg-red-900/20'}>
                  <td className="py-1 px-2">{i + 1}</td>
                  <td className="py-1 px-2 capitalize">{test.location.borough}</td>
                  <td className="py-1 px-2 font-mono text-xs">
                    {test.location.lat.toFixed(5)}, {test.location.lng.toFixed(5)}
                  </td>
                  <td className="py-1 px-2">
                    {test.hasStreetView ? (
                      <span className="text-green-400">Found</span>
                    ) : (
                      <span className="text-red-400">Not Found</span>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    {test.distance ? `${Math.round(test.distance)}m` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-700 p-3 text-sm text-gray-300">
        <strong>Polygon Testing:</strong> Points generated within polygon boundaries using ray-casting.
        <strong className="ml-2">Street View Testing:</strong> Green = has coverage within 500m, Red = no coverage. Blue arrows show actual SV location.
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1" />
    </div>
  );
}
