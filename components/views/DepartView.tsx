
import React, { useState } from 'react';
import { GameState, QuestRank, QuestConfig, Hero } from '../../types';
import PartySlotGrid from '../PartySlotGrid';
import { playClick, playError } from '../../utils/sound';
import Header from '../Header';
import { IS_TEST_MODE } from '../../constants';

interface PredictionResult {
    minReward: number;
    maxReward: number;
    estimatedDuration: number;
    minDmg: number;
    maxDmg: number;
    bonusPercent: number;
    timeReductionPercent: number;
    avgDamageReduction: number;
    breakdown: {
      reward: { hero: number; equip: number; };
      time: { hero: number; equip: number; };
    };
}

interface DepartViewProps {
  gameState: GameState;
  onDepart: (rank: QuestRank) => Promise<boolean>;
  onSwitchParty: (index: number) => void;
  getQuestPrediction?: (config: QuestConfig, partyHeroes: Hero[]) => PredictionResult;
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
  getQuestPrediction,
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens,
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  const [selectedRank, setSelectedRank] = useState<QuestRank | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = (rank: QuestRank) => {
    playClick();
    setSelectedRank(rank);
  };

  const handleCancel = () => {
    playClick();
    setSelectedRank(null);
  };

  const handleConfirm = async () => {
    if (selectedRank && !isProcessing) {
      setIsProcessing(true);
      const success = await onDepart(selectedRank);
      setIsProcessing(false);
      if (success) setSelectedRank(null);
    }
  };

  // Get heroes from current active preset
  const activePresetIds = gameState.partyPresets[gameState.activePartyIndex];
  const mainParty = activePresetIds
    .map(id => gameState.heroes.find(h => h.id === id))
    .filter((h): h is Hero => !!h);

  const isPartyFull = mainParty.length === 3;
  const currentRankConfig = selectedRank ? gameState.questConfigs.find(q => q.rank === selectedRank) : null;
  const canAfford = currentRankConfig ? gameState.tokens >= currentRankConfig.burnCost : false;
  const hasDeadHeroes = mainParty.some(h => h.hp <= 0);

  // Check if current active party is already questing (though redundant with selector check, good for safety)
  const isCurrentPartyQuesting = activePresetIds.some(id => 
    id && gameState.activeQuests.some(q => q.heroIds.includes(id))
  );

  // Calculate Prediction
  let prediction: PredictionResult | null = null;
  if (currentRankConfig && isPartyFull && getQuestPrediction) {
      prediction = getQuestPrediction(currentRankConfig, mainParty);
  }

