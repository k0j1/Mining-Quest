
import React, { useState } from 'react';
import { GameState } from '../../types';
import GachaEffect from '../GachaEffect';
import { playClick } from '../../utils/sound';

interface GachaViewProps {
  gameState: GameState;
  onRollGacha: (tab: 'Hero' | 'Equipment') => void;
  isGachaRolling: boolean;
  gachaResult: { type: 'Hero' | 'Equipment'; data: any } | null;
  onCloseResult: () => void;
}

const GachaView: React.FC<GachaViewProps> = ({ 
  gameState, 
  onRollGacha, 
  isGachaRolling, 
  gachaResult, 
  onCloseResult 
}) => {
  const [gachaTab, setGachaTab] = useState<'Hero' | 'Equipment'>('Hero');

  const heroCost = 10000;
  const equipCost = 6000;
  const currentCost = gachaTab === 'Hero' ? heroCost : equipCost;
  const canAfford = gameState.tokens >= currentCost;

  return (
    <>
      <div className="flex flex-col h-full">
         {/* Sticky Header */}
         <div className="p-6 bg-slate-900/80 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md flex-none">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-orbitron font-bold text-indigo-300">採掘ガチャ</h1>
              <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <span className="text-yellow-400 text-sm font-black">$CHH:</span>
                <span className="font-orbitron text-lg font-bold">{gameState.tokens.toLocaleString()}</span>
              </div>
            </div>
          </div>

         <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col items-center">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full max-w-md mb-8 border border-slate-800">
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Hero' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                onClick={() => { playClick(); setGachaTab('Hero'); }}
              >
                ヒーロー
              </button>
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Equipment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                onClick={() => { playClick(); setGachaTab('Equipment'); }}
              >
                装備品
              </button>
            </div>
            <div className="glass-panel p-10 rounded-[2.5rem] text-center space-y-8 max-w-md w-full border-t-8 border-t-yellow-500 shadow-2xl relative overflow-hidden">
              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-orbitron font-bold text-indigo-400 animate-pulse">CONNECTING...</p>
                </div>
              )}
              <div className="relative inline-block">
                <div className="text-7xl animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">🎁</div>
                <div className="absolute inset-0 animate-ping bg-yellow-500/20 rounded-full"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{gachaTab === 'Hero' ? '新しい相棒を呼ぶ' : '地下の遺物を探す'}</h2>
                <p className="text-slate-400 text-sm">
                  コスト: <span className={`font-black text-lg ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>{currentCost.toLocaleString()} $CHH</span>
                </p>
              </div>
              <button 
                onClick={() => onRollGacha(gachaTab)}
                disabled={isGachaRolling || !canAfford}
                className={`w-full py-5 bg-gradient-to-b from-yellow-400 to-yellow-600 text-slate-950 rounded-2xl font-black text-xl shadow-xl shadow-yellow-900/20 transition-all ${
                  (isGachaRolling || !canAfford)
                    ? 'opacity-50 cursor-not-allowed grayscale' 
                    : 'hover:brightness-110 active:scale-95'
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
