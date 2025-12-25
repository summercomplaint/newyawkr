export type Borough = 'manhattan' | 'brooklyn' | 'queens' | 'bronx' | 'staten_island';

export interface Location {
  lat: number;
  lng: number;
  borough: Borough;
}

export interface Guess {
  location: Location;
  guess: { lat: number; lng: number } | null;
  distance: number | null;
  score: number;
}

export interface GameState {
  mode: 'daily' | 'endless';
  locations: Location[];
  currentRound: number;
  guesses: Guess[];
  totalScore: number;
  isComplete: boolean;
}

export interface DailyProgress {
  date: string;
  roundsPlayed: number;
  guesses: Guess[];
  totalScore: number;
  isComplete: boolean;
}
