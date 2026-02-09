
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';
import Header from '../Header';
import { supabase } from '../../lib/supabase';
import { HeroDefinition, HERO_DEFINITIONS } from '../../data/hero_data';
import { HERO_RATES, EQUIPMENT_RATES } from '../../services/gachaService';
import { getHeroImageUrl } from '../../utils/heroUtils';
import EquipmentIcon from '../EquipmentIcon';
import gsap from 'gsap';

interface GachaViewProps {
  gameState: GameState;
  onRollGacha: (tab: 'Hero' | 'Equipment') => void;
  onRollGachaTriple?: (tab: 'Hero' | 'Equipment') => void;
  isGachaRolling: boolean;
  gachaResult: { type: 'Hero' | 'Equipment'; data: any[] } | null;
  onCloseResult: () => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

// --- Rate Display Component ---
const RateDisplay: React.FC<{ rates: Record<string, number> }> = ({ rates }) => {
  const colors: Record<string, string> = {
    C: 'text-slate-400',
    UC: 'text-emerald-400',
    R: 'text-indigo-400',
    E: 'text-fuchsia-400',
    L: 'text-amber-400'
  };

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 flex justify-between items-center text-[10px] font-bold">
       <span className="text-slate-500 mr-2">提供割合:</span>
       <div className="flex gap-3">
         {Object.entries(rates).map(([rarity, rate]) => (
           <span key={rarity} className={colors[rarity]}>
             {rarity}: {rate}%
           </span>
         ))}
       </div>
    </div>
  );
};

// --- Showcase Components ---

const SimpleHeroCard: React.FC<{ hero: HeroDefinition; isMain?: boolean }> = ({ hero, isMain }) => {
  const rarityColors: Record<string, string> = {
    L: 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]',
    E: 'border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    R: 'border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.3)]',
    UC: 'border-emerald-400',
    C: 'border-slate-600'
  };
  const colorClass = rarityColors[hero.rarity] || rarityColors.C;
  
  return (
    <div className={`
      relative rounded-xl overflow-hidden bg-slate-900 border-2 ${colorClass} 
      ${isMain ? 'w-28 h-40 z-20' : 'w-24 h-32 grayscale-[0.3] brightness-75 z-10'}
      flex flex-col transition-all duration-300
    `}>
        <img src={getHeroImageUrl(hero.name, 's')} className="w-full h-full object-cover" alt={hero.name} />
        
        {/* Rarity Badge */}
        <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-black text-white border border-white/20 backdrop-blur-sm">
            {hero.rarity}
        </div>
        
        {/* Shiny Effect for Main Card */}
        {isMain && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent w-[200%] h-full animate-shimmer pointer-events-none mix-blend-overlay"></div>
        )}
    </div>
  );
};

