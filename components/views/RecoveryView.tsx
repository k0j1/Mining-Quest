
import React from 'react';
import { GameState } from '../../types';
import Header from '../Header';

interface RecoveryViewProps {
  gameState: GameState;
  onPotion: (heroId: string) => void;
  onElixir: (heroId: string) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

const RecoveryView: React.FC<RecoveryViewProps> = ({ 
  gameState, 
  onPotion, 
  onElixir, 
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens,
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  // Get list of heroes currently on quests
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);

  return (
    <div className="flex flex-col h-full bg-slate-900">
       <Header 
         title="ヒーローを回復" 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
         farcasterUser={farcasterUser}
         onChainBalance={onChainBalance}
         onAccountClick={onAccountClick}
       />

       <div className="flex-1 overflow-y-auto p-4 pb-24 bg-slate-900 custom-scrollbar">
          <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wide">
            Select Hero to Recover
          </p>
          <div className="grid grid-cols-2 gap-3">
            {gameState.heroes.map((hero) => {
              const hpPercent = (hero.hp / hero.maxHp) * 100;
              const isFull = hero.hp >= hero.maxHp;
              const isQuesting = activeQuestHeroIds.includes(hero.id);
              
              const canAffordPotion = gameState.tokens >= 100;
              const canAffordElixir = gameState.tokens >= 500;

              return (
                <div key={hero.id} className={`glass-panel p-2.5 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all ${isQuesting ? 'border-slate-800 bg-slate-900/40 opacity-70' : 'border-slate-700 bg-slate-800/60'}`}>
                   {/* Questing Overlay */}
                   {isQuesting && (
                     <div className="absolute inset-0 bg-slate-950/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-[10px] font-black text-amber-500 border border-amber-500/30 bg-amber-950/80 px-2 py-1 rounded uppercase tracking-wider shadow-lg transform -rotate-6">
                           On Mission
                        </span>
                     </div>
                   )}

                   {/* Hero Info */}
                   <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 shrink-0">
                        <img src={hero.imageUrl} className="w-full h-full rounded-lg object-cover border border-slate-600 bg-slate-900" alt={hero.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-[10px] text-slate-200 truncate leading-tight mb-1">{hero.name}</h3>
                         <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-black ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                               HP {hero.hp}/{hero.maxHp}
                            </span>
                         </div>
                         <div className="h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden border border-slate-700/50">
                            <div className={`h-full transition-all duration-500 ${hero.hp < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${hpPercent}%` }}></div>
                         </div>
                      </div>
                   </div>

                   {/* Action Buttons */}
                   <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
                      <button 
                        onClick={() => onPotion(hero.id)}
                        disabled={isFull || isQuesting} 
                        className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 border ${
                            isFull || isQuesting 
                              ? 'bg-slate-800 border-slate-800 opacity-40 cursor-not-allowed' 
                              : 'bg-slate-800 border-slate-600 hover:bg-slate-700 active:scale-95 hover:border-slate-500'
                        }`}
                      >
                         <span className="text-sm leading-none mb-0.5">🩹</span>
                         <span className="text-[8px] font-bold text-slate-300 leading-none">+10</span>
                         <span className={`text-[8px] font-orbitron font-bold mt-0.5 ${canAffordPotion ? 'text-amber-500' : 'text-rose-500'}`}>100</span>
                      </button>
                      
                      <button 
                         onClick={() => onElixir(hero.id)}
                         disabled={isFull || isQuesting} 
                         className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 border ${
                             isFull || isQuesting
                               ? 'bg-slate-800 border-slate-800 opacity-40 cursor-not-allowed'
                               : 'bg-indigo-900/30 border-indigo-500/30 hover:bg-indigo-900/50 active:scale-95 hover:border-indigo-400/50'
                         }`}
                      >
                         <span className="text-sm leading-none mb-0.5">🧪</span>
                         <span className="text-[8px] font-bold text-indigo-300 leading-none">MAX</span>
                         <span className={`text-[8px] font-orbitron font-bold mt-0.5 ${canAffordElixir ? 'text-amber-500' : 'text-rose-500'}`}>500</span>
                      </button>
                   </div>
                </div>
              );
            })}
          </div>
       </div>
    </div>
  );
};

export default RecoveryView;
