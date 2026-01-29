import React, { useState, useEffect } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';
import Header from '../Header';
import { supabase } from '../../lib/supabase';
import { HeroDefinition } from '../../data/hero_data';
import { HERO_RATES, EQUIPMENT_RATES } from '../../services/gachaService';

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

// --- Hero List Components ---

const HeroListItem: React.FC<{ 
  hero: HeroDefinition; 
  rarityColors: Record<string, string>; 
  onZoom: (full: string, thumb: string) => void; 
}> = ({ hero, rarityColors, onZoom }) => {
  const [hasError, setHasError] = useState(false);
  
  // Use _s image for both since high-res is removed
  const imageUrl = `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${hero.name}_s.png`;

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
  const icon = item.type === 'Pickaxe' ? '⛏️' : item.type === 'Helmet' ? '🪖' : '👢';
  
  return (
    <div className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
      {/* Icon Area */}
      <div className="shrink-0 w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
         {icon}
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
          {item.type === 'Pickaxe' ? `Reward +${item.bonus}%` : item.type === 'Helmet' ? `Damage -${item.bonus}%` : `Duration -${item.bonus}%`}
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

         <div className="flex-1 overflow-y-auto w-full px-4 pt-8 pb-44 flex flex-col items-center custom-scrollbar">
            <div className="flex bg-slate-800 p-1.5 rounded-xl w-full max-w-[320px] mb-8 border border-slate-700 shadow-sm shrink-0">
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

            <div className="bg-slate-800 p-8 rounded-[2.5rem] text-center w-full max-w-[360px] border border-slate-700 shadow-xl relative overflow-hidden shrink-0 flex flex-col justify-center min-h-[480px]">
              
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
                  className="absolute top-5 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-sm group"
                >
                  <span className="text-xs group-hover:scale-110 transition-transform">{gachaTab === 'Hero' ? '📜' : '⚒️'}</span>
                  <span className="text-[10px] font-bold">一覧</span>
              </button>

              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-indigo-400 text-xs tracking-widest">CONNECTING...</p>
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="relative py-2 flex justify-center items-center h-24">
                  {gachaTab === 'Hero' ? (
                     <div className="text-6xl drop-shadow-lg animate-pulse">🎁</div>
                  ) : (
                     <div className="flex gap-4">
                        <div className="text-5xl drop-shadow-lg animate-bounce" style={{ animationDelay: '0s' }}>⛏️</div>
                        <div className="text-5xl drop-shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>🪖</div>
                        <div className="text-5xl drop-shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>👢</div>
                     </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{gachaTab === 'Hero' ? '新しい相棒を呼ぶ' : '地下の遺物を探す'}</h2>
                  <p className="text-slate-400 text-xs">戦力を増強して深層を目指そう</p>
                </div>

                <div className="space-y-4 pt-2">
                    {/* Single Gacha */}
                    <button 
                      onClick={() => onRollGacha(gachaTab)}
                      disabled={isGachaRolling}
                      className={`w-full py-4 bg-slate-700 text-white rounded-xl font-bold text-sm shadow-md transition-all border border-slate-600 flex items-center justify-between px-6 ${
                        isGachaRolling
                          ? 'opacity-50 cursor-not-allowed grayscale' 
                          : 'hover:bg-slate-600 active:scale-95'
                      }`}
                    >
                      <span>1回召喚</span>
                      <span className={canAffordSingle ? 'text-amber-400' : 'text-red-400'}>{singleCost.toLocaleString()} $CHH</span>
                    </button>

                    {/* Triple Gacha */}
                    <button 
                      onClick={() => onRollGachaTriple && onRollGachaTriple(gachaTab)}
                      disabled={isGachaRolling}
                      className={`w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-md transition-all border border-amber-500/50 flex items-center justify-between px-6 relative overflow-hidden group ${
                        isGachaRolling
                          ? 'opacity-50 cursor-not-allowed grayscale' 
                          : 'hover:brightness-110 active:scale-95'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/10 group-hover:animate-pulse"></div>
                      <div className="flex flex-col items-start z-10 text-left">
                          <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-sm leading-none drop-shadow-md">3連召喚</span>
                              <span className="text-[9px] bg-white text-orange-600 px-1.5 py-0.5 rounded shadow-sm font-black leading-none border border-orange-200">R以上最低1枚確定</span>
                          </div>
                      </div>
                      <div className="z-10 text-right flex flex-col items-end justify-center">
                          <span className={`text-sm font-black ${canAffordTriple ? 'text-white' : 'text-red-100'} drop-shadow-md`}>{tripleCost.toLocaleString()}</span>
                          <span className="text-[9px] opacity-80 text-amber-100">$CHH</span>
                      </div>
                    </button>
                </div>
              </div>
            </div>
         </div>
      </div>
      
      {gachaResult && <GachaEffect result={gachaResult} onClose={onCloseResult} />}
      
      {showHeroList && <HeroListModal onClose={() => { playClick(); setShowHeroList(false); }} />}
      {showEquipmentList && <EquipmentListModal onClose={() => { playClick(); setShowEquipmentList(false); }} />}
    </>
  );
};

export default GachaView;