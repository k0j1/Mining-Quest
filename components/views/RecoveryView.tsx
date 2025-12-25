
import React from 'react';
import { GameState } from '../../types';
import Header from '../Header';

interface RecoveryViewProps {
  gameState: GameState;
  onPotion: (heroId: string) => void;
  onElixir: (heroId: string) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
}

const RecoveryView: React.FC<RecoveryViewProps> = ({ gameState, onPotion, onElixir, isSoundOn, onToggleSound }) => {
  return (
    <div className="flex flex-col h-full">
       <Header 
         title="ヒーローを回復" 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
       />

       <div className="flex-1 overflow-y-auto p-4 pb-24">
          <p className="text-xs text-slate-500 mb-2">ヒーローを選択して回復アイテムを使用します</p>
          <div className="grid grid-cols-2 gap-2">
            {gameState.heroes.map((hero) => {
              const hpPercent = (hero.hp / hero.maxHp) * 100;
              const isFull = hero.hp >= hero.maxHp;
              
              return (
                <div key={hero.id} className="glass-panel p-2 rounded-xl border border-slate-700 flex flex-col gap-2 relative overflow-hidden">
                   {/* Hero Info */}
                   <div className="flex items-center gap-2">
                      <img src={hero.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-600" alt={hero.name} />
                      <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-[10px] text-slate-200 truncate leading-tight">{hero.name}</h3>
                         <div className="flex justify-between items-end mt-0.5">
                            <span className={`text-[9px] font-black ${hero.hp < 30 ? 'text-red-400' : 'text-green-400'}`}>
                               HP {hero.hp}/{hero.maxHp}
                            </span>
                         </div>
                         <div className="h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${hero.hp < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${hpPercent}%` }}></div>
                         </div>
                      </div>
                   </div>

                   {/* Action Buttons */}
                   <div className="grid grid-cols-2 gap-1.5 mt-auto">
                      <button 
                        onClick={() => onPotion(hero.id)}
                        disabled={isFull}
                        className="py-1.5 px-1 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex flex-col items-center justify-center gap-0.5"
                      >
                         <span className="text-sm">🩹</span>
                         <span className="text-[8px] font-bold text-slate-400">+10</span>
                         <span className="text-[8px] font-orbitron text-yellow-500">200</span>
                      </button>
                      
                      <button 
                         onClick={() => onElixir(hero.id)}
                         disabled={isFull}
                         className="py-1.5 px-1 bg-indigo-900/30 border border-indigo-500/30 rounded-lg hover:bg-indigo-900/50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex flex-col items-center justify-center gap-0.5"
                      >
                         <span className="text-sm">🧪</span>
                         <span className="text-[8px] font-bold text-indigo-300">MAX</span>
                         <span className="text-[8px] font-orbitron text-yellow-500">1200</span>
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
