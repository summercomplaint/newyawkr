import { useState } from 'react';
import type { Borough } from '../types';

interface BoroughPickerProps {
  onStart: (boroughs: Borough[]) => void;
  onBack: () => void;
}

const BOROUGHS: { id: Borough; name: string; cssVar: string }[] = [
  { id: 'manhattan', name: 'Manhattan', cssVar: '--color-manhattan' },
  { id: 'brooklyn', name: 'Brooklyn', cssVar: '--color-brooklyn' },
  { id: 'queens', name: 'Queens', cssVar: '--color-queens' },
  { id: 'bronx', name: 'The Bronx', cssVar: '--color-bronx' },
  { id: 'staten_island', name: 'Staten Island', cssVar: '--color-staten-island' },
];

export function BoroughPicker({ onStart, onBack }: BoroughPickerProps) {
  const [selected, setSelected] = useState<Borough[]>(['manhattan', 'brooklyn', 'queens', 'bronx']);

  const toggleBorough = (borough: Borough) => {
    setSelected(prev => {
      if (prev.includes(borough)) {
        return prev.filter(b => b !== borough);
      }
      return [...prev, borough];
    });
  };

  const selectAll = () => {
    setSelected(BOROUGHS.map(b => b.id));
  };

  const selectMain = () => {
    setSelected(['manhattan', 'brooklyn', 'queens', 'bronx']);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Endless Mode</h1>
          <p className="text-gray-400">Select which boroughs to include</p>
        </div>

        <div className="space-y-3 mb-6">
          {BOROUGHS.map(borough => (
            <button
              key={borough.id}
              onClick={() => toggleBorough(borough.id)}
              className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                selected.includes(borough.id)
                  ? 'text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              style={selected.includes(borough.id) ? { backgroundColor: `var(${borough.cssVar})` } : undefined}
            >
              <span className="font-medium">{borough.name}</span>
              {selected.includes(borough.id) && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={selectMain}
            className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
          >
            Main 4
          </button>
          <button
            onClick={selectAll}
            className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
          >
            Select All
          </button>
        </div>

        <button
          onClick={() => selected.length > 0 && onStart(selected)}
          disabled={selected.length === 0}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            selected.length > 0
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Start Game
          {selected.length > 0 && (
            <span className="text-purple-300 ml-2">
              ({selected.length} borough{selected.length !== 1 ? 's' : ''})
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
