
import React, { useEffect, useState } from 'react';
import { Hero, Equipment } from '../types';

interface GachaEffectProps {
  result: { type: 'Hero' | 'Equipment'; data: any } | null;
  onClose: () => void;
}

const GachaEffect: React.FC<GachaEffectProps> = ({ result, onClose }) => {
  const [phase, setPhase] = useState<'charging' | 'burst' | 'reveal'>('charging');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('burst'), 1500);
    const t2 = setTimeout(() => setPhase('reveal'), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!result) return null;

  const rarity = result.data.rarity || 'Common';
  const rarityColors = {
    Common: '#cbd5e1',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#eab308'
  };
  const color = rarityColors[rarity as keyof typeof rarityColors];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-hidden">
      {/* Background Rays */}
      {phase !== 'reveal' && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${phase === 'burst' ? 'opacity-100' : 'opacity-0'}`}>
           <div className="w-[200vmax] h-[200vmax] animate-spin-slow opacity-50" 
                style={{ background: `conic-gradient(transparent, ${color}, transparent, ${color}, transparent, ${color}, transparent)` }}>
           </div>
        </div>
      )}

      {/* Burst Flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none z-10 ${phase === 'burst' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Charging Sphere */}
      {phase === 'charging' && (
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.8)] animate-pulse scale-150" />
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-white animate-ping" />
        </div>
      )}

      {/* Reveal Card */}
      {phase === 'reveal' && (
        <div className="relative flex flex-col items-center animate-in zoom-in duration-500">
          {/* Shining Background */}
          <div className="absolute -z-10 w-64 h-64 blur-3xl rounded-full opacity-40 animate-pulse" style={{ backgroundColor: color }} />
          
          <div className="w-64 aspect-[3/4] glass-panel rounded-3xl border-4 overflow-hidden shadow-2xl relative" style={{ borderColor: color }}>
            {result.type === 'Hero' ? (
              <>
                <img src={result.data.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{result.data.rarity}</p>
                  <h3 className="text-xl font-orbitron font-bold text-white mb-2">{result.data.name}</h3>
                  <p className="text-xs text-slate-300">New Chihuahua Hero Joined!</p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
                <div className="text-6xl">⚒️</div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{result.data.rarity}</p>
                  <h3 className="text-xl font-orbitron font-bold text-white mb-2">{result.data.name}</h3>
                  <p className="text-xs text-slate-300">Equipment Found: +{result.data.bonus} Bonus</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-12 px-12 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform shadow-xl"
          >
            OK
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GachaEffect;
