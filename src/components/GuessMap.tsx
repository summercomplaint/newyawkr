import { useEffect, useRef, useState } from 'react';

// Get CSS variable value for use in Google Maps API
function getCSSColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

interface GuessMapProps {
  onGuessSelect: (lat: number, lng: number) => void;
  selectedGuess: { lat: number; lng: number } | null;
  onConfirm: () => void;
  disabled?: boolean;
}

// NYC bounds
const NYC_BOUNDS = {
  north: 40.92,
  south: 40.49,
  west: -74.26,
  east: -73.70,
};

const NYC_CENTER = { lat: 40.7128, lng: -73.9560 };

export function GuessMap({ onGuessSelect, selectedGuess, onConfirm, disabled }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onGuessSelectRef = useRef(onGuessSelect);
  const disabledRef = useRef(disabled);
  const [isExpanded, setIsExpanded] = useState(false);
  const initializedRef = useRef(false);

  // Keep refs up to date
  useEffect(() => {
    onGuessSelectRef.current = onGuessSelect;
  }, [onGuessSelect]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  // Initialize map only once
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current || !window.google?.maps) return;

    initializedRef.current = true;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: NYC_CENTER,
      zoom: 10,
      restriction: {
        latLngBounds: NYC_BOUNDS,
        strictBounds: true,
      },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false, // Disable clicking on POIs, transit, etc.
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    listenerRef.current = mapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (disabledRef.current || !e.latLng) return;
      onGuessSelectRef.current(e.latLng.lat(), e.latLng.lng());
    });

    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      initializedRef.current = false;
    };
  }, []);

  // Update marker when guess changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    if (selectedGuess) {
      markerRef.current = new google.maps.Marker({
        position: selectedGuess,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: getCSSColor('--color-guess-marker'),
          fillOpacity: 1,
          strokeColor: getCSSColor('--color-marker-stroke'),
          strokeWeight: 1,
        },
      });
    }
  }, [selectedGuess]);

  return (
    <div
      className={`absolute transition-all duration-300 z-10 ${
        isExpanded
          ? 'bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] h-[350px] max-w-[calc(100vw-2rem)]'
          : 'bottom-4 right-4 w-[200px] sm:w-[250px] h-[180px] sm:h-[200px]'
      }`}
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
        <div
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 left-2 bg-white/90 hover:bg-white p-1.5 rounded shadow-md"
          title={isExpanded ? 'Shrink map' : 'Expand map'}
        >
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isExpanded ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
        </button>

        {/* Confirm button */}
        {selectedGuess && !disabled && (
          <button
            onClick={onConfirm}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[var(--color-confirm-button)] hover:bg-[var(--color-confirm-button-hover)] text-[color:var(--color-text-primary)] font-semibold px-6 py-2 rounded-lg shadow-lg transition-colors whitespace-nowrap"
          >
            Confirm Guess
          </button>
        )}
      </div>
    </div>
  );
}
