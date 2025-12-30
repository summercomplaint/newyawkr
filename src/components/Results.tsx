import { useEffect, useRef } from 'react';
import type { Guess } from '../types';
import { formatDistance, formatScore } from '../utils/scoring';

// Get CSS variable value for use in Google Maps API
function getCSSColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

interface ResultsProps {
  guess: Guess;
  roundNumber: number;
  totalRounds: number | 'endless';
  onNext: () => void;
  isLastRound: boolean;
}

export function Results({ guess, roundNumber, totalRounds, onNext, isLastRound }: ResultsProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || !guess.guess) return;

    const map = new google.maps.Map(mapRef.current, {
      center: guess.location,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });

    // Actual location marker (green)
    new google.maps.Marker({
      position: guess.location,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: getCSSColor('--color-actual-marker'),
        fillOpacity: 1,
        strokeColor: getCSSColor('--color-marker-stroke'),
        strokeWeight: 2,
      },
      title: 'Actual Location',
    });

    // Guess marker (red)
    new google.maps.Marker({
      position: guess.guess,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: getCSSColor('--color-guess-marker'),
        fillOpacity: 1,
        strokeColor: getCSSColor('--color-marker-stroke'),
        strokeWeight: 2,
      },
      title: 'Your Guess',
    });

    // Line between them
    new google.maps.Polyline({
      path: [guess.location, guess.guess],
      map,
      strokeColor: getCSSColor('--color-distance-line'),
      strokeWeight: 3,
      strokeOpacity: 0.8,
    });

    // Fit bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(guess.location);
    bounds.extend(guess.guess);
    map.fitBounds(bounds, 80);
  }, [guess]);

  const getScoreColor = (score: number) => {
    if (score >= 4000) return 'text-[color:var(--copper-green-bright)]';
    if (score >= 2000) return 'text-[color:var(--copper-brown-light)]';
    return 'text-[color:var(--copper-brown-med)]';
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-secondary)]/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-primary)] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[color:var(--color-text-primary)] mb-2">
            Round {roundNumber}{totalRounds === 'endless' ? '' : ` of ${totalRounds}`}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
              <p className="text-[color:var(--color-text-secondary)] text-sm">Distance</p>
              <p className="text-2xl font-bold text-[color:var(--color-text-primary)]">
                {guess.distance !== null ? formatDistance(guess.distance) : '-'}
              </p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
              <p className="[color:var(--color-text-secondary)] text-sm">Points</p>
              <p className={`text-2xl font-bold ${getScoreColor(guess.score)}`}>
                +{formatScore(guess.score)}
              </p>
            </div>
          </div>

          <p className="text-[color:var(--color-text-secondary)] text-sm mb-2">
            Borough: <span className="text-[color:var(--color-text-primary)] capitalize">{guess.location.borough.replace('_', ' ')}</span>
          </p>
        </div>

        <div ref={mapRef} className="w-full h-64" />

        <div className="p-4 bg-[var(--color-bg-primary)]">
          <button
            onClick={onNext}
            className="w-full bg-[var(--next-button)] hover:bg-[var(--copper-green-dark)] text-[color:var(--maingame-text)] font-semibold py-3 rounded-lg transition-colors"
          >
            {isLastRound ? 'See Final Score' : 'Next Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
