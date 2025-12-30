import type { Guess } from '../types';

// Generate emoji grid based on scores
function getScoreEmoji(score: number): string {
  if (score >= 4000) return '🟩'; // Green - excellent
  if (score >= 2000) return '🟨'; // Yellow - good
  return '🟥'; // Red - poor
}

// Get star rating based on total score (out of 60000 for 12 rounds)


// Format date for display
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
}

// Format milliseconds to mm:ss or hh:mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Generate shareable text
export function generateShareText(
  guesses: Guess[],
  totalScore: number,
  dateString: string,
  hardMode: boolean = false,
  elapsedTime?: number
): string {
  
  const maxScore = guesses.length * 5000;
  const modeLabel = hardMode ? '(Hard Mode)' : '(Easy Mode)';
  const timeStr = elapsedTime ? ` ${formatTime(elapsedTime)}` : '';

  // For daily mode (12 guesses), organize as 4 rows of 3 (by borough) with labels
  let emojiGrid: string;
  if (guesses.length === 12) {
    const boroughLabels = {
      manhattan: 'MAN',
      brooklyn: 'BRK',
      queens: 'QNS',
      bronx: 'BRX',
    } as const;
    const boroughOrder = ['manhattan', 'brooklyn', 'queens', 'bronx'] as const;
    const rows = boroughOrder.map(borough => {
      const boroughGuesses = guesses.filter(g => g.location.borough === borough);
      const emojis = boroughGuesses.map(g => getScoreEmoji(g.score)).join('');
      return `${boroughLabels[borough]} ${emojis}`;
    });
    emojiGrid = rows.join('\n');
  } else {
    // Endless mode - just show all in a row
    emojiGrid = guesses.map(g => getScoreEmoji(g.score)).join('');
  }

  return `NewYawkr 🗽 ${formatDate(dateString)} ${modeLabel}
Score: ${totalScore.toLocaleString()}/${maxScore.toLocaleString()} 
Time: ${timeStr}
${emojiGrid}

https://newyawkr.com`;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
