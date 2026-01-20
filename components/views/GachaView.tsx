
import React, { useState } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';
import Header from '../Header';
import { GACHA_HERO_DATA } from '../../constants';

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

const HeroListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const rarityColors: Record<string, string> = {
    C: 'bg-slate-600 text-slate-100',
    UC: 'bg-emerald-600 text-emerald-50',
    R: 'bg-indigo-600 text-indigo-50',
    E: 'bg-fuchsia-600 text-fuchsia-50',
    L: 'bg-amber-600 text-amber-50'
  };

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
          {GACHA_HERO_DATA.map((hero, idx) => (
            <div key={idx} className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
              {/* Image - Larger & Clickable */}
              <div 
                className="shrink-0 w-24 h-24 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden relative cursor-zoom-in active:scale-95 transition-transform group"
                onClick={() => {
                  playClick();
                  setZoomImage(`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/${hero.name}.png`);
                }}
              >
                 <img 
                   src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/${hero.name}.png`} 
                   alt={hero.name}
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://placehold.co/100x100/1e293b/475569?text=?";
                   }}
                 />
                 {/* Zoom Icon Overlay */}
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-2xl drop-shadow-md transition-opacity">🔍</span>
                 </div>
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
          ))}
        </div>
      </div>

      {/* Image Zoom Overlay */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => {
            playClick();
            setZoomImage(null);
          }}
        >
          <div className="relative animate-bounce-in">
            <img 
              src={zoomImage} 
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
            <div className="flex bg-slate-800 p-1.5 rounded-xl w-full max-w-[320px] mb-4 border border-slate-700 shadow-sm shrink-0">
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

            {/* List Button */}
            {gachaTab === 'Hero' && (
              <button 
                onClick={() => { playClick(); setShowHeroList(true); }}
                className="mb-6 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-[10px] text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
              >
                <span>📜</span> 排出ヒーロー一覧
              </button>
            )}
            
            <div className="bg-slate-800 p-8 rounded-[2.5rem] text-center space-y-6 w-full max-w-[360px] border border-slate-700 shadow-xl relative overflow-hidden shrink-0">
              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-indigo-400 text-xs tracking-widest">CONNECTING...</p>
                </div>
              )}
              
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
                            <span className="text-[9px] bg-white text-orange-600 px-1.5 py-0.5 rounded shadow-sm font-black leading-none border border-orange-200">R以上確定</span>
                        </div>
                        <span className="text-[10px] text-amber-100 opacity-90 font-medium">※ハイリスク・ハイリターン</span>
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
      
      {gachaResult && <GachaEffect result={gachaResult} onClose={onCloseResult} />}
      
      {showHeroList && <HeroListModal onClose={() => { playClick(); setShowHeroList(false); }} />}
    </>
  );
};

export default GachaView;
