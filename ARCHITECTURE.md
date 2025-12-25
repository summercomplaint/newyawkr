# NewYawkr Architecture Guide

Welcome, student! This guide will walk you through how this React application works, explaining each piece and the patterns used. By the end, you'll understand how a real-world React app is structured.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [The Entry Point](#the-entry-point)
3. [TypeScript Types](#typescript-types)
4. [Components Deep Dive](#components-deep-dive)
5. [Custom Hooks](#custom-hooks)
6. [Utility Functions](#utility-functions)
7. [State Management Patterns](#state-management-patterns)
8. [React Concepts Used](#react-concepts-used)
9. [Google Maps Integration](#google-maps-integration)
10. [CSS Architecture](#css-architecture)
11. [Common Patterns](#common-patterns)

---

## Project Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Root component, handles routing/screens
├── index.css             # Global styles and CSS variables
├── types.ts              # TypeScript type definitions
│
├── components/           # UI Components
│   ├── ModeSelect.tsx    # Start screen (daily vs endless)
│   ├── BoroughPicker.tsx # Borough selection for endless mode
│   ├── Game.tsx          # Main game orchestrator
│   ├── StreetView.tsx    # Google Street View display
│   ├── GuessMap.tsx      # Interactive map for guessing
│   ├── Results.tsx       # Round results display
│   ├── FinalScore.tsx    # End game summary
│   └── DevMode.tsx       # Developer tools
│
├── hooks/                # Custom React hooks
│   ├── useGameState.ts   # Game state management
│   └── useDailyProgress.ts # LocalStorage persistence
│
└── utils/                # Pure utility functions
    ├── locations.ts      # Borough polygons, location generation
    ├── scoring.ts        # Distance & score calculations
    ├── seededRandom.ts   # Deterministic random numbers
    └── share.ts          # Share text generation
```

### Why This Structure?

- **Separation of Concerns**: Each file has ONE job
- **Reusability**: Hooks and utils can be used anywhere
- **Testability**: Pure functions in `utils/` are easy to test
- **Maintainability**: Easy to find and modify code

---

## The Entry Point

### main.tsx
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

This is where React "mounts" your app to the DOM. The `!` after `getElementById` tells TypeScript "trust me, this element exists."

### App.tsx - The Router

App.tsx acts as a simple router without using a routing library:

```tsx
type Screen = 'menu' | 'daily' | 'endless' | 'boroughPicker' | 'dev';
const [screen, setScreen] = useState<Screen>('menu');
```

**Pattern: State-Based Routing**
Instead of URL-based routing (like React Router), we use a state variable to track which "screen" to show. This is simpler for single-page games.

```tsx
{screen === 'menu' && <ModeSelect ... />}
{screen === 'daily' && <Game mode="daily" ... />}
{screen === 'endless' && <Game mode="endless" ... />}
```

The `&&` operator is a common React pattern: "if left side is true, render right side."

---

## TypeScript Types

### types.ts

```tsx
export type Borough = 'manhattan' | 'brooklyn' | 'queens' | 'bronx' | 'staten_island';
```

**Union Types**: This means a `Borough` can ONLY be one of these 5 strings. TypeScript will error if you try to use "harlem" as a Borough.

```tsx
export interface Location {
  lat: number;
  lng: number;
  borough: Borough;
}
```

**Interfaces**: Define the "shape" of an object. Every Location MUST have these three properties with these exact types.

```tsx
export interface GameState {
  mode: 'daily' | 'endless';
  locations: Location[];
  currentRound: number;
  guesses: Guess[];
  totalScore: number;
  isComplete: boolean;
}
```

This interface ensures your game state always has the same structure. If you forget a property, TypeScript will catch it.

---

## Components Deep Dive

### ModeSelect.tsx - The Start Screen

**Purpose**: Let users choose Daily or Endless mode, and Hard/Easy difficulty.

**Key Concepts**:

1. **Local State for UI**:
```tsx
const [hardMode, setHardMode] = useState(true);
```
This state only matters for this component's UI (the toggle).

2. **Props as Callbacks**:
```tsx
interface ModeSelectProps {
  onSelectDaily: (hardMode: boolean) => void;
  onSelectEndless: (hardMode: boolean) => void;
}
```
The parent (App.tsx) passes functions down. When user clicks, we call these functions to tell the parent "user selected daily mode with hard=true."

3. **Inline Styles with CSS Variables**:
```tsx
style={{ backgroundColor: 'var(--color-btn-daily)' }}
```
This lets us use CSS custom properties directly in React.

---

### Game.tsx - The Orchestrator

**Purpose**: Manages the overall game flow - which round, which phase, when to show results.

**This is the most complex component. Let's break it down:**

#### Game Phases
```tsx
type GamePhase = 'viewing' | 'results' | 'final';
```
- `viewing`: Player is looking at Street View and guessing
- `results`: Showing the result of their guess
- `final`: Game over, showing final score

#### Multiple State Sources
```tsx
const { gameState, currentGuess, ... } = useGameState();  // Custom hook
const { loadProgress, saveProgress } = useDailyProgress(); // Another hook
const [phase, setPhase] = useState<GamePhase>('viewing');  // Local state
```

**Pattern: Composition of Hooks**
Complex components often combine multiple hooks. Each hook handles one concern:
- `useGameState`: Game logic (locations, scoring)
- `useDailyProgress`: Persistence (localStorage)
- `useState`: UI state (which phase to show)

#### The Retry System
```tsx
const [retryCount, setRetryCount] = useState(0);
const [isRetrying, setIsRetrying] = useState(false);

const handleStreetViewError = useCallback(() => {
  if (retryCount < MAX_RETRIES) {
    setRetryCount(prev => prev + 1);
    regenerateCurrentLocation();
  } else {
    setStreetViewError(true);
  }
}, [retryCount, regenerateCurrentLocation]);
```

When Street View can't find a panorama, we try a new location (up to 10 times).

#### Refs for Stable References
```tsx
const boroughsRef = useRef(boroughs);
useEffect(() => {
  boroughsRef.current = boroughs;
}, [boroughs]);
```

**Why refs?** When you use a value inside `useCallback` or `useEffect`, React "captures" it. If the value changes, you might use a stale version. Refs always give you the current value.

---

### StreetView.tsx - Google Street View Integration

**Purpose**: Display an interactive Street View panorama.

#### The Core Pattern: useEffect for External APIs
```tsx
useEffect(() => {
  let cancelled = false;  // Cleanup flag

  const streetViewService = new google.maps.StreetViewService();

  streetViewService.getPanorama(
    { location: { lat, lng }, radius: 1000 },
    (data, status) => {
      if (cancelled) return;  // Don't update if component unmounted

      if (status === 'OK') {
        // Create panorama
      } else {
        onError();
      }
    }
  );

  return () => {
    cancelled = true;  // Cleanup function
  };
}, [location.lat, location.lng]);
```

**Critical Concept: Race Conditions**

When the location changes quickly:
1. Effect runs for location A, starts async request
2. Location changes to B before A's request finishes
3. Effect runs for location B, starts new request
4. Request A finishes - but we don't want it anymore!

The `cancelled` flag prevents stale responses from causing problems.

#### Props as Refs Pattern
```tsx
const onErrorRef = useRef(onError);
useEffect(() => {
  onErrorRef.current = onError;
}, [onError]);
```

This pattern keeps the callback reference fresh without re-running the main effect.

---

### GuessMap.tsx - Interactive Guessing

**Purpose**: Show a map of NYC where users click to guess.

#### Initialization Pattern
```tsx
const initializedRef = useRef(false);

useEffect(() => {
  if (initializedRef.current) return;  // Only run once
  initializedRef.current = true;

  // Create map...
}, []);
```

Google Maps should only be initialized once. This ref prevents double-initialization in React's StrictMode (which runs effects twice in development).

#### Separating Initialization from Updates
```tsx
// Effect 1: Create the map (runs once)
useEffect(() => {
  mapRef.current = new google.maps.Map(...);
}, []);

// Effect 2: Update marker (runs when guess changes)
useEffect(() => {
  if (selectedGuess) {
    markerRef.current = new google.maps.Marker(...);
  }
}, [selectedGuess]);
```

**Pattern**: Split effects by concern. One effect creates the map, another handles markers.

---

### Results.tsx - Round Results

**Purpose**: Show distance, score, and a map with both locations.

Simpler component - mostly presentational. Creates a map showing:
- Green marker: Actual location
- Red marker: Your guess
- Orange line: Distance between them

---

### FinalScore.tsx - Game Summary

**Purpose**: Show final results with share functionality.

#### Conditional Rendering
```tsx
{mode === 'daily' && (
  <button onClick={handleShare}>Share Results</button>
)}

{mode === 'endless' && onPlayAgain && (
  <button onClick={onPlayAgain}>Play Again</button>
)}
```

Different modes show different buttons.

---

## Custom Hooks

### useGameState.ts - Game Logic

**What is a Custom Hook?**
A function that uses React hooks and returns values/functions. Starts with `use`.

```tsx
export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState<{lat, lng} | null>(null);

  // ... logic ...

  return {
    gameState,
    currentGuess,
    startDailyGame,
    makeGuess,
    confirmGuess,
    // etc.
  };
}
```

**Why Custom Hooks?**
- **Reusability**: Could use game logic in different components
- **Separation**: Component focuses on UI, hook focuses on logic
- **Testing**: Can test game logic independently

#### The Ref Pattern for Current State
```tsx
const gameStateRef = useRef<GameState | null>(null);
gameStateRef.current = gameState;

const confirmGuess = useCallback(() => {
  const gs = gameStateRef.current;  // Always current
  // ...
}, []);  // No dependencies needed!
```

Without the ref, you'd need `[gameState]` as a dependency, and the function would be recreated every time state changes.

---

### useDailyProgress.ts - Persistence

**Purpose**: Save/load daily progress to localStorage.

```tsx
const STORAGE_KEY = 'newyawkr-daily-progress';

export function useDailyProgress() {
  const loadProgress = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    // Validate it's from today...
    return parsed;
  }, []);

  const saveProgress = useCallback((round, guesses, score, isComplete) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: getTodayString(),
      roundsPlayed: round,
      guesses,
      totalScore: score,
      isComplete,
    }));
  }, []);

  return { loadProgress, saveProgress };
}
```

**localStorage**: Browser storage that persists across page refreshes. Great for saving game progress!

---

## Utility Functions

### locations.ts - Geography

#### Point-in-Polygon Algorithm
```tsx
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    // Ray-casting algorithm
    // Draws a line from point to infinity
    // Counts how many polygon edges it crosses
    // Odd = inside, Even = outside
  }
  return inside;
}
```

This is a classic computational geometry algorithm. We use it to check if a random point is actually inside a borough's boundary.

#### Seeded Random Generation
```tsx
export function generateDailyLocations(dateString: string) {
  const rng = seededRandom(`newyawkr-${dateString}`);
  // Use rng() instead of Math.random()
}
```

**Why seeded?** Everyone playing on the same day gets the same locations! The date becomes the "seed" for the random number generator.

---

### scoring.ts - Math

#### Haversine Formula
```tsx
export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Calculates distance between two points on Earth's surface
  // Accounts for Earth's curvature
  // Returns distance in meters
}
```

#### Exponential Decay Scoring
```tsx
export function calculateScore(distance) {
  return Math.round(5000 * Math.exp(-distance / 2000));
}
```

- 0 meters = 5000 points
- 1km = ~3033 points
- 5km = ~410 points
- 10km = ~34 points

The further off, the fewer points - but it's forgiving for small errors.

---

### seededRandom.ts - Deterministic Randomness

```tsx
export function seededRandom(seed: string) {
  // Uses a hash of the seed to generate numbers
  // Same seed = same sequence of "random" numbers
  return () => {
    // Returns number between 0 and 1
  };
}
```

This ensures daily challenges are identical for all players.

---

## State Management Patterns

### 1. Lifting State Up
When multiple components need the same data, put it in their common parent.

```
App.tsx (holds: screen, hardMode)
  ├── ModeSelect (reads hardMode, calls onSelectDaily)
  └── Game (receives hardMode as prop)
