
import React, { useState } from 'react';
import { GameState, QuestRank } from '../../types';
import { QUEST_CONFIG } from '../../constants';
import HeroCard from '../HeroCard';
import { playClick } from '../../utils/sound';

interface DepartViewProps {
  gameState: GameState;
  onDepart: (rank: QuestRank) => boolean;
}

const DepartView: React.FC<DepartViewProps> = ({ gameState, onDepart }) => {
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
      // onDepart returns true if success. Parent component handles view change.
      // If false (error), we close modal so user can fix issue.
      const success = onDepart(selectedRank);
      if (!success) {
        setSelectedRank(null);
      }
    }
  };

  const mainParty = gameState.heroes.slice(0, 3);

  return (
    <div className="flex flex-col h-full relative">
       {/* Sticky Header */}
       <div className="p-6 bg-slate-900/80 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md flex-none">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-orbitron font-bold text-indigo-300">出発ゲート</h1>
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <span className="text-yellow-400 text-sm font-black">$CHH:</span>
              <span className="font-orbitron text-lg font-bold">{gameState.tokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
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
                 <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest text-center">
                   現在の編成
                 </p>
                 <div className="grid grid-cols-3 gap-2">
                   {mainParty.map((hero, index) => (
                     <div key={hero.id} className="pointer-events-none transform scale-95">
                        <HeroCard 
                           hero={hero} 
                           index={index} 
                           isMainSlot 
                         />
                     </div>
                   ))}
                 </div>
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
                 className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition-all"
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
