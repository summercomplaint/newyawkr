import { useState } from 'react';
import { useDailyProgress } from '../hooks/useDailyProgress';

// Configure your social links here
const SOCIAL_LINKS = {
  github: 'https://github.com/summercomplaint/newyawkr',
  twitter: 'https://twitter.com/transgendererer',
};

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
    if (dailyProgress.isComplete) return 'Final Score';
    return `Continue (${dailyProgress.roundsPlayed}/12)`;
  };

  return (
    <div
      className="h-dvh flex items-center justify-center p-4 relative overflow-hidden"
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
                    ? "Fixed position, 60 second time limit"
                    : "Can move around freely to find clues, unlimited time"}
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
                  className="inline-block px-3 py-3 rounded-full text-sm font-medium text-center"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-primary)' }}
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
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-primary)' }}
                >
                  Play
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Social Links - Bottom Left */}
      <div className="absolute bottom-4 left-4 flex gap-3">
        <a
          href={SOCIAL_LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-text-primary)' }}
          title="GitHub"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
        <a
          href={SOCIAL_LINKS.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-text-primary)' }}
          title="Twitter / X"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
