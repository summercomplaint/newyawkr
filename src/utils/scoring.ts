// Haversine formula to calculate distance between two points in meters
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate score based on distance
// Max 5000 points, exponential decay
export function calculateScore(distanceInMeters: number): number {
  const maxScore = 5000;
  const scaling= 5000
  // Score = 5000 * e^(-distance/1000)
  // At 0m: 5000
  // At 1km: ~1839
  // At 5km: ~34
  const score = maxScore * Math.exp(-distanceInMeters / scaling);
  return Math.round(score);
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

// Format score for display
export function formatScore(score: number): string {
  return score.toLocaleString();
}
