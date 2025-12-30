import { useState, useEffect, useCallback, useRef } from 'react';
import type { Borough, Guess } from '../types';
import { useGameState } from '../hooks/useGameState';
import { useDailyProgress } from '../hooks/useDailyProgress';
import { calculateDistance, calculateScore } from '../utils/scoring';
import { StreetView } from './StreetView';
import { GuessMap } from './GuessMap';
import { Results } from './Results';
import { FinalScore } from './FinalScore';

interface GameProps {
  mode: 'daily' | 'endless';
  boroughs?: Borough[];
  hardMode?: boolean;
  onExit: () => void;
  onPlayEndless?: () => void;
}

type GamePhase = 'viewing' | 'results' | 'final';

const MAX_RETRIES = 10; // Maximum attempts to find a location with Street View
const HARD_MODE_TIME_LIMIT = 60; // 2 minutes in seconds

export function Game({ mode, boroughs = [], hardMode = false, onExit, onPlayEndless }: GameProps) {
  const {
    gameState,
    currentGuess,
    isLoading: isGenerating,
    startDailyGame,
    startEndlessGame,
    makeGuess,
    confirmGuess,
    resetGame,
    regenerateCurrentLocation,
    updateCurrentLocationCoords,
  } = useGameState();

  const { loadProgress, saveProgress } = useDailyProgress();
  const [phase, setPhase] = useState<GamePhase>('viewing');
  const [lastGuess, setLastGuess] = useState<Guess | null>(null);
  const [streetViewError, setStreetViewError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState(HARD_MODE_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const initializedRef = useRef(false);
  const boroughsRef = useRef(boroughs);
  const handleConfirmGuessRef = useRef<() => void>(() => {});

  // Keep boroughs ref up to date
  useEffect(() => {
    boroughsRef.current = boroughs;
  }, [boroughs]);

  // Start timer when viewing phase begins in hard mode
  useEffect(() => {
    if (phase === 'viewing' && hardMode && !isRetrying && !streetViewError) {
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [phase, hardMode, isRetrying, streetViewError]);

  // Countdown timer for hard mode
  useEffect(() => {
    if (!timerActive || !hardMode) return;

    const interval = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Auto-submit
          clearInterval(interval);
          handleConfirmGuessRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, hardMode]);

  // Initialize game on mount - only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (mode === 'daily') {
      const existingProgress = loadProgress();
      if (existingProgress?.isComplete) {
        startDailyGame(existingProgress);
        setPhase('final');
      } else {
        startDailyGame(existingProgress ?? undefined);
      }
    } else {
      startEndlessGame(boroughsRef.current);
    }
  }, [mode]); // Only depend on mode, not on functions

  // Save progress when game state changes (daily mode only)
  useEffect(() => {
    if (gameState && mode === 'daily') {
      saveProgress(
        gameState.currentRound,
        gameState.guesses,
        gameState.totalScore,
        gameState.isComplete
      );
    }
  }, [gameState?.currentRound, gameState?.guesses, gameState?.totalScore, gameState?.isComplete, mode]);

  const handleConfirmGuess = useCallback(() => {
    if (!gameState) return;

    const currentLocation = gameState.locations[gameState.currentRound];

    // If no guess was made (timeout), use a default far-away location for 0 points
    const guessLocation = currentGuess || { lat: 0, lng: 0 };
    const timedOut = !currentGuess;

    const distance = timedOut ? null : calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      guessLocation.lat,
      guessLocation.lng
    );
    const score = timedOut ? 0 : calculateScore(distance!);

    const newGuess: Guess = {
      location: currentLocation,
      guess: guessLocation,
      distance: distance ?? 999999,
      score,
    };

    setLastGuess(newGuess);
    setTimerActive(false);
    confirmGuess(mode === 'endless' ? boroughsRef.current : undefined);
    setPhase('results');
  }, [gameState, currentGuess, confirmGuess, mode]);

  // Keep ref updated for timer callback
  useEffect(() => {
    handleConfirmGuessRef.current = handleConfirmGuess;
  }, [handleConfirmGuess]);

  const handleNextRound = useCallback(() => {
    if (!gameState) return;

    if (gameState.isComplete || (mode === 'endless' && gameState.currentRound >= 10)) {
      setElapsedTime(Date.now() - startTime);
      setPhase('final');
    } else {
      setPhase('viewing');
      setStreetViewError(false);
      setRetryCount(0);
      setIsRetrying(false);
      setRoundTimeLeft(HARD_MODE_TIME_LIMIT); // Reset timer for next round
    }
  }, [gameState?.isComplete, gameState?.currentRound, mode, startTime]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    startEndlessGame(boroughsRef.current);
    setPhase('viewing');
    setStreetViewError(false);
    setRetryCount(0);
    setIsRetrying(false);
    setRoundTimeLeft(HARD_MODE_TIME_LIMIT); // Reset timer
  }, [resetGame, startEndlessGame]);

  const handleStreetViewError = useCallback(() => {
    console.log('handleStreetViewError: retryCount =', retryCount, 'MAX_RETRIES =', MAX_RETRIES);
    if (retryCount < MAX_RETRIES) {
      // Try a new location
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      regenerateCurrentLocation();
      // isRetrying will be reset when the new StreetView loads or errors again
      setTimeout(() => setIsRetrying(false), 500); // Brief delay before showing new location
    } else {
      // Give up after max retries
      console.log('handleStreetViewError: Max retries reached, giving up');
      setStreetViewError(true);
    }
  }, [retryCount, regenerateCurrentLocation]);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    // Update the location to the actual Street View panorama position for accurate scoring
    updateCurrentLocationCoords(lat, lng);
  }, [updateCurrentLocationCoords]);

  if (!gameState || isGenerating) {
    return (
      <div className="h-dvh bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {isGenerating ? 'Finding locations in NYC...' : 'Loading...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Using Google Maps to verify boroughs
          </p>
        </div>
      </div>
    );
  }

  const currentLocation = gameState.locations[gameState.currentRound];
  const totalRounds: number | 'endless' = mode === 'daily' ? 12 : 'endless';

  return (
    <div className="h-dvh bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-[var(--dark-bar)] to-transparent p-5 pb-15">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <button
            onClick={onExit}
            className="text-[color:var(--maingame-text)]/80 hover:text-[color:var(--maingame-text)] font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit
          </button>

          <div className="text-center">
            <h1 className="text-[color:var(--maingame-text)] font-bold text-lg">NewYawkr</h1>
            <p className="text-[color:var(--maingame-text)]/60 text-sm">
              Round {gameState.currentRound + 1} of {mode === 'daily' ? 12 : '∞'}
            </p>
            {/* Timer for hard mode */}
            {hardMode && phase === 'viewing' && (
              <p
                className={` font-mono font-bold mt-1 text-lg ${
                  roundTimeLeft <= 30 ? 'text-[color:var(--color-error)]' : ' text-[0.875rem] text-[color:var(--maingame-text)]'
                }`}
              >
                {Math.floor(roundTimeLeft / 60)}:{(roundTimeLeft % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[color:var(--maingame-text)] font-semibold">
              {gameState.totalScore.toLocaleString()}
            </p>
            <p className="text-[color:var(--maingame-text)]/60 text-xs">points</p>
          </div>
        </div>
      </div>

      {/* Street View */}
      {phase === 'viewing' && currentLocation && (
        <>
          <StreetView
            key={`${currentLocation.lat}-${currentLocation.lng}`}
            location={currentLocation}
            onError={handleStreetViewError}
            onLocationFound={handleLocationFound}
            allowMovement={!hardMode}
          />

          {/* Retrying overlay */}
          {isRetrying && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-lg">Finding a new location...</p>
                <p className="text-gray-400 text-sm mt-2">Attempt {retryCount} of {MAX_RETRIES}</p>
              </div>
            </div>
          )}

          {/* Final error after max retries */}
          {streetViewError && !isRetrying && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
              <div className="text-center">
                <p className="text-white text-lg">Unable to find Street View coverage</p>
                <p className="text-gray-400 text-sm mt-2">Tried {MAX_RETRIES} locations</p>
              </div>
            </div>
          )}

          <GuessMap
            onGuessSelect={makeGuess}
            selectedGuess={currentGuess}
            onConfirm={handleConfirmGuess}
            disabled={streetViewError || isRetrying}
          />
        </>
      )}

      {/* Results overlay */}
      {phase === 'results' && lastGuess && (
        <Results
          guess={lastGuess}
          roundNumber={gameState.currentRound}
          totalRounds={totalRounds}
          onNext={handleNextRound}
          isLastRound={gameState.isComplete || (mode === 'endless' && gameState.currentRound >= 10)}
        />
      )}

      {/* Final score */}
      {phase === 'final' && (
        <FinalScore
          guesses={gameState.guesses}
          totalScore={gameState.totalScore}
          mode={mode}
          hardMode={hardMode}
          elapsedTime={elapsedTime}
          onPlayAgain={mode === 'endless' ? handlePlayAgain : undefined}
          onBackToMenu={onExit}
          onPlayEndless={onPlayEndless}
        />
      )}
    </div>
  );
}
