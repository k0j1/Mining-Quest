
import React, { useState } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';
import Header from '../Header';

interface GachaViewProps {
  gameState: GameState;
  onRollGacha: (tab: 'Hero' | 'Equipment') => void;
  isGachaRolling: boolean;
  gachaResult: { type: 'Hero' | 'Equipment'; data: any } | null;
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
  const currentCost = gachaTab === 'Hero' ? heroCost : equipCost;
  const canAfford = gameState.tokens >= currentCost;

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

         <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col items-center">
            <div className="flex bg-slate-800 p-1.5 rounded-2xl w-full max-w-md mb-8 border border-slate-700">
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Hero' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => { playClick(); setGachaTab('Hero'); }}
              >
                ヒーロー
              </button>
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Equipment' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => { playClick(); setGachaTab('Equipment'); }}
              >
                装備品
              </button>
            </div>
            
            <div className="bg-slate-800 p-10 rounded-[2.5rem] text-center space-y-8 max-w-md w-full border border-slate-700 shadow-xl relative overflow-hidden">
              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-indigo-400 text-sm tracking-widest">CONNECTING...</p>
                </div>
              )}
              <div className="relative inline-block py-4">
                <div className="text-7xl drop-shadow-lg">🎁</div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{gachaTab === 'Hero' ? '新しい相棒を呼ぶ' : '地下の遺物を探す'}</h2>
                <p className="text-slate-400 text-sm">
                  コスト: <span className={`font-bold text-lg ${canAfford ? 'text-amber-500' : 'text-red-400'}`}>{currentCost.toLocaleString()} $CHH</span>
                </p>
              </div>
              <button 
                onClick={() => onRollGacha(gachaTab)}
                disabled={isGachaRolling || !canAfford}
                className={`w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg shadow-md transition-all ${
                  (isGachaRolling || !canAfford)
                    ? 'opacity-50 cursor-not-allowed grayscale' 
                    : 'hover:bg-amber-400 active:scale-95'
                }`}
              >
                {isGachaRolling ? '通信中...' : !canAfford ? 'トークン不足' : 'ガチャを回す'}
              </button>
            </div>
         </div>
      </div>
      
      {gachaResult && <GachaEffect result={gachaResult} onClose={onCloseResult} />}
    </>
  );
};

export default GachaView;
