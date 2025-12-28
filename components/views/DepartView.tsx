
import React, { useState } from 'react';
import { GameState, QuestRank } from '../../types';
import { QUEST_CONFIG } from '../../constants';
import HeroCard from '../HeroCard';
import { playClick } from '../../utils/sound';
import Header from '../Header';

interface DepartViewProps {
  gameState: GameState;
  onDepart: (rank: QuestRank) => boolean;
  onSwitchParty: (index: number) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

const DepartView: React.FC<DepartViewProps> = ({ 
  gameState, 
  onDepart, 
  onSwitchParty, 
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens,
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  const [selectedRank, setSelectedRank] = useState<QuestRank | null>(null);

  const handleSelect = (rank: QuestRank) => {
    playClick();
    setSelectedRank(rank);
  };

  const handleCancel = () => {
    playClick();
    setSelectedRank(null);
  };

  const handleConfirm = () => {
    if (selectedRank) {
      const success = onDepart(selectedRank);
      if (!success) {
        setSelectedRank(null);
      }
    }
  };

  // Get heroes from current active preset
  const activePresetIds = gameState.partyPresets[gameState.activePartyIndex];
  const mainParty = activePresetIds
    .map(id => gameState.heroes.find(h => h.id === id))
    .filter((h): h is any => !!h);

  // Pad with nulls for display if party is not full
  const displayParty = [...mainParty];
  while (displayParty.length < 3) {
      displayParty.push(null as any);
  }

  return (
    <div className="flex flex-col h-full relative bg-slate-900">
       <Header 
         title="クエスト" 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
         farcasterUser={farcasterUser}
         onChainBalance={onChainBalance}
         onAccountClick={onAccountClick}
       />

       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 bg-slate-900">
          
          {/* Banner for QUEST */}
          <div className="mb-2">
            <img 
              src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Quest.png" 
              alt="Quest Banner" 
              className="w-full h-auto rounded-2xl shadow-md border border-slate-700"
            />
          </div>

          <p className="text-xs text-slate-500 mb-2 font-bold">難易度を選択してクエストに出発します</p>
          {(Object.keys(QUEST_CONFIG) as QuestRank[]).map((rank) => {
            const config = QUEST_CONFIG[rank];
            const rankColors: Record<QuestRank, string> = {
              C: 'border-slate-700 bg-slate-800',
              UC: 'border-emerald-700/50 bg-emerald-900/10',
              R: 'border-indigo-700/50 bg-indigo-900/10',
              E: 'border-orange-700/50 bg-orange-900/10',
              L: 'border-purple-700/50 bg-purple-900/10'
            };
            const rankBadges: Record<QuestRank, string> = {
              C: 'bg-slate-600',
              UC: 'bg-emerald-600',
              R: 'bg-indigo-600',
              E: 'bg-orange-600',
              L: 'bg-purple-600'
            };

            return (
              <button
                key={rank}
                onClick={() => handleSelect(rank)}
                className={`w-full text-left relative group overflow-hidden rounded-xl border p-5 transition-all active:scale-[0.98] hover:shadow-md ${rankColors[rank]}`}
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center space-x-3">
                     <span className={`text-xs font-black px-2 py-0.5 rounded text-white ${rankBadges[rank]}`}>{rank}</span>
                     <h3 className="font-bold text-slate-100 text-sm">{config.name}</h3>
                   </div>
                   <div className="text-right">
                     <span className="block text-[10px] text-slate-500 font-bold mb-0.5">TIME</span>
                     <span className="font-bold text-slate-300 text-sm">{Math.floor(config.duration / 60)} min</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] sm:text-xs">
                   <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                     <p className="text-slate-500 font-bold mb-1">報酬レンジ</p>
                     <p className="text-amber-500 font-bold text-sm">{config.minReward} - {config.maxReward}</p>
                   </div>
                   <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                     <p className="text-slate-500 font-bold mb-1">コスト</p>
                     <p className="text-slate-200 font-bold text-sm">{config.burnCost} $CHH</p>
                   </div>
                </div>
              </button>
            );
          })}
       </div>

       {/* Confirmation Modal */}
       {selectedRank && (
         <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
             <div className="p-4 border-b border-slate-800 bg-slate-900 text-center">
               <h2 className="text-lg font-bold text-white">出撃確認</h2>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <div className="text-center mb-6">
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Target Destination</p>
                 <h3 className="text-xl font-bold text-white mb-3">{QUEST_CONFIG[selectedRank].name}</h3>
                 <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                   <span className={`font-bold mr-2 text-sm ${
                      selectedRank === 'C' ? 'text-slate-400' :
                      selectedRank === 'UC' ? 'text-emerald-400' :
                      selectedRank === 'R' ? 'text-indigo-400' :
                      selectedRank === 'E' ? 'text-orange-400' :
                      'text-purple-400'
                   }`}>{selectedRank} RANK</span>
                   <span className="text-slate-400 text-xs font-bold border-l border-slate-700 pl-2">Cost: {QUEST_CONFIG[selectedRank].burnCost} $CHH</span>
                 </div>
               </div>

               <div className="mb-6">
                 <div className="flex justify-between items-end mb-3">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                     SELECT PARTY
                   </p>
                 </div>
                 
                 {/* Party Selection Tabs */}
                 <div className="flex gap-2 mb-4">
                    {[0, 1, 2].map(idx => {
                      const isUnlocked = gameState.unlockedParties[idx];
                      const isActive = gameState.activePartyIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isUnlocked) {
                                playClick();
                                onSwitchParty(idx);
                            }
                          }}
                          className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : isUnlocked 
                                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isUnlocked ? `Party ${idx + 1}` : '🔒'}
                        </button>
                      );
                    })}
                 </div>

                 {mainParty.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-rose-800/50 bg-rose-900/10 rounded-xl">
                      <p className="text-rose-400 font-bold text-sm">メンバーがいません</p>
                      <p className="text-xs text-rose-300/70 mt-1">編成画面でヒーローを設定してください</p>
                    </div>
                 ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {displayParty.map((hero, index) => (
                      <div key={index} className="pointer-events-none transform scale-95 relative">
                          {hero ? (
                            <HeroCard 
                              hero={hero} 
                              index={index} 
                              isMainSlot 
                            />
                          ) : (
                             <div className="w-full aspect-square bg-slate-800 rounded-xl border border-slate-700 border-dashed flex items-center justify-center">
                               <span className="text-slate-600 text-[10px] font-bold uppercase">Empty</span>
                             </div>
                          )}
                      </div>
                    ))}
                  </div>
                 )}
                 {mainParty.some(h => h.hp <= 0) && (
                   <p className="text-rose-400 text-xs text-center mt-4 font-bold">
                     ⚠️ HPが0のヒーローがいます！出発できません。
                   </p>
                 )}
               </div>
             </div>

             <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3">
               <button 
                 onClick={handleCancel}
                 className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold hover:bg-slate-600 transition-all text-sm"
               >
                 キャンセル
               </button>
               <button 
                 onClick={handleConfirm}
                 disabled={mainParty.length === 0}
                 className={`flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md transition-all text-sm ${
                    mainParty.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'
                 }`}
               >
                 出発する
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DepartView;
