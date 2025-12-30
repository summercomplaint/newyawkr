import { useState } from 'react';
import type { Guess } from '../types';
import { formatScore } from '../utils/scoring';
import { generateShareText, copyToClipboard } from '../utils/share';
import { getTodayString } from '../utils/locations';

interface FinalScoreProps {
  guesses: Guess[];
  totalScore: number;
  mode: 'daily' | 'endless';
  hardMode?: boolean;
  elapsedTime?: number | null;
  onPlayAgain?: () => void;
  onBackToMenu: () => void;
  onPlayEndless?: () => void;
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

export function FinalScore({ guesses, totalScore, mode, hardMode = false, elapsedTime, onPlayAgain, onBackToMenu, onPlayEndless }: FinalScoreProps) {
  const [copied, setCopied] = useState(false);

  const maxScore = guesses.length * 5000;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getScoreEmoji = (score: number) => {
    if (score >= 4000) return '🟩';
    if (score >= 2000) return '🟨';
    return '🟥';
  };

  const handleShare = async () => {
    const shareText = generateShareText(guesses, totalScore, getTodayString(), hardMode, elapsedTime ?? undefined);
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Group guesses by borough for display (daily mode has 3 per borough)
  const boroughOrder = ['manhattan', 'brooklyn', 'queens', 'bronx'] as const;
  const guessesByBorough = boroughOrder.map(borough =>
    guesses.filter(g => g.location.borough === borough)
  );

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-secondary)]/90 flex items-start justify-center overflow-y-auto z-50 p-4">
      <div className="bg-[var(--color-bg-primary)] rounded-xl max-w-md w-full  shadow-2xl">
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold text-[color:var(--maingame-text)] mb-2">
            {mode === 'daily' ? "Results" : 'Game Over'}
          </h1>

 

          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
            <p className="text-[color:var(--color-text-secondary)] text-sm mb-1">Final Score</p>
            <p className="text-4xl font-bold text-[color:var(--color-text-primary)]">
              {formatScore(totalScore)}
              <span className="text-xl text-[color:var(--color-text-secondary)]">/{formatScore(maxScore)}</span>
            </p>
            <p className="text-2xl text-[color:var(--color-text-secondary)] mt-1">{percentage}%</p>
            {elapsedTime && (
              <p className="text-[color:var(--color-text-secondary)] text-sm mt-2">
                Time: {formatTime(elapsedTime)}
              </p>
            )}
          </div>

          {/* Emoji grid - 4 rows (boroughs) x 3 columns */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-[color:var(--color-text-secondary)] text-sm">Your Performance</p>
              {!hardMode && (
                <span className="text-xs bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded">
                  Easy Mode
                </span>
              )}
            </div>
            {mode === 'daily' ? (
              <div className="flex flex-col items-center gap-1">
                {guessesByBorough.map((boroughGuesses, i) => (
                  <div key={boroughOrder[i]} className="flex gap-1 text-2xl" title={boroughOrder[i]}>
                    <span className="py-1 capitalize text-[color:var(--color-text-primary)]">{boroughOrder[i]}: </span>
                    {boroughGuesses.map((g, j) => (
                      <span key={j} title={`${boroughOrder[i]}: ${formatScore(g.score)} pts`}>
                        {getScoreEmoji(g.score)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center flex-wrap gap-1 text-2xl">
                {guesses.map((g, i) => (
                  <span key={i} title={`Round ${i + 1}: ${formatScore(g.score)} pts`}>
                    {getScoreEmoji(g.score)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Round breakdown */}
          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[color:var(--color-text-secondary)]">
                  <th className="text-left py-1">Round</th>
                  <th className="text-left py-1">Borough</th>
                  <th className="text-right py-1">Score</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={i} className="text-[color:var(--color-text-primary)]">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1 capitalize">{g.location.borough.replace('_', ' ')}</td>
                    <td className="py-1 text-right">{formatScore(g.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {mode === 'daily' && (
              <button
                onClick={handleShare}
                className="w-full bg-[var(--color-btn-daily)] hover:bg-[var(--color-btn-daily-hover)] text-[color:var(--color-text-primary)] font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Results
                  </>
                )}
              </button>
            )}

            {mode === 'endless' && onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary)] text-[color:var(--color-text-primary)] font-semibold py-3 rounded-lg transition-colors"
              >
                Play Again
              </button>
            )}

            <button
              onClick={onBackToMenu}
                className="w-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary)] text-[color:var(--color-text-primary)] font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>

          {mode === 'daily' && (
            <p className="text-[color:var(--color-text-secondary)] text-sm mt-4">
              Come back tomorrow for a new challenge!
              {onPlayEndless && (
                <button
                  onClick={onPlayEndless}
                  className="block mx-auto mt-1 text-[color:var(--color-text-primary)] hover:underline cursor-pointer"
                >
                  (or play endless mode)
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
