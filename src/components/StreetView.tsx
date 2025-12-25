import { useEffect, useRef, useState } from 'react';
import type { Location } from '../types';

interface StreetViewProps {
  location: Location;
  onError?: () => void;
  onLocationFound?: (lat: number, lng: number) => void;
  allowMovement?: boolean;
}

export function StreetView({ location, onError, onLocationFound, allowMovement = true }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const onErrorRef = useRef(onError);
  const onLocationFoundRef = useRef(onLocationFound);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep refs up to date
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onLocationFoundRef.current = onLocationFound;
  }, [onLocationFound]);

  useEffect(() => {
    let cancelled = false; // Prevent race conditions when location changes rapidly

    if (!containerRef.current) {
      console.error('StreetView: Container ref is null');
      return;
    }

    if (!window.google?.maps) {
      setError('Google Maps not loaded');
      setIsLoading(false);
      return;
    }

    // Clean up previous panorama
    if (panoramaRef.current) {
      panoramaRef.current.setVisible(false);
      panoramaRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    console.log('StreetView: Searching for panorama at', location.lat, location.lng, 'borough:', location.borough);

    const streetViewService = new google.maps.StreetViewService();

    streetViewService.getPanorama(
      {
        location: { lat: location.lat, lng: location.lng },
        radius: 1000, // Increased radius to 1km
        source: google.maps.StreetViewSource.OUTDOOR,
      },
      (data, status) => {
        // Ignore callback if this effect has been cleaned up (location changed)
        if (cancelled) {
          console.log('StreetView: Ignoring stale callback for', location.lat, location.lng);
          return;
        }

        console.log('StreetView: getPanorama result', status, data);
        setIsLoading(false);

        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng && containerRef.current) {
          const actualLat = data.location.latLng.lat();
          const actualLng = data.location.latLng.lng();

          panoramaRef.current = new google.maps.StreetViewPanorama(
            containerRef.current,
            {
              position: data.location.latLng,
              pov: {
                heading: Math.random() * 360,
                pitch: 0,
              },
              zoom: 0,
              disableDefaultUI: false,
              linksControl: allowMovement, // Show arrows to move (easy mode)
              panControl: true,
              zoomControl: true,
              addressControl: false,
              fullscreenControl: false,
              motionTracking: false,
              motionTrackingControl: false,
              showRoadLabels: allowMovement, // Show road names (easy mode only)
              clickToGo: allowMovement, // Allow clicking to move (easy mode)
            }
          );

          // Report the actual panorama location for accurate scoring
          onLocationFoundRef.current?.(actualLat, actualLng);
        } else {
          console.error('StreetView: No coverage found', status);
          setError('No Street View available for this location');
          onErrorRef.current?.();
        }
      }
    );

    return () => {
      cancelled = true; // Mark this effect as stale
      if (panoramaRef.current) {
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
    };
  }, [location.lat, location.lng, allowMovement, location.borough]);

  return (
    <>
      {/* Always render container so ref is valid */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-5">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading Street View...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-5">
          <div className="text-center">
            <p className="text-white text-lg">{error}</p>
            <p className="text-gray-400 text-sm mt-2">
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