```

### 2. Callbacks Down, Events Up
Parents pass callback functions down; children call them to communicate up.

```tsx
// Parent
<Game onExit={() => setScreen('menu')} />

// Child
<button onClick={onExit}>Exit</button>
```

### 3. Custom Hooks for Complex Logic
When a component has too much logic, extract it to a hook.

```tsx
// Before: 200 lines in Game.tsx
// After: Game.tsx uses useGameState() which has the logic
```

---

## React Concepts Used

### useState - Component State
```tsx
const [count, setCount] = useState(0);
```
Creates a state variable and a function to update it.

### useEffect - Side Effects
```tsx
useEffect(() => {
  // Runs after render
  return () => {
    // Cleanup before next run or unmount
  };
}, [dependencies]);
```

Use for: API calls, subscriptions, DOM manipulation, timers.

### useCallback - Memoized Functions
```tsx
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

Creates a function that only changes when dependencies change. Important for preventing unnecessary re-renders of child components.

### useRef - Mutable Container
```tsx
const ref = useRef(initialValue);
ref.current = newValue;  // Doesn't trigger re-render
```

Use for: DOM elements, storing values without triggering renders, breaking out of closure capture.

### useMemo - Memoized Values
```tsx
const expensive = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

Only recomputes when dependencies change. Use for expensive calculations.

---

## Google Maps Integration

### Loading the API
```html
<!-- In index.html -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY"></script>
```

This adds `google.maps` to the global `window` object.

### Creating a Map
```tsx
const map = new google.maps.Map(containerElement, {
  center: { lat: 40.7, lng: -73.9 },
  zoom: 10,
});
```

### Street View Service
```tsx
const service = new google.maps.StreetViewService();
service.getPanorama(
  { location: { lat, lng }, radius: 1000 },
  (data, status) => {
    // status: 'OK' or 'ZERO_RESULTS'
    // data.location.latLng: actual panorama position
  }
);
```

### Street View Panorama
```tsx
const panorama = new google.maps.StreetViewPanorama(container, {
  position: { lat, lng },
  pov: { heading: 0, pitch: 0 },  // Camera direction
  linksControl: false,  // Hide movement arrows
  clickToGo: false,     // Disable click-to-move
});
```

---

## CSS Architecture

### CSS Custom Properties (Variables)
```css
:root {
  --color-primary: #3b82f6;
}

