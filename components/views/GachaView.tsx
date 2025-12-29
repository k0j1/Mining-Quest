
import React, { useState } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';
import Header from '../Header';

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
    </>
  );
};

export default GachaView;
