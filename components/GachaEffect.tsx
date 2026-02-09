
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { playGachaReveal, playClick } from '../utils/sound';
import EquipmentIcon from './EquipmentIcon';
import gsap from 'gsap';

interface GachaEffectProps {
  result: { type: 'Hero' | 'Equipment'; data: any[] } | null;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ffffff'];

const GachaEffect: React.FC<GachaEffectProps> = ({ result, onClose }) => {
  const [phase, setPhase] = useState<'charging' | 'reveal'>('charging');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs for GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const burstContainerRef = useRef<HTMLDivElement>(null);

  // Initial Sequence: Charge -> Burst -> Reveal
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setPhase('reveal');
          playGachaReveal();
        }
      });

      // 1. Charging Animation
      if (orbRef.current) {
        tl.to(orbRef.current, {
          scale: 1.5,
          duration: 0.8,
          ease: "power2.in"
        })
        .to(orbRef.current, {
          scale: 0.1,
          opacity: 0,
          duration: 0.2,
          ease: "back.in(2)",
          onStart: () => {
             // Shake effect just before burst
             gsap.to(containerRef.current, { x: "+=5", yoyo: true, repeat: 5, duration: 0.05 });
          }
        });
      }

      // 2. Flash (Transition)
      if (flashRef.current) {
        tl.to(flashRef.current, {
          opacity: 1,
          duration: 0.1,
          ease: "power1.out"
        }, "-=0.1"); // Overlap slightly with orb shrink
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Effect Triggered on Reveal Phase (and subsequent items)
  useLayoutEffect(() => {
    if (phase !== 'reveal' || !result) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Flash Fade Out
      if (flashRef.current) {
        tl.to(flashRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out"
        });
      }

      // 2. Card Reveal (Pop up)
      if (cardContainerRef.current) {
        // Reset state first
        gsap.set(cardContainerRef.current, { scale: 0, y: 50, opacity: 0, rotation: 0 });
        
        const isSpecial = isSpecialPull || isHighRarity;

        tl.to(cardContainerRef.current, {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.2)",
          onStart: () => playGachaReveal()
        }, "-=0.3");

        // Special Shake
        if (isSpecial) {
           tl.to(cardContainerRef.current, {
             rotation: 5,
             yoyo: true,
             repeat: 3,
             duration: 0.1,
             ease: "sine.inOut"
           }, "-=0.2");
           tl.to(cardContainerRef.current, { rotation: 0, duration: 0.1 });
        }
      }

      // 3. Burst / Firework Effect (Cracker)
      if (burstContainerRef.current) {
        // Clear previous burst
        burstContainerRef.current.innerHTML = '';
        
        // Reduced count for performance (40 -> 12)
        const burstCount = 12;
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const velocity = 150 + Math.random() * 150;
            const p = document.createElement('div');
            p.className = 'absolute w-1 h-6 bg-white rounded-full origin-bottom will-change-transform';
            p.style.backgroundColor = isHighRarity ? '#fbbf24' : '#fff';
            p.style.top = '50%';
            p.style.left = '50%';
            
            burstContainerRef.current.appendChild(p);

            gsap.set(p, { 
                rotation: angle * (180/Math.PI) + 90,
                scaleY: 0,
                opacity: 1
            });
            
            gsap.to(p, {
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                scaleY: 1,
                opacity: 0,
                duration: 0.6 + Math.random() * 0.3,
                ease: "power3.out",
                onComplete: () => p.remove()
            });
        }
      }

      // 4. Confetti (Optimized)
      if (burstContainerRef.current) {
         // Reduced count (80 -> 20)
         const confettiCount = isSpecialPull || isHighRarity ? 20 : 10;
         
         for (let i = 0; i < confettiCount; i++) {
            const c = document.createElement('div');
            const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
            const size = 6 + Math.random() * 6;
            
            c.className = 'absolute will-change-transform';
            c.style.width = `${size}px`;
            c.style.height = `${size * 0.6}px`;
            c.style.backgroundColor = color;
            c.style.top = '-10%'; // Start above screen
            c.style.left = `${Math.random() * 100}%`;
            c.style.opacity = '0';
            
            burstContainerRef.current.appendChild(c);

            gsap.to(c, {
                y: window.innerHeight,
                x: `+=${(Math.random() - 0.5) * 100}`,
                rotation: Math.random() * 360,
                opacity: 1,
                duration: 1.5 + Math.random() * 2,
                delay: Math.random() * 0.3,
                ease: "power1.out",
                onStart: () => { c.style.opacity = '1'; },
                onComplete: () => c.remove()
            });
         }
      }

    }, containerRef);

    return () => ctx.revert();
  }, [phase, currentIndex]); // Re-run on phase change or next item

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
  const isSpecialPull = isMulti && isLastItem; // Guaranteed slot logic
  const isHighRarity = ['R', 'E', 'L'].includes(rarity);

  const color = rarityColors[rarity] || '#94a3b8';

  return (
    <div ref={containerRef} className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950 overflow-hidden touch-none">
      
      {/* 1. Background Effects (CSS Animation) */}
      <style>{`
        @keyframes rotate-bg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .anim-rotate-bg {
          animation: rotate-bg 60s linear infinite;
        }
      `}</style>
      
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${phase === 'reveal' ? 'opacity-40' : 'opacity-0'}`}>
        <div 
          className="w-[150vmax] h-[150vmax] flex-shrink-0 origin-center anim-rotate-bg will-change-transform" 
          style={{ 
            background: isSpecialPull 
              ? `conic-gradient(from 0deg, #f59e0b, #ef4444, #8b5cf6, #3b82f6, #10b981, #f59e0b)`
              : `conic-gradient(transparent 0deg, ${color} 20deg, transparent 40deg, ${color} 60deg, transparent 80deg, ${color} 100deg, transparent 120deg, ${color} 140deg, transparent 160deg, ${color} 180deg, transparent 200deg, ${color} 220deg, transparent 240deg, ${color} 260deg, transparent 280deg, ${color} 300deg, transparent 320deg, ${color} 340deg, transparent 360deg)` 
          }}
        />
      </div>

      {/* 2. Burst & Confetti Container */}
      <div ref={burstContainerRef} className="absolute inset-0 pointer-events-none z-[100] overflow-hidden" />

      {/* 3. Charging Orb */}
      {phase === 'charging' && (
        <div ref={orbRef} className="relative z-50 w-20 h-20 rounded-full bg-white shadow-xl" />
      )}

      {/* 4. White Flash Overlay */}
      <div ref={flashRef} className="absolute inset-0 bg-white opacity-0 z-[110] pointer-events-none" />

      {/* 5. Reveal Card */}
      {phase === 'reveal' && (
        <div className="relative z-[120] w-full h-full flex flex-col items-center justify-center pb-10">
           
           {/* Multi-pull Indicator */}
           {result.data.length > 1 && (
             <div className="absolute top-10 bg-slate-800/80 text-white px-4 py-1 rounded-full text-xs font-bold border border-slate-600 backdrop-blur-sm z-50">
                Result {currentIndex + 1} / {result.data.length}
             </div>
           )}

          <div ref={cardContainerRef} className="w-60 aspect-[3/4.5] relative">
            
            {(isSpecialPull || isHighRarity) && (
                 <div className="absolute -inset-8 bg-white/10 blur-xl rounded-full z-[-1]" 
                      style={{ backgroundColor: color }} 
                 />
            )}

            <div 
              className={`absolute inset-0 rounded-[2rem] overflow-hidden flex flex-col z-10 bg-slate-900`}
              style={{ 
                borderWidth: (isSpecialPull || isHighRarity) ? '0px' : '6px',
                borderColor: color, 
                boxShadow: `0 0 20px ${color}33`,
              }}
            >
              {(isSpecialPull || isHighRarity) && <div className="absolute inset-0 border border-white/30 rounded-[2rem] z-50 pointer-events-none" />}

              {result.type === 'Hero' ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-full bg-slate-900">
                    <img 
                        src={currentItem.imageUrl} 
                        className="w-full h-full object-contain" 
                        alt={currentItem.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 from-15% via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 text-center px-4 z-30">
                    <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                      {currentItem.rarity}
                    </div>
                    <h3 className="text-lg font-orbitron font-bold text-white mb-1 drop-shadow-lg leading-tight">{currentItem.name}</h3>
                    <div className="h-0.5 w-8 bg-white/30 mx-auto mb-2" />
                    <p className="text-[9px] text-slate-300 font-bold tracking-widest uppercase">New Hero Unlocked</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4 bg-slate-900/40">
                  <div className="drop-shadow-lg">
                    <EquipmentIcon 
                        type={currentItem.type} 
                        rarity={currentItem.rarity} 
                        size="140px" 
                    />
                  </div>
                  <div className="text-center">
                    <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-white/20" style={{ backgroundColor: `${color}cc`, color: '#fff' }}>
                      {currentItem.rarity}
                    </div>
                    <h3 className="text-lg font-orbitron font-bold text-white mb-1 leading-tight">{currentItem.name}</h3>
                    <div className="flex items-center justify-center space-x-2 text-indigo-400">
                      <span className="text-[10px] font-black uppercase">
                        {currentItem.type === 'Pickaxe' ? 'Reward' : currentItem.type === 'Helmet' ? 'Def' : 'Speed'}
                      </span>
                      <span className="text-base font-orbitron font-bold">
                        +{currentItem.bonus}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleNext}
            className={`mt-8 px-12 py-3 bg-white text-slate-950 font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl border-b-4 border-slate-300 z-50 ${isSpecialPull ? 'ring-4 ring-opacity-50' : ''}`}
            style={isSpecialPull ? { '--tw-ring-color': color } as React.CSSProperties : undefined}
          >
            {isLastItem ? '素晴らしい！' : '次へ'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GachaEffect;