.button {
  background: var(--color-primary);
}
```

**Why variables?**
- Change theme by changing variables
- Consistent colors across app
- Can be changed with JavaScript

### Using Variables in React
```tsx
// In styles
style={{ backgroundColor: 'var(--color-primary)' }}

// Reading value for external APIs (Google Maps)
const color = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary').trim();
```

---

## Common Patterns

### 1. Conditional Rendering
```tsx
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}
```

### 2. Guard Clauses in Effects
```tsx
useEffect(() => {
  if (!containerRef.current) return;
  if (!window.google?.maps) return;

  // Safe to proceed
}, []);
```

### 3. Cleanup Functions
```tsx
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer);  // Cleanup!
}, []);
```

### 4. Key Prop for Remounting
```tsx
<StreetView key={`${lat}-${lng}`} location={{lat, lng}} />
```

When `key` changes, React destroys and recreates the component. Useful for resetting state.

### 5. Optional Chaining
```tsx
window.google?.maps?.StreetViewService
// Same as:
window.google && window.google.maps && window.google.maps.StreetViewService
```

### 6. Nullish Coalescing
```tsx
const value = savedValue ?? defaultValue;
// Uses defaultValue only if savedValue is null or undefined
// Unlike ||, it doesn't treat 0 or "" as falsy
```

---

## Learning Exercises

Try these to deepen your understanding:

1. **Add a new borough color**: Add a color variable and see it update everywhere.

2. **Add a "streak" feature**: Track consecutive days played using localStorage.

3. **Add sound effects**: Play a sound when guessing correctly (useEffect with Audio).

4. **Add a leaderboard**: Store high scores in localStorage.

5. **Add keyboard shortcuts**: Use `useEffect` to listen for key presses.

---

## Questions to Ask Yourself

When reading React code, ask:
- What state does this component manage?
- What side effects does it have?
- What props does it receive?
- When does each useEffect run?
- What would happen if I removed this useCallback?

---

Happy learning! The best way to understand this code is to modify it and see what happens. Break things, fix them, and you'll learn faster than any tutorial.

🗽 Welcome to React, NewYawkr!