  // Rarity styling maps
  const rankColors: Record<string, string> = {
    C: 'border-slate-700 bg-slate-800',
    UC: 'border-emerald-700/50 bg-emerald-900/10',
    R: 'border-indigo-700/50 bg-indigo-900/10',
    E: 'border-orange-700/50 bg-orange-900/10',
    L: 'border-purple-700/50 bg-purple-900/10'
  };
  const rankBadges: Record<string, string> = {
    C: 'bg-slate-600',
    UC: 'bg-emerald-600',
    R: 'bg-indigo-600',
    E: 'bg-orange-600',
    L: 'bg-purple-600'
  };

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
          <div className="mb-2 relative rounded-2xl overflow-hidden shadow-md border border-slate-700">
            <img 
              src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Quest.png" 
              alt="Quest Banner" 
              className="w-full h-auto"
            />
            {IS_TEST_MODE && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/10">
                  <span className="text-3xl font-black text-white/30 -rotate-12 border-4 border-white/30 px-4 py-2 rounded-xl uppercase tracking-widest backdrop-blur-[1px]">
                     TEST MODE
                  </span>
               </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-2 font-bold">難易度を選択してクエストに出発します</p>
          
          {gameState.questConfigs.length === 0 && (
             <div className="text-center py-10 text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading Quests...
             </div>
          )}

          {gameState.questConfigs.map((config) => {
            const rank = config.rank;
            return (
              <button
                key={rank}
                onClick={() => handleSelect(rank)}
                className={`w-full text-left relative group overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98] hover:shadow-md ${rankColors[rank] || rankColors['C']}`}
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center space-x-2">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${rankBadges[rank] || rankBadges['C']}`}>{rank}</span>
                     <h3 className="font-bold text-slate-100 text-sm">{config.name}</h3>
                   </div>
                   <div className="text-right">
                     <span className="block text-[9px] text-slate-500 font-bold mb-0.5">TIME</span>
                     <span className="font-bold text-slate-300 text-xs">{Math.floor(config.duration / 60)} min</span>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                   <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                     <p className="text-slate-500 font-bold mb-0.5 text-[9px]">報酬</p>
                     <p className="text-amber-500 font-bold">{config.minReward}-{config.maxReward}</p>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                     <p className="text-slate-500 font-bold mb-0.5 text-[9px]">ダメージ</p>
                     <p className="text-rose-400 font-bold">{config.minDmg}-{config.maxDmg}</p>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                     <p className="text-slate-500 font-bold mb-0.5 text-[9px]">コスト</p>
                     <p className="text-slate-200 font-bold">{config.burnCost} $CHH</p>
                   </div>
                </div>
              </button>
            );
          })}
       </div>

       {/* Confirmation Modal - Adjusted z-index and padding to avoid bottom nav overlap */}
       {selectedRank && currentRankConfig && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pb-[calc(env(safe-area-inset-bottom)+6rem)]">
           <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
             <div className="p-4 border-b border-slate-800 bg-slate-900 text-center shrink-0">
               <h2 className="text-lg font-bold text-white">出撃確認</h2>
             </div>
             
             <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="text-center mb-6">
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Target Destination</p>
                 <h3 className="text-xl font-bold text-white mb-3">{currentRankConfig.name}</h3>
                 <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                   <span className={`font-bold mr-2 text-sm ${
                      selectedRank === 'C' ? 'text-slate-400' :
                      selectedRank === 'UC' ? 'text-emerald-400' :
                      selectedRank === 'R' ? 'text-indigo-400' :
                      selectedRank === 'E' ? 'text-orange-400' :
                      'text-purple-400'
                   }`}>{selectedRank} RANK</span>
                   <span className={`text-xs font-bold border-l border-slate-700 pl-2 ${canAfford ? 'text-slate-400' : 'text-rose-500'}`}>
                     Cost: {currentRankConfig.burnCost} $CHH
                   </span>
                 </div>
               </div>
               
               {/* --- PREDICTION PANEL --- */}
               {prediction && (
                 <div className="mb-6 bg-slate-800/50 rounded-xl border border-slate-700 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🔮</div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
                        Mission Forecast (Bonus Active)
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {/* Reward Forecast */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">報酬予測</span>
                                <div className="text-right">
                                    <span className="text-amber-500 font-bold text-sm">
                                        {prediction.minReward} - {prediction.maxReward}
                                    </span>
                                    {prediction.bonusPercent > 0 && (
                                        <span className="ml-2 text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                            +{prediction.bonusPercent}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {prediction.bonusPercent > 0 && (
                                <div className="text-right text-[8px] text-slate-500 font-bold mt-0.5">
                                    (Hero: +{prediction.breakdown?.reward.hero}% / Equip: +{prediction.breakdown?.reward.equip}%)
                                </div>
                            )}
                        </div>

                        {/* Damage Forecast */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400">被ダメージ予測</span>
                            <div className="text-right">
                                <span className="text-rose-400 font-bold text-sm">
                                    {prediction.minDmg} - {prediction.maxDmg}
                                </span>
                                {prediction.avgDamageReduction > 0 && (
                                    <span className="ml-2 text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                        -{prediction.avgDamageReduction}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Duration Forecast */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">所要時間</span>
                                <div className="text-right">
                                    <span className="text-blue-400 font-bold text-sm">
                                        {Math.floor(prediction.estimatedDuration / 60)} min
                                    </span>
                                    {prediction.timeReductionPercent > 0 && (
                                        <span className="ml-2 text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                            -{prediction.timeReductionPercent}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {prediction.timeReductionPercent > 0 && (
                                <div className="text-right text-[8px] text-slate-500 font-bold mt-0.5">
                                    (Hero: -{prediction.breakdown?.time.hero}% / Equip: -{prediction.breakdown?.time.equip}%)
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
               )}

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
                      
                      // Check if this party is busy
                      const partyHeroIds = gameState.partyPresets[idx].filter(id => id !== null);
                      const isQuesting = partyHeroIds.length > 0 && partyHeroIds.some(id => 
                          gameState.activeQuests.some(q => q.heroIds.includes(id as string))
                      );

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isUnlocked && !isQuesting) {
                                playClick();
                                onSwitchParty(idx);
                            } else if (isQuesting) {
                                playError();
                            }
                          }}
                          className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-0.5 ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : isUnlocked && !isQuesting
                                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isUnlocked ? `Party ${idx + 1}` : '🔒'}
                          {isQuesting && <span className="text-[8px] text-emerald-500">任務中</span>}
                        </button>
                      );
                    })}
                 </div>

                 {!isPartyFull ? (
                    <div className="text-center p-4 border border-dashed border-rose-800/50 bg-rose-900/10 rounded-xl">
                      <p className="text-rose-400 font-bold text-sm">メンバーが足りません</p>
                      <p className="text-xs text-rose-300/70 mt-1">クエストには3名のヒーローが必要です</p>
                    </div>
                 ) : isCurrentPartyQuesting ? (
                    <div className="text-center p-4 border border-dashed border-emerald-800/50 bg-emerald-900/10 rounded-xl">
                      <p className="text-emerald-400 font-bold text-sm">このパーティは任務中です</p>
                      <p className="text-xs text-emerald-300/70 mt-1">別のパーティを選択してください</p>
                    </div>
                 ) : (
                    <div className="pointer-events-none transform scale-95">
                      <PartySlotGrid
                        heroIds={activePresetIds}
                        heroes={gameState.heroes}
                        readOnly={true}
                        showSlotLabels={false}
                        className="grid grid-cols-3 gap-3"
                        compactEmpty={true}
                      />
                    </div>
                 )}
                 {hasDeadHeroes && (
                   <p className="text-rose-400 text-xs text-center mt-4 font-bold">
                     ⚠️ HPが0のヒーローがいます！出発できません。
                   </p>
                 )}
               </div>
             </div>

             <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3 shrink-0">
               <button 
                 onClick={handleCancel}
                 className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold hover:bg-slate-600 transition-all text-sm"
               >
                 キャンセル
               </button>
               <button 
                 onClick={handleConfirm}
                 disabled={!isPartyFull || isProcessing || isCurrentPartyQuesting || hasDeadHeroes}
                 className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-all text-sm ${
                    !isPartyFull || isProcessing || isCurrentPartyQuesting || hasDeadHeroes
                      ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                      : !canAfford 
                        ? 'bg-rose-600 hover:bg-rose-500' // Red for unaffordable but clickable
                        : 'bg-indigo-600 hover:bg-indigo-500'
                 }`}
               >
                 {isProcessing ? '処理中...' : !isPartyFull ? 'メンバー不足' : isCurrentPartyQuesting ? '出撃中' : (!canAfford ? '資金不足' : '出発する')}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DepartView;
