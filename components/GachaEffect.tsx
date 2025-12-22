
import React, { useEffect, useState } from 'react';
import { Hero, Equipment } from '../types';

interface GachaEffectProps {
  result: { type: 'Hero' | 'Equipment'; data: any } | null;
  onClose: () => void;
}

const GachaEffect: React.FC<GachaEffectProps> = ({ result, onClose }) => {
  const [phase, setPhase] = useState<'charging' | 'burst' | 'reveal'>('charging');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('burst'), 1200);
    const t2 = setTimeout(() => setPhase('reveal'), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!result) return null;

  const rarity = result.data.rarity || 'C';
  
  const rarityColors: Record<string, string> = {
    C: '#94a3b8',
    UC: '#4ade80', // Green
    R: '#3b82f6',
    E: '#a855f7',
    L: '#eab308'
  };
  
  const color = rarityColors[rarity] || '#94a3b8';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* 1. Background God Rays - Increased to 450vmax to ensure no edges are visible during rotation */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${phase === 'reveal' ? 'opacity-60' : 'opacity-0'}`}>
        <div 
          className="w-[450vmax] h-[450vmax] animate-spin-ultra-slow opacity-30 flex-shrink-0" 
          style={{ 
            background: `conic-gradient(transparent 0deg, ${color} 20deg, transparent 40deg, ${color} 60deg, transparent 80deg, ${color} 100deg, transparent 120deg, ${color} 140deg, transparent 160deg, ${color} 180deg, transparent 200deg, ${color} 220deg, transparent 240deg, ${color} 260deg, transparent 280deg, ${color} 300deg, transparent 320deg, ${color} 340deg, transparent 360deg)` 
          }}
        />
      </div>

      {/* 2. Floating Particles */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-float-particle"
              style={{
                backgroundColor: color,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Charging Phase: Pulsing Orb */}
      {phase === 'charging' && (
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white animate-gacha-charge shadow-[0_0_100px_rgba(255,255,255,1)]" />
          <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-white animate-ping opacity-50" />
        </div>
      )}

      {/* 4. Burst Phase: White Flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none z-[110] ${phase === 'burst' ? 'opacity-100' : 'opacity-0'}`} />

      {/* 5. Reveal Phase: Card Animation */}
      {phase === 'reveal' && (
        <div className="relative flex flex-col items-center animate-card-reveal z-50 w-full">
          {/* Card Aura Bloom - Radial gradient for seamless glowing background */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[200vmax] h-[200vmax] opacity-80 animate-pulse-slow pointer-events-none" 
            style={{ 
              background: `radial-gradient(circle, ${color} 0%, ${color}22 20%, transparent 50%)`
            }} 
          />
          
          <div 
            className="w-72 aspect-[3/4.5] glass-panel rounded-[2rem] border-[6px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group mx-auto"
            style={{ borderColor: color, boxShadow: `0 0 60px ${color}66` }}
          >
            {/* Holographic Glint / Shimmer Effect */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
               <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-[35deg] animate-shimmer" />
            </div>

            {result.type === 'Hero' ? (
              <>
                <div className="absolute top-0 left-0 w-full h-full">
                  <img src={result.data.imageUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>
                <div className="absolute bottom-10 left-0 right-0 text-center px-6 z-30">
                  <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                    {result.data.rarity}
                  </div>
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-2 drop-shadow-lg">{result.data.name}</h3>
                  <div className="h-0.5 w-12 bg-white/30 mx-auto mb-4" />
                  <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">New Hero Unlocked</p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-6 bg-slate-900/40">
                <div className="text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {result.data.type === 'Pickaxe' ? '⛏️' : result.data.type === 'Helmet' ? '🪖' : '👢'}
                </div>
                <div className="text-center">
                  <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                    {result.data.rarity}
                  </div>
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-2">{result.data.name}</h3>
                  <div className="flex items-center justify-center space-x-2 text-indigo-400">
                    <span className="text-xs font-black uppercase">
                       {result.data.type === 'Pickaxe' ? 'Reward' : result.data.type === 'Helmet' ? 'Def' : 'Speed'}
                    </span>
                    <span className="text-lg font-orbitron font-bold">
                      {result.data.type === 'Pickaxe' ? '+' : '-'}{result.data.bonus}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-16 px-16 py-4 bg-white text-slate-950 font-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] border-b-4 border-slate-300 z-50"
          >
            素晴らしい！
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin-ultra-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translate(-50%, -50%) rotate(35deg); }
          100% { transform: translate(50%, 50%) rotate(35deg); }
        }
        @keyframes gacha-charge {
          0% { transform: scale(0.5); filter: blur(10px); }
          50% { transform: scale(1.2); filter: blur(0px); }
          100% { transform: scale(1.8); filter: blur(2px); }
        }
        @keyframes card-reveal {
          0% { transform: scale(0.5) translateY(100px); opacity: 0; filter: brightness(3); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
        }

        .animate-spin-ultra-slow {
          animation: spin-ultra-slow 30s linear infinite;
        }
        .animate-float-particle {
          animation: float-particle 4s ease-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        .animate-gacha-charge {
          animation: gacha-charge 1.2s ease-in-out forwards;
        }
        .animate-card-reveal {
          animation: card-reveal 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GachaEffect;
