
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
}

const DepartView: React.FC<DepartViewProps> = ({ gameState, onDepart, onSwitchParty, isSoundOn, onToggleSound, onDebugAddTokens }) => {
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
    <div className="flex flex-col h-full relative">
       <Header 
         title="出発ゲート" 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
       />

       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          
          {/* Banner for QUEST */}
          <div className="mb-2">
            <img 
              src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Quest.png" 
              alt="Quest Banner" 
              className="w-full h-auto rounded-2xl shadow-lg border border-white/10"
            />
          </div>

          <p className="text-xs text-slate-500 mb-2">難易度を選択してクエストに出発します</p>
          {(Object.keys(QUEST_CONFIG) as QuestRank[]).map((rank) => {
            const config = QUEST_CONFIG[rank];
            const rankColors: Record<QuestRank, string> = {
              C: 'border-slate-600 bg-slate-900/50',
              UC: 'border-green-600 bg-green-900/20',
              R: 'border-blue-600 bg-blue-900/20',
              E: 'border-orange-600 bg-orange-900/20',
              L: 'border-purple-600 bg-purple-900/20'
            };
            const rankBadges: Record<QuestRank, string> = {
              C: 'bg-slate-600',
              UC: 'bg-green-600',
              R: 'bg-blue-600',
              E: 'bg-orange-600',
              L: 'bg-purple-600'
            };

            return (
              <button
                key={rank}
                onClick={() => handleSelect(rank)}
                className={`w-full text-left relative group overflow-hidden rounded-xl border-l-4 p-4 transition-all hover:translate-x-1 active:scale-95 ${rankColors[rank]}`}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center space-x-2">
                     <span className={`text-xs font-black px-2 py-0.5 rounded text-white ${rankBadges[rank]}`}>{rank}</span>
                     <h3 className="font-bold text-slate-200">{config.name}</h3>
                   </div>
                   <div className="text-right">
                     <span className="block text-[10px] text-slate-400 font-mono">所要時間</span>
                     <span className="font-orbitron font-bold text-indigo-300">{Math.floor(config.duration / 60)}m</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                   <div className="bg-slate-950/50 p-2 rounded">
                     <p className="text-slate-500">報酬レンジ</p>
                     <p className="text-yellow-400 font-bold">{config.minReward} - {config.maxReward} $CHH</p>
                   </div>
                   <div className="bg-slate-950/50 p-2 rounded">
                     <p className="text-slate-500">出発コスト</p>
                     <p className="text-white font-bold">{config.burnCost} $CHH</p>
                   </div>
                   <div className="bg-slate-950/50 p-2 rounded col-span-2">
                     <p className="text-slate-500">被ダメージ/人</p>
                     <p className="text-red-400 font-bold">{config.minDmg} - {config.maxDmg}</p>
                   </div>
                </div>
              </button>
            );
          })}
       </div>

       {/* Confirmation Modal */}
       {selectedRank && (
         <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
           <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-slate-800 bg-slate-900/50">
               <h2 className="text-xl font-orbitron font-bold text-white text-center">出撃確認</h2>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <div className="text-center mb-6">
                 <p className="text-slate-400 text-xs mb-1">DESTINATION</p>
                 <h3 className="text-2xl font-bold text-white mb-2">{QUEST_CONFIG[selectedRank].name}</h3>
                 <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                   <span className={`font-black mr-2 ${
                      selectedRank === 'C' ? 'text-slate-400' :
                      selectedRank === 'UC' ? 'text-green-400' :
                      selectedRank === 'R' ? 'text-blue-400' :
                      selectedRank === 'E' ? 'text-orange-400' :
                      'text-purple-400'
                   }`}>{selectedRank} RANK</span>
                   <span className="text-slate-400 text-xs">必要コスト: {QUEST_CONFIG[selectedRank].burnCost} $CHH</span>
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
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105'
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
                    <div className="text-center p-4 border border-dashed border-red-500/50 bg-red-900/10 rounded-xl">
                      <p className="text-red-400 font-bold">メンバーがいません！</p>
                      <p className="text-xs text-red-300">編成画面でヒーローを設定してください</p>
                    </div>
                 ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {displayParty.map((hero, index) => (
                      <div key={index} className="pointer-events-none transform scale-95 relative">
                          {hero ? (
                            <HeroCard 
                              hero={hero} 
                              index={index} 
                              isMainSlot 
                            />
                          ) : (
                             <div className="w-full aspect-square bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center">
                               <span className="text-slate-600 text-xs">EMPTY</span>
                             </div>
                          )}
                      </div>
                    ))}
                  </div>
                 )}
                 {mainParty.some(h => h.hp <= 0) && (
                   <p className="text-red-400 text-xs text-center mt-3 font-bold animate-pulse">
                     ⚠️ HPが0のヒーローがいます！出発できません。
                   </p>
                 )}
               </div>

               <p className="text-center text-slate-300 text-sm">
                 このメンバーでクエストを開始しますか？
               </p>
             </div>

             <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-3">
               <button 
                 onClick={handleCancel}
                 className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all"
               >
                 キャンセル
               </button>
               <button 
                 onClick={handleConfirm}
                 disabled={mainParty.length === 0}
                 className={`flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg transition-all ${
                    mainParty.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:brightness-110'
                 }`}
               >
                 出発する！
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DepartView;
