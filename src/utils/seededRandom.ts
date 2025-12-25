import seedrandom from 'seedrandom';

// Create a seeded random number generator
export function seededRandom(seed: string): () => number {
  return seedrandom(seed);
}
