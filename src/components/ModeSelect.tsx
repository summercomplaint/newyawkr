import { useState } from 'react';
import { useDailyProgress } from '../hooks/useDailyProgress';

interface ModeSelectProps {
  onSelectDaily: (hardMode: boolean) => void;
  onSelectEndless: (hardMode: boolean) => void;
}

export function ModeSelect({ onSelectDaily, onSelectEndless }: ModeSelectProps) {
  const { loadProgress } = useDailyProgress();
  const dailyProgress = loadProgress();
  const [hardMode, setHardMode] = useState(true);

  const getDailyButtonText = () => {
    if (!dailyProgress) return 'Play';
    if (dailyProgress.isComplete) return 'View Results';
    return `Continue (${dailyProgress.roundsPlayed}/12)`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(to bottom, var(--color-bg-primary), var(--color-bg-secondary))` }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            NewYawkr
          </h1>
         
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
            Because who cares about anywhere else?
          </p>
        </div>

        {/* Difficulty Toggle */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-secondary) 50%, transparent)' }}
        >
          <div className="flex items-center justify-between">
            <div className="group relative">
              <span
                className="font-medium cursor-help border-b border-dashed"
                style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-text-muted)' }}
              >
                {hardMode ? 'Hard Mode' : 'Easy Mode'}
              </span>
              <div
                className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
              >
                <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {hardMode ? 'Hard Mode' : 'Easy Mode'}
                </p>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {hardMode
                    ? "Fixed position, can only zoom and pan"
                    : "Can move around freely to find clues"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setHardMode(!hardMode)}
              className="relative w-14 h-8 rounded-full transition-colors"
              style={{ backgroundColor: hardMode ? 'var(--color-toggle-hard)' : 'var(--color-toggle-easy)' }}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  hardMode ? 'translate-x-0' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
          
        </div>

        <div className="space-y-4">
          {/* Daily Challenge */}
          <button
            onClick={() => onSelectDaily(hardMode)}
            className="w-full rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl"
            style={{
              background: `linear-gradient(to right, var(--color-btn-daily), var(--color-btn-daily-hover))`,
              color: 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `linear-gradient(to right, var(--color-btn-daily-hover), var(--color-primary-dark))`}
            onMouseLeave={(e) => e.currentTarget.style.background = `linear-gradient(to right, var(--color-btn-daily), var(--color-btn-daily-hover))`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Daily Challenge</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-btn-daily-accent)' }}>
                  Locate 12 Street View panoramas in 4 boroughs (Manhattan, Brooklyn, Queens, Bronx)
                </p>
                
              </div>
              <div className="text-right">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-btn-daily-muted)', color: 'var(--color-text-primary)' }}
                >
                  {getDailyButtonText()}
                </span>
              </div>
            </div>
          </button>

          {/* Endless Mode */}
          <button
            onClick={() => onSelectEndless(hardMode)}
            className="w-full rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl"
            style={{
              background: `linear-gradient(to right, var(--color-btn-endless), var(--color-btn-endless-hover))`,
              color: 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `linear-gradient(to right, var(--color-btn-endless-hover), var(--color-secondary-dark))`}
            onMouseLeave={(e) => e.currentTarget.style.background = `linear-gradient(to right, var(--color-btn-endless), var(--color-btn-endless-hover))`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Endless Mode</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-btn-endless-accent)' }}>
                  (All five boroughs available)
                </p>
              </div>
              <div className="text-right">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-btn-endless-muted)', color: 'var(--color-text-primary)' }}
                >
                  Play
                </span>
              </div>
            </div>
          </button>
        </div>


      </div>
    </div>
  );
}
