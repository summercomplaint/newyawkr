import { useState, useCallback, useRef } from 'react';
import type { Borough, GameState, Guess } from '../types';
import { generateDailyLocations, generateEndlessLocation, generateRandomLocation, getTodayString } from '../utils/locations';
import { calculateDistance, calculateScore } from '../utils/scoring';
import { seededRandom } from '../utils/seededRandom';

// Counter for generating unique seeds when regenerating locations
let regenerateCounter = 0;

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading] = useState(false); // Kept for API compatibility
  const gameStateRef = useRef<GameState | null>(null);
  const currentGuessRef = useRef<{ lat: number; lng: number } | null>(null);

  // Keep refs in sync
  gameStateRef.current = gameState;
  currentGuessRef.current = currentGuess;

  const startDailyGame = useCallback((existingProgress?: { roundsPlayed: number; guesses: Guess[]; totalScore: number }) => {
    const dateString = getTodayString();
    const locations = generateDailyLocations(dateString);

    setGameState({
      mode: 'daily',
      locations,
      currentRound: existingProgress?.roundsPlayed ?? 0,
      guesses: existingProgress?.guesses ?? [],
      totalScore: existingProgress?.totalScore ?? 0,
      isComplete: existingProgress ? existingProgress.roundsPlayed >= 12 : false,
    });
    setCurrentGuess(null);
  }, []);

  const startEndlessGame = useCallback((boroughs: Borough[]) => {
    const firstLocation = generateEndlessLocation(boroughs);

    setGameState({
      mode: 'endless',
      locations: [firstLocation],
      currentRound: 0,
      guesses: [],
      totalScore: 0,
      isComplete: false,
    });
    setCurrentGuess(null);
  }, []);

  const makeGuess = useCallback((lat: number, lng: number) => {
    setCurrentGuess({ lat, lng });
  }, []);

  const confirmGuess = useCallback((endlessBoroughs?: Borough[]) => {
    const gs = gameStateRef.current;
    const cg = currentGuessRef.current;
    if (!gs || !cg) return;

    const currentLocation = gs.locations[gs.currentRound];
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      cg.lat,
      cg.lng
    );
    const score = calculateScore(distance);

    const newGuess: Guess = {
      location: currentLocation,
      guess: cg,
      distance,
      score,
    };

    const newGuesses = [...gs.guesses, newGuess];
    const newTotalScore = gs.totalScore + score;
    const newRound = gs.currentRound + 1;
    const isComplete = gs.mode === 'daily' && newRound >= 12;

    // For endless mode, generate next location
    let newLocations = gs.locations;
    if (gs.mode === 'endless' && endlessBoroughs) {
      const nextLocation = generateEndlessLocation(endlessBoroughs);
      newLocations = [...gs.locations, nextLocation];
    }

    setGameState({
      ...gs,
      locations: newLocations,
      currentRound: newRound,
      guesses: newGuesses,
      totalScore: newTotalScore,
      isComplete,
    });
    setCurrentGuess(null);
  }, []);

  const nextRound = useCallback(() => {
    setCurrentGuess(null);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setCurrentGuess(null);
  }, []);

  // Update the current location's coordinates (when Street View snaps to actual panorama position)
  const updateCurrentLocationCoords = useCallback((lat: number, lng: number) => {
    const gs = gameStateRef.current;
    if (!gs) return;

    const newLocations = [...gs.locations];
    const currentLoc = newLocations[gs.currentRound];
    newLocations[gs.currentRound] = { ...currentLoc, lat, lng };

    setGameState({
      ...gs,
      locations: newLocations,
    });
  }, []);

  // Regenerate the current location when Street View isn't available
  const regenerateCurrentLocation = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs) return;

    const currentLocation = gs.locations[gs.currentRound];
    const borough = currentLocation.borough;

    console.log('regenerateCurrentLocation: Current location failed:', currentLocation);

    // Generate a new location in the same borough
    const seed = `regenerate-${Date.now()}-${regenerateCounter++}`;
    const rng = seededRandom(seed);
    const newLocation = generateRandomLocation(borough, rng);

    console.log('regenerateCurrentLocation: New location generated:', newLocation);

    // Replace the current location
    const newLocations = [...gs.locations];
    newLocations[gs.currentRound] = newLocation;

    setGameState({
      ...gs,
      locations: newLocations,
    });
  }, []);

  return {
    gameState,
    currentGuess,
    isLoading,
    startDailyGame,
    startEndlessGame,
    makeGuess,
    confirmGuess,
    nextRound,
    resetGame,
    regenerateCurrentLocation,
    updateCurrentLocationCoords,
  };
}
