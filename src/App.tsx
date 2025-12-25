import { useState, useEffect } from 'react';
import type { Borough } from './types';
import { ModeSelect } from './components/ModeSelect';
import { BoroughPicker } from './components/BoroughPicker';
import { Game } from './components/Game';
import { DevMode } from './components/DevMode';

type Screen = 'menu' | 'borough-picker' | 'daily-game' | 'endless-game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [endlessBoroughs, setEndlessBoroughs] = useState<Borough[]>([]);
  const [hardMode, setHardMode] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      setMapsError('Please set your Google Maps API key in the .env file');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setMapsLoaded(true);
    };

    script.onerror = () => {
      setMapsError('Failed to load Google Maps. Check your API key and internet connection.');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Keyboard shortcut for dev mode (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectDaily = (isHardMode: boolean) => {
    setHardMode(isHardMode);
    setScreen('daily-game');
  };

  const handleSelectEndless = (isHardMode: boolean) => {
    setHardMode(isHardMode);
    setScreen('borough-picker');
  };

  const handleStartEndless = (boroughs: Borough[]) => {
    setEndlessBoroughs(boroughs);
    setScreen('endless-game');
  };

  const handleExit = () => {
    setScreen('menu');
  };

  // Show dev mode if enabled
  if (showDevMode && mapsLoaded) {
    return <DevMode onClose={() => setShowDevMode(false)} />;
  }

  // Show error state if Maps failed to load
  if (mapsError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-white mb-4">NewYawkr 🗽</h1>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{mapsError}</p>
          </div>
          <div className="text-gray-400 text-sm text-left">
            <p className="mb-2">To set up the API key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Google Cloud Console</li>
              <li>Create a project and enable Maps JavaScript API</li>
              <li>Create an API key</li>
              <li>Copy <code className="bg-gray-800 px-1 rounded">.env.example</code> to <code className="bg-gray-800 px-1 rounded">.env</code></li>
              <li>Add your key to the .env file</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while Maps loads
  if (!mapsLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">NewYawkr 🗽</h1>
          <p className="text-gray-400">Loading maps...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === 'menu' && (
        <ModeSelect
          onSelectDaily={handleSelectDaily}
          onSelectEndless={handleSelectEndless}
        />
      )}

      {screen === 'borough-picker' && (
        <BoroughPicker
          onStart={handleStartEndless}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'daily-game' && (
        <Game
          mode="daily"
          hardMode={hardMode}
          onExit={handleExit}
        />
      )}

      {screen === 'endless-game' && (
        <Game
          mode="endless"
          boroughs={endlessBoroughs}
          hardMode={hardMode}
          onExit={handleExit}
        />
      )}

      
    </>
  );
}

export default App;