const GachaShowcase: React.FC<{ tab: 'Hero' | 'Equipment' }> = ({ tab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  // Select Sample Heroes (L, E, R)
  const heroSamples = [
    HERO_DEFINITIONS.find(h => h.rarity === 'L') || HERO_DEFINITIONS[0], // Center
    HERO_DEFINITIONS.find(h => h.rarity === 'E') || HERO_DEFINITIONS[1], // Left
    HERO_DEFINITIONS.find(h => h.rarity === 'R') || HERO_DEFINITIONS[2], // Right
  ];

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
        // 1. Initial Reveal
        gsap.from(".showcase-item", {
            y: 50,
            opacity: 0,
            scale: 0.5,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.5)"
        });

        // 2. Background Rotation (Sunburst)
        if (bgRef.current) {
            gsap.to(bgRef.current, {
                rotation: 360,
                duration: 40,
                repeat: -1,
                ease: "linear"
            });
        }

        // 3. Floating Animation (Different timing for organic feel)
        const items = gsap.utils.toArray<HTMLElement>(".showcase-item");
        items.forEach((item: any, i: number) => {
            gsap.to(item, {
                y: i === 1 ? -15 : -10, // Center moves more
                duration: 2 + i * 0.5,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: i * 0.2
            });
        });

        // 4. Equipment Shine Rotation
        if (tab === 'Equipment') {
             gsap.to(".equip-glow", {
                opacity: 0.8,
                duration: 1.5,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
             });
        }

    }, containerRef);

    return () => ctx.revert();
  }, [tab]);

  if (tab === 'Hero') {
      return (
          <div ref={containerRef} className="relative w-full h-52 flex items-center justify-center mt-2 mb-6 perspective-[1000px]">
              {/* Rotating Light Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none overflow-hidden">
                  <div ref={bgRef} className="w-[500px] h-[500px]" style={{
                      background: `conic-gradient(from 0deg, transparent 0deg, #6366f1 20deg, transparent 40deg, #f59e0b 60deg, transparent 80deg, #6366f1 100deg, transparent 120deg, #f59e0b 140deg, transparent 160deg)`
                  }}></div>
                  <div className="absolute inset-0 bg-slate-800 rounded-full blur-3xl scale-75"></div>
              </div>

              {/* Left (E) */}
              <div className="showcase-item absolute left-[10%] transform -rotate-12 translate-z-[-20px]">
                  <SimpleHeroCard hero={heroSamples[1]} />
              </div>
              
              {/* Right (R) */}
              <div className="showcase-item absolute right-[10%] transform rotate-12 translate-z-[-20px]">
                  <SimpleHeroCard hero={heroSamples[2]} />
              </div>
              
              {/* Center (L) */}
              <div className="showcase-item absolute z-30 transform scale-110 drop-shadow-2xl">
                  <SimpleHeroCard hero={heroSamples[0]} isMain />
                  {/* Sparkles */}
                  <div className="absolute -top-4 -right-4 text-2xl animate-pulse">✨</div>
                  <div className="absolute -bottom-2 -left-4 text-xl animate-bounce delay-75">✨</div>
              </div>
          </div>
      );
  }

  // Equipment Layout
  return (
      <div ref={containerRef} className="relative w-full h-52 flex items-center justify-center mt-2 mb-6">
          {/* Rotating Light Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
              <div ref={bgRef} className="w-[500px] h-[500px]" style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, #3b82f6 20deg, transparent 40deg, #3b82f6 60deg, transparent 80deg)`
              }}></div>
              <div className="absolute inset-0 bg-slate-800 rounded-full blur-3xl scale-75"></div>
          </div>

          <div className="flex gap-6 items-center z-10">
              {/* Helmet */}
              <div className="showcase-item transform translate-y-4 scale-90">
                  <div className="drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                      <EquipmentIcon type="Helmet" rarity="L" size="4em" />
                  </div>
              </div>
              
              {/* Pickaxe (Center) */}
              <div className="showcase-item transform -translate-y-4 scale-125 z-20">
                  <div className="drop-shadow-[0_0_25px_rgba(245,158,11,0.8)] equip-glow">
                      <EquipmentIcon type="Pickaxe" rarity="L" size="5em" />
                  </div>
              </div>

              {/* Boots */}
              <div className="showcase-item transform translate-y-4 scale-90">
                  <div className="drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                      <EquipmentIcon type="Boots" rarity="L" size="4em" />
                  </div>
              </div>
          </div>
      </div>
  );
};

// --- Hero List Components ---

