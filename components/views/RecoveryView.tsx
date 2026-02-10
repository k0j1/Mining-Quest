
import React from 'react';
import { GameState, Hero } from '../../types';
import Header from '../Header';
import { playClick } from '../../utils/sound';

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
  
  // Get list of heroes assigned to any party
  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  // Split heroes into groups
  const assignedHeroes = gameState.heroes.filter(h => allAssignedHeroIds.includes(h.id));
  const unassignedHeroes = gameState.heroes.filter(h => !allAssignedHeroIds.includes(h.id));

  // Render Helper for Hero Card
  const renderHeroCard = (hero: Hero) => {
    const hpPercent = (hero.hp / hero.maxHp) * 100;
    const isFull = hero.hp >= hero.maxHp;
    const isQuesting = activeQuestHeroIds.includes(hero.id);
    const isAssigned = allAssignedHeroIds.includes(hero.id);
    
    const canAffordPotion = gameState.tokens >= 100;
    const canAffordElixir = gameState.tokens >= 500;

    return (
      <div key={hero.id} className={`bg-slate-800/80 rounded-xl border flex flex-col relative overflow-hidden transition-all group ${
          isQuesting 
            ? 'border-slate-800 opacity-60' 
            : isAssigned 
                ? 'border-indigo-500/30 shadow-sm' 
                : 'border-slate-700'
      }`}>
          {/* Questing Overlay */}
          {isQuesting && (
            <div className="absolute inset-0 bg-slate-950/70 z-20 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[8px] font-black text-amber-500 border border-amber-500/30 bg-amber-950/90 px-1.5 py-0.5 rounded uppercase tracking-wider transform -rotate-6">
                  MISSION
              </span>
            </div>
          )}

          {/* Top: Image & Status */}
          <div className="relative aspect-square w-full bg-slate-900">
              <img 
                src={hero.imageUrl} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                alt={hero.name} 
              />
              
              {/* HP Badge */}
              <div className="absolute top-1 right-1 bg-black/60 px-1 rounded backdrop-blur-sm border border-white/10">
                  <span className={`text-[8px] font-bold ${hero.hp < hero.maxHp * 0.3 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                      HP {hero.hp}
                  </span>
              </div>

              {/* Party Badge */}
              {isAssigned && !isQuesting && (
                  <div className="absolute top-1 left-1 bg-indigo-600/90 px-1 py-0.5 rounded text-[7px] font-black text-white border border-white/10 shadow-sm">
                      PT
                  </div>
              )}
          </div>

          {/* Bottom: Info & Actions */}
          <div className="p-2 flex flex-col gap-1.5 bg-slate-800/90">
              <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-[9px] text-slate-200 truncate">{hero.name}</h3>
                  {/* HP Bar */}
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50 w-full">
                      <div 
                        className={`h-full transition-all duration-500 ${hero.hp < hero.maxHp * 0.3 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${hpPercent}%` }}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-1 mt-0.5">
                  {/* Potion Button */}
                  <button 
                    onClick={() => onPotion(hero.id)}
                    disabled={isFull || isQuesting} 
                    className={`h-8 rounded-lg flex flex-col items-center justify-center border transition-all active:scale-95 ${
                        isFull || isQuesting 
                          ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed grayscale' 
                          : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                    }`}
                    title="Potion (+10 HP)"
                  >
                      <span className="text-xs leading-none">🩹</span>
                      <span className={`text-[8px] font-bold leading-tight ${canAffordPotion ? 'text-slate-300' : 'text-rose-500'}`}>100</span>
                  </button>
                  
                  {/* Elixir Button */}
                  <button 
                      onClick={() => onElixir(hero.id)}
                      disabled={isFull || isQuesting} 
                      className={`h-8 rounded-lg flex flex-col items-center justify-center border transition-all active:scale-95 ${
                          isFull || isQuesting
                            ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed grayscale'
                            : 'bg-indigo-900/40 border-indigo-500/40 hover:bg-indigo-900/60 hover:border-indigo-400/60'
                      }`}
                      title="Elixir (Full Heal)"
                  >
                      <span className="text-xs leading-none">🧪</span>
                      <span className={`text-[8px] font-bold leading-tight ${canAffordElixir ? 'text-indigo-300' : 'text-rose-500'}`}>500</span>
                  </button>
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
       <Header 
         title="RECOVERY" 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
         farcasterUser={farcasterUser}
         onChainBalance={onChainBalance}
         onAccountClick={onAccountClick}
       />

       <div className="flex-1 overflow-y-auto px-3 py-4 pb-24 bg-slate-900 custom-scrollbar">
          
          {/* Section: Party Members */}
          {assignedHeroes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Party Members</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {assignedHeroes.map(renderHeroCard)}
                </div>
            </div>
          )}

          {/* Section: Standby */}
          <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-1.5 h-4 bg-slate-600 rounded-full"></span>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standby</h2>
              </div>
              
              {unassignedHeroes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                      {unassignedHeroes.map(renderHeroCard)}
                  </div>
              ) : (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs font-bold">
                      NO HEROES
                  </div>
              )}
          </div>

       </div>
    </div>
  );
};

export default RecoveryView;
