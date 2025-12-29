
import React, { useEffect, useState } from 'react';
import { playGachaReveal, playClick } from '../utils/sound';

interface GachaEffectProps {
  result: { type: 'Hero' | 'Equipment'; data: any[] } | null;
  onClose: () => void;
}

const GachaEffect: React.FC<GachaEffectProps> = ({ result, onClose }) => {
  const [phase, setPhase] = useState<'charging' | 'burst' | 'reveal'>('charging');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('burst'), 1200);
    const t2 = setTimeout(() => {
      setPhase('reveal');
      playGachaReveal(); // Play sound on reveal
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (phase === 'reveal') {
       playGachaReveal();
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (!result) return;
    if (currentIndex < result.data.length - 1) {
      playClick();
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  if (!result) return null;

  const currentItem = result.data[currentIndex];
  const rarity = currentItem.rarity || 'C';
  
  const rarityColors: Record<string, string> = {
    C: '#94a3b8',
    UC: '#4ade80', // Green
    R: '#3b82f6',
    E: '#a855f7',
    L: '#eab308'
  };
  
  const isMulti = result.data.length > 1;
  const isLastItem = currentIndex === result.data.length - 1;
  // It is the special guaranteed pull if it is the last item of a multi-pull
  const isSpecialPull = isMulti && isLastItem;

  // Use rarity color for card/particles, but allow background to be rainbow if special
  const color = rarityColors[rarity] || '#94a3b8';
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* 1. Background God Rays - Enhanced for Special Pull */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${phase === 'reveal' ? 'opacity-60' : 'opacity-0'}`}>
        <div 
          className="w-[450vmax] h-[450vmax] animate-spin-ultra-slow opacity-30 flex-shrink-0" 
          style={{ 
            background: isSpecialPull 
              ? `conic-gradient(from 0deg, #f59e0b, #ef4444, #8b5cf6, #3b82f6, #10b981, #f59e0b)` // Rainbow for special background
              : `conic-gradient(transparent 0deg, ${color} 20deg, transparent 40deg, ${color} 60deg, transparent 80deg, ${color} 100deg, transparent 120deg, ${color} 140deg, transparent 160deg, ${color} 180deg, transparent 200deg, ${color} 220deg, transparent 240deg, ${color} 260deg, transparent 280deg, ${color} 300deg, transparent 320deg, ${color} 340deg, transparent 360deg)` 
          }}
        />
      </div>

      {/* 2. Floating Particles - Intense for Special */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(isSpecialPull ? 60 : 30)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-float-particle`}
              style={{
                backgroundColor: color,
                boxShadow: isSpecialPull ? `0 0 10px ${color}` : 'none',
                width: isSpecialPull ? Math.random() * 6 + 2 + 'px' : '4px',
                height: isSpecialPull ? Math.random() * 6 + 2 + 'px' : '4px',
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
        <div className={`relative flex flex-col items-center animate-card-reveal z-50 w-full ${isSpecialPull ? 'animate-shake-entry' : ''}`} key={currentIndex}>
           {/* Multi-pull Indicator */}
           {result.data.length > 1 && (
             <div className="absolute -top-16 bg-slate-800/80 text-white px-4 py-1 rounded-full text-xs font-bold border border-slate-600 backdrop-blur-sm">
                Result {currentIndex + 1} / {result.data.length}
             </div>
           )}

          {/* Card Aura Bloom */}
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[200vmax] h-[200vmax] opacity-80 animate-pulse-slow pointer-events-none ${isSpecialPull ? 'mix-blend-screen' : ''}`}
            style={{ 
              background: `radial-gradient(circle, ${color} 0%, ${color}22 20%, transparent 50%)`
            }} 
          />
          
          <div 
            className={`w-72 aspect-[3/4.5] relative group mx-auto transition-all duration-300 ${isSpecialPull ? 'scale-105' : ''}`}
          >
            {/* Special Pull Animated Border & Glow */}
            {isSpecialPull && (
              <>
                 {/* Glow Layer (Blurred) */}
                 <div className="absolute -inset-6 rounded-[2.5rem] z-0 blur-xl opacity-80 overflow-hidden pointer-events-none">
                     <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow-gradient"
                          style={{ background: `conic-gradient(from 0deg, transparent 60%, ${color})` }}
                     />
                 </div>
                 {/* Border Layer (Sharp) */}
                 <div className="absolute -inset-[5px] rounded-[2.3rem] z-0 overflow-hidden bg-slate-800 pointer-events-none">
                     <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow-gradient"
                          style={{ background: `conic-gradient(from 0deg, transparent 60%, ${color})` }}
                     />
                 </div>
              </>
            )}

            <div 
              className={`absolute inset-0 rounded-[2rem] overflow-hidden glass-panel flex flex-col z-10 transition-all duration-300`}
              style={{ 
                borderWidth: isSpecialPull ? '0px' : '6px',
                borderColor: color, 
                boxShadow: isSpecialPull ? 'none' : `0 0 60px ${color}66`,
                backgroundColor: isSpecialPull ? '#0f172a' : undefined
              }}
            >
              {/* Inner thin border for definition on special pull */}
              {isSpecialPull && <div className="absolute inset-0 border border-white/20 rounded-[2rem] z-50 pointer-events-none" />}

              {/* Holographic Glint */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-[35deg] animate-shimmer ${isSpecialPull ? 'via-white/50' : ''}`} />
              </div>

              {result.type === 'Hero' ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <img src={currentItem.imageUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-10 left-0 right-0 text-center px-6 z-30">
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                      {currentItem.rarity}
                    </div>
                    <h3 className="text-2xl font-orbitron font-bold text-white mb-2 drop-shadow-lg">{currentItem.name}</h3>
                    <div className="h-0.5 w-12 bg-white/30 mx-auto mb-4" />
                    <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">New Hero Unlocked</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-6 bg-slate-900/40">
                  <div className="text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {currentItem.type === 'Pickaxe' ? '⛏️' : currentItem.type === 'Helmet' ? '🪖' : '👢'}
                  </div>
                  <div className="text-center">
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                      {currentItem.rarity}
                    </div>
                    <h3 className="text-2xl font-orbitron font-bold text-white mb-2">{currentItem.name}</h3>
                    <div className="flex items-center justify-center space-x-2 text-indigo-400">
                      <span className="text-xs font-black uppercase">
                        {currentItem.type === 'Pickaxe' ? 'Reward' : currentItem.type === 'Helmet' ? 'Def' : 'Speed'}
                      </span>
                      <span className="text-lg font-orbitron font-bold">
                        {currentItem.type === 'Pickaxe' ? '+' : '-'}{currentItem.bonus}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleNext}
            className={`mt-16 px-16 py-4 bg-white text-slate-950 font-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] border-b-4 border-slate-300 z-50 ${isSpecialPull ? 'ring-4 ring-opacity-50' : ''}`}
            style={isSpecialPull ? { '--tw-ring-color': color } as React.CSSProperties : undefined}
          >
            {isLastItem ? '素晴らしい！' : '次へ'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin-ultra-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-gradient {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
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
        @keyframes bounce-in {
            0% { transform: scale(0) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(-2deg); opacity: 1; }
        }
        @keyframes shake-entry {
            0% { transform: translate(0, 0) rotate(0); }
            10% { transform: translate(-5px, -5px) rotate(-1deg); }
            20% { transform: translate(5px, 5px) rotate(1deg); }
            30% { transform: translate(-5px, 5px) rotate(0); }
            40% { transform: translate(5px, -5px) rotate(1deg); }
            50% { transform: translate(0, 0) rotate(0); }
        }

        .animate-spin-ultra-slow {
          animation: spin-ultra-slow 30s linear infinite;
        }
        .animate-spin-slow-gradient {
          animation: spin-gradient 3s linear infinite;
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
          animation: card-reveal 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        .animate-shake-entry {
            animation: shake-entry 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GachaEffect;