const HeroListItem: React.FC<{ 
  hero: HeroDefinition; 
  rarityColors: Record<string, string>; 
  onZoom: (full: string, thumb: string) => void; 
}> = ({ hero, rarityColors, onZoom }) => {
  const [hasError, setHasError] = useState(false);
  
  // Use _s image for both since high-res is removed
  const imageUrl = getHeroImageUrl(hero.name, 's');

  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <div className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
      {/* Image - Larger & Clickable */}
      <div 
        className="shrink-0 w-24 h-24 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden relative cursor-zoom-in active:scale-95 transition-transform group"
        onClick={() => {
          if (!hasError) {
            playClick();
            // Pass the same URL for both since we only use one size now
            onZoom(imageUrl, imageUrl);
          }
        }}
      >
         {hasError ? (
           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
             <span className="text-xl mb-1">⚠️</span>
             <span className="text-[8px] font-bold">NO IMAGE</span>
           </div>
         ) : (
           <img 
             src={imageUrl} 
             alt={hero.name}
             className="w-full h-full object-cover"
             onError={handleImageError}
           />
         )}
         
         {/* Zoom Icon Overlay (Only if no error) */}
         {!hasError && (
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-2xl drop-shadow-md transition-opacity">🔍</span>
           </div>
         )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
           <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${rarityColors[hero.rarity] || 'bg-slate-600'}`}>
              {hero.rarity}
           </span>
           <h3 className="text-sm font-bold text-slate-200 truncate">{hero.name}</h3>
        </div>
        <div className="text-[10px] font-bold text-emerald-400 mb-1.5">
          HP {hero.hp}
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800">
          {hero.ability}
        </p>
      </div>
    </div>
  );
};

const HeroListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [zoomData, setZoomData] = useState<{ full: string; thumb: string } | null>(null);
  const [heroList, setHeroList] = useState<HeroDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const { data, error } = await supabase
          .from('quest_hero')
          .select('*')
          .order('id', { ascending: true }); // ID順などでソート
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setHeroList(data as HeroDefinition[]);
        } else {
          setHeroList([]);
        }
      } catch (e) {
        console.error("Error fetching hero list:", e);
        setHeroList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeroes();
  }, []);

  const rarityColors: Record<string, string> = {
    C: 'bg-slate-600 text-slate-100',
    UC: 'bg-emerald-600 text-emerald-50',
    R: 'bg-indigo-600 text-indigo-50',
    E: 'bg-fuchsia-600 text-fuchsia-50',
    L: 'bg-amber-600 text-amber-50'
  };

  const rarityPriority: Record<string, number> = { L: 5, E: 4, R: 3, UC: 2, C: 1 };
  const sortedList = [...heroList].sort((a, b) => rarityPriority[b.rarity] - rarityPriority[a.rarity]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
      {/* Main List Modal */}
      <div className="w-full max-w-lg flex flex-col max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📜</span> 排出ヒーロー一覧
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3 custom-scrollbar">
          <RateDisplay rates={HERO_RATES} />

          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-500 text-xs">Loading...</p>
            </div>
          ) : (
            <>
              {sortedList.length > 0 ? (
                sortedList.map((hero, idx) => (
                  <HeroListItem 
                    key={idx} 
                    hero={hero} 
                    rarityColors={rarityColors}
                    onZoom={(full, thumb) => {
                      setZoomData({ full, thumb });
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No hero data found in database.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Zoom Overlay */}
      {zoomData && (
        <div 
          className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => {
            playClick();
            setZoomData(null);
          }}
        >
          <div className="relative animate-bounce-in">
            <img 
              src={zoomData.full} 
              alt="Zoom" 
              className="max-w-[90vw] max-h-[70vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] border-2 border-slate-700"
            />
          </div>
          <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-8 animate-pulse">TAP TO CLOSE</p>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        
        @keyframes bounce-in {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
            animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

// --- Equipment List Components ---

interface EquipmentDefinition {
  id: number;
  name: string;
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  rarity: string;
  bonus: number;
  ability: string;
}

const EquipmentListItem: React.FC<{ 
  item: EquipmentDefinition; 
  rarityColors: Record<string, string>; 
}> = ({ item, rarityColors }) => {
  return (
    <div className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
      {/* Icon Area */}
      <div className="shrink-0 w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
         <EquipmentIcon type={item.type} rarity={item.rarity} size="3em" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
           <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${rarityColors[item.rarity] || 'bg-slate-600'}`}>
              {item.rarity}
           </span>
           <h3 className="text-sm font-bold text-slate-200 truncate">{item.name}</h3>
        </div>
        <div className="text-[10px] font-bold text-indigo-400 mb-1.5">
          {item.type === 'Pickaxe' ? `Reward +${item.bonus}%` : item.type === 'Helmet' ? `Damage -${item.bonus}%` : `Speed +${item.bonus}%`}
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800">
          {item.ability}
        </p>
      </div>
    </div>
  );
};

const EquipmentListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [equipList, setEquipList] = useState<EquipmentDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('quest_equipment')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setEquipList(data as EquipmentDefinition[]);
        } else {
            setEquipList([]);
        }
      } catch (e) {
        console.error("Error fetching equipment list:", e);
        setEquipList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const rarityColors: Record<string, string> = {
    C: 'bg-slate-600 text-slate-100',
    UC: 'bg-emerald-600 text-emerald-50',
    R: 'bg-indigo-600 text-indigo-50',
    E: 'bg-fuchsia-600 text-fuchsia-50',
    L: 'bg-amber-600 text-amber-50'
  };

  const rarityPriority: Record<string, number> = { L: 5, E: 4, R: 3, UC: 2, C: 1 };
  const sortedList = [...equipList].sort((a, b) => rarityPriority[b.rarity] - rarityPriority[a.rarity]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
      {/* Main List Modal */}
      <div className="w-full max-w-lg flex flex-col max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚒️</span> 排出装備一覧
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3 custom-scrollbar">
          <RateDisplay rates={EQUIPMENT_RATES} />

          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-500 text-xs">Loading...</p>
            </div>
          ) : (
            sortedList.map((item, idx) => (
              <EquipmentListItem 
                key={idx} 
                item={item} 
                rarityColors={rarityColors}
              />
            ))
          )}
          {!isLoading && sortedList.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No equipment data found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main View ---

const GachaView: React.FC<GachaViewProps> = ({ 
  gameState, 
  onRollGacha, 
  onRollGachaTriple, 
  isGachaRolling, 
  gachaResult, 
  onCloseResult, 
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens, 
  farcasterUser, 
  onChainBalance, 
  onAccountClick 
}) => {
  const [gachaTab, setGachaTab] = useState<'Hero' | 'Equipment'>('Hero');
  const [showHeroList, setShowHeroList] = useState(false);
  const [showEquipmentList, setShowEquipmentList] = useState(false);

  const heroCost = 10000;
  const equipCost = 6000;
  
  const singleCost = gachaTab === 'Hero' ? heroCost : equipCost;
  // Cost: Single x 5 (Reduced from Single x 3 x 5)
  const tripleCost = singleCost * 5;

  const canAffordSingle = gameState.tokens >= singleCost;
  const canAffordTriple = gameState.tokens >= tripleCost;

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900">
         <Header 
           title="採掘ガチャ" 
           tokens={gameState.tokens} 
           isSoundOn={isSoundOn} 
           onToggleSound={onToggleSound} 
           onDebugAddTokens={onDebugAddTokens}
           farcasterUser={farcasterUser}
           onChainBalance={onChainBalance}
           onAccountClick={onAccountClick}
         />

         <div className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-44 flex flex-col items-center custom-scrollbar">
            <div className="flex bg-slate-800 p-1.5 rounded-xl w-full max-w-[320px] mb-6 border border-slate-700 shadow-sm shrink-0">
              <button 
                className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${gachaTab === 'Hero' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => { playClick(); setGachaTab('Hero'); }}
              >
                ヒーロー
              </button>
              <button 
                className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${gachaTab === 'Equipment' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => { playClick(); setGachaTab('Equipment'); }}
              >
                装備品
              </button>
            </div>

            <div className="bg-slate-800 p-6 rounded-[2.5rem] text-center w-full max-w-[360px] border border-slate-700 shadow-xl relative overflow-hidden shrink-0 flex flex-col justify-start min-h-[500px]">
              
              {/* List Button Inside Frame (Absolute Position) */}
              <button 
                  onClick={() => { 
                    playClick(); 
                    if (gachaTab === 'Hero') {
                      setShowHeroList(true);
                    } else {
                      setShowEquipmentList(true);
                    }
                  }}
                  className="absolute top-5 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-sm group"
                >
                  <span className="text-xs group-hover:scale-110 transition-transform">{gachaTab === 'Hero' ? '📜' : '⚒️'}</span>
                  <span className="text-[10px] font-bold">一覧</span>
              </button>

              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 space-y-4 backdrop-blur-[2px]">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-indigo-400 text-xs tracking-widest">CONNECTING...</p>
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-between pt-8">
                 <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-md">
                      {gachaTab === 'Hero' ? 'Hero Summon' : 'Equipment Forge'}
                    </h2>
                    
                    <GachaShowcase tab={gachaTab} />
                 </div>

                 <div className="space-y-3 pb-4">
                    {/* Single Pull */}
                    <button 
                      onClick={() => onRollGacha(gachaTab)}
                      disabled={!canAffordSingle || isGachaRolling}
                      className={`w-full py-3 rounded-xl border-b-4 transition-all active:scale-95 flex items-center justify-between px-6 ${
                        !canAffordSingle 
                          ? 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed opacity-70' 
                          : 'bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/40'
                      }`}
                    >
                      <span className="font-bold text-sm">1回ガチャ</span>
                      <div className="text-right">
                         <div className={`font-black ${!canAffordSingle ? 'text-rose-400' : 'text-amber-400'}`}>
                           {singleCost.toLocaleString()}
                         </div>
                         <div className="text-[9px] font-bold text-white/50">$CHH</div>
                      </div>
                    </button>

                    {/* Triple Pull */}
                    {onRollGachaTriple && (
                      <button 
                        onClick={() => onRollGachaTriple(gachaTab)}
                        disabled={!canAffordTriple || isGachaRolling}
                        className={`w-full py-4 rounded-xl border-b-4 transition-all active:scale-95 flex items-center justify-between px-6 relative overflow-hidden group ${
                          !canAffordTriple 
                            ? 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed opacity-70' 
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 border-orange-800 text-white shadow-lg shadow-orange-900/40'
                        }`}
                      >
                        {/* Shine effect */}
                        {canAffordTriple && <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>}
                        
                        <div className="flex flex-col items-start relative z-10">
                          <span className="font-black text-sm italic">5連ガチャ</span>
                          <span className="text-[9px] font-bold bg-black/20 px-1.5 rounded text-yellow-200">R以上1枠確定</span>
                        </div>
                        <div className="text-right relative z-10">
                           <div className={`font-black text-lg ${!canAffordTriple ? 'text-rose-400' : 'text-white'}`}>
                             {tripleCost.toLocaleString()}
                           </div>
                           <div className="text-[9px] font-bold text-white/70">$CHH</div>
                        </div>
                      </button>
                    )}
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Result Overlay */}
      {gachaResult && (
        <GachaEffect 
           result={gachaResult} 
           onClose={onCloseResult} 
        />
      )}

      {/* Lists Modals */}
      {showHeroList && <HeroListModal onClose={() => { playClick(); setShowHeroList(false); }} />}
      {showEquipmentList && <EquipmentListModal onClose={() => { playClick(); setShowEquipmentList(false); }} />}
    </>
  );
};

export default GachaView;
