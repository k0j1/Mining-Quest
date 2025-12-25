import React, { useState } from 'react';
import { GameState } from '../../types';
import HeroCard from '../HeroCard';
import EquipmentSelector from '../EquipmentSelector';
import { playClick, playError } from '../../utils/sound';
import Header from '../Header';

interface PartyViewProps {
  gameState: GameState;
  onEquipItem: (heroId: string, slotIndex: number, equipmentId: string | null) => void;
  onSwitchParty: (index: number) => void;
  onUnlockParty: (index: number) => void;
  onAssignHero: (slotIndex: number, heroId: string | null) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
}

const PartyView: React.FC<PartyViewProps> = ({ 
  gameState, 
  onEquipItem, 
  onSwitchParty, 
  onUnlockParty,
  onAssignHero,
  isSoundOn,
  onToggleSound,
  onDebugAddTokens
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [equippingState, setEquippingState] = useState<{ heroId: string, slotIndex: number } | null>(null);
  const [unlockingIndex, setUnlockingIndex] = useState<number | null>(null);

  const activePartyIndex = gameState.activePartyIndex;
  const currentPreset = gameState.partyPresets[activePartyIndex];
  
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);
  const isPartyLocked = currentPreset.some(id => id && activeQuestHeroIds.includes(id));

  // Get ALL heroes assigned to ANY party to filter the list
  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  // --- Handlers ---

  const handleTabClick = (idx: number) => {
    const isUnlocked = gameState.unlockedParties[idx];
    if (isUnlocked) {
      playClick();
      onSwitchParty(idx);
      // Reset selections when switching tabs
      setSelectedSlotIndex(null);
      setSelectedHeroId(null);
    } else {
      playClick();
      setUnlockingIndex(idx); // Open confirmation modal
    }
  };

  const confirmUnlock = () => {
    if (unlockingIndex === null) return;
    onUnlockParty(unlockingIndex);
    setUnlockingIndex(null);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (isPartyLocked) {
      playError();
      return;
    }
    playClick();
    
    // Case A: A hero is already selected from the list -> Place that hero into this slot
    if (selectedHeroId) {
      // Check if this hero is questing (though list logic usually prevents selecting questing heroes)
      if (activeQuestHeroIds.includes(selectedHeroId)) {
        playError();
        alert("このヒーローは現在クエスト中です");
        setSelectedHeroId(null);
        return;
      }
      onAssignHero(slotIdx, selectedHeroId);
      setSelectedHeroId(null); // Clear hero selection
      setSelectedSlotIndex(null); // Ensure slot is clear
      return;
    }

    // Case B: No hero selected -> Toggle slot selection to wait for a hero pick
    if (selectedSlotIndex === slotIdx) {
      setSelectedSlotIndex(null);
    } else {
      setSelectedSlotIndex(slotIdx);
      // If we select a slot, we shouldn't have a hero selected simultaneously in this simplified flow
      setSelectedHeroId(null);
    }
  };

  const handleHeroListClick = (heroId: string) => {
    if (isPartyLocked) {
      playError();
      return;
    }

    if (activeQuestHeroIds.includes(heroId)) {
      playError();
      alert("このヒーローは現在クエスト中です");
      return;
    }

    playClick();

    // Case A: A slot is already selected -> Place this hero into that slot
    if (selectedSlotIndex !== null) {
      onAssignHero(selectedSlotIndex, heroId);
      setSelectedSlotIndex(null); // Clear slot selection
      setSelectedHeroId(null);
      return;
    }

    // Case B: No slot selected -> Toggle hero selection
    if (selectedHeroId === heroId) {
      setSelectedHeroId(null);
    } else {
      setSelectedHeroId(heroId);
      setSelectedSlotIndex(null); // Ensure slot is clear
    }
  };

  const handleRemoveHero = (e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation();
    if (isPartyLocked) return;
    onAssignHero(slotIndex, null);
  };

  const handleEquipClick = (heroId: string, slotIndex: number) => {
    if (isPartyLocked) {
      playError();
      return;
    }
    playClick();
    setEquippingState({ heroId, slotIndex });
  };

  const handleSelectEquipment = (equipmentId: string | null) => {
    if (!equippingState) return;
    onEquipItem(equippingState.heroId, equippingState.slotIndex, equipmentId);
    setEquippingState(null);
  };

  return (
    <>
      <div className="flex flex-col h-full relative">
        <Header 
          title="パーティ編成" 
          tokens={gameState.tokens} 
          isSoundOn={isSoundOn} 
          onToggleSound={onToggleSound}
          onDebugAddTokens={onDebugAddTokens}
        >
          {/* Message Area */}
          <div className="px-4 mb-2">
            {isPartyLocked ? (
              <p className="text-[10px] text-red-400 bg-red-900/30 py-1 px-2 rounded border border-red-500/20 text-center font-bold animate-pulse">
                クエスト中のため変更不可
              </p>
            ) : (
              <p className="text-[10px] text-indigo-300 bg-indigo-900/30 py-1 px-2 rounded border border-indigo-500/20 text-center transition-all">
                 {selectedSlotIndex !== null ? (
                   <span className="animate-pulse font-bold text-white">リストから配置するヒーローを選択してください</span>
                 ) : selectedHeroId !== null ? (
                    <span className="animate-pulse font-bold text-white">配置するスロット（枠）を選択してください</span>
                 ) : (
                   "編成枠とヒーローを選んで配置"
                 )}
              </p>
            )}
          </div>

          {/* Party Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[0, 1, 2].map(idx => {
              const isUnlocked = gameState.unlockedParties[idx];
              const isActive = activePartyIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleTabClick(idx)}
                  className={`flex-1 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400'
                      : isUnlocked 
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isUnlocked ? `Party ${idx + 1}` : (
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      <span>🔒</span>
                      <span>UNLOCK</span>
                    </div>
                  )}
                  {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_5px_white]"></div>}
                </button>
              );
            })}
          </div>
        </Header>

        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          
          {/* Main Slots */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[0, 1, 2].map(slotIdx => {
              const heroId = currentPreset[slotIdx];
              const hero = heroId ? gameState.heroes.find(h => h.id === heroId) : null;
              const isSelected = selectedSlotIndex === slotIdx;

              return (
                <div key={slotIdx} className="relative group">
                  {/* Slot Label */}
                  <div className="absolute -top-2 left-0 right-0 flex justify-center z-20">
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg border whitespace-nowrap ${
                        isSelected ? 'bg-indigo-500 text-white border-white' : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>SLOT {slotIdx + 1}</span>
                  </div>

                  {hero ? (
                    <div className="relative">
                      <HeroCard 
                        hero={hero} 
                        index={slotIdx}
                        isSelected={isSelected}
                        isLocked={isPartyLocked} 
                        onClick={() => handleSlotClick(slotIdx)}
                        onEquipClick={handleEquipClick}
                        isMainSlot
                      />
                      {!isPartyLocked && (
                        <button 
                          onClick={(e) => handleRemoveHero(e, slotIdx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border border-white shadow-md z-30"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    // Empty Slot Placeholder
                    <button 
                      onClick={() => handleSlotClick(slotIdx)}
                      className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.3)] scale-105' 
                            : selectedHeroId 
                                ? 'border-indigo-500/50 bg-indigo-500/5 animate-pulse' // Highlight if hero selected
                                : 'border-slate-700 bg-slate-900/30 hover:bg-slate-800'
                      }`}
                    >
                        <span className="text-2xl opacity-30">➕</span>
                        <span className="text-[9px] text-slate-500 mt-1">EMPTY</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reserve List */}
          <div className="mt-4">
            <h2 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
              <span className="w-1 h-3 bg-slate-700 mr-2 rounded-full"></span>
              待機中のヒーロー
            </h2>
            <div className="grid grid-cols-2 gap-2">
                {gameState.heroes
                  .filter(h => !allAssignedHeroIds.includes(h.id)) // Filter out heroes equipped in ANY party
                  .map((hero, idx) => {
                    const isQuesting = activeQuestHeroIds.includes(hero.id);
                    const isHeroSelected = selectedHeroId === hero.id;

                    return (
                    <div key={hero.id} className="relative transition-transform duration-200" style={{ transform: isHeroSelected ? 'scale(1.02)' : 'scale(1)' }}>
                      <HeroCard 
                        hero={hero} 
                        index={idx} // visual index only
                        compact 
                        isLocked={isQuesting}
                        isSelected={isHeroSelected}
                        onClick={() => handleHeroListClick(hero.id)} 
                      />
                      {isQuesting && (
                        <div className="absolute top-1 right-1 bg-orange-600 text-[8px] text-white px-1 rounded shadow">
                          QUEST
                        </div>
                      )}
                    </div>
                  );
                })}
                {gameState.heroes.length === allAssignedHeroIds.length && (
                  <p className="col-span-2 text-center text-slate-600 text-xs py-4">
                    すべてのヒーローが配置されています
                  </p>
                )}
            </div>
          </div>

          {/* Equipment List (Read Only / Inventory View) */}
          <div className="mt-8 mb-8">
            <h2 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
               <span className="w-1 h-3 bg-indigo-500 mr-2 rounded-full"></span>
               所持装備一覧
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {gameState.equipment.length > 0 ? (
                gameState.equipment.map(e => {
                  const equippedHero = gameState.heroes.find(h => h.equipmentIds.includes(e.id));
                  return (
                    <div key={e.id} className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg flex items-center space-x-2 relative overflow-hidden">
                      <div className="text-xl">
                        {e.type === 'Pickaxe' ? '⛏️' : e.type === 'Helmet' ? '🪖' : '👢'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold truncate text-indigo-300">{e.name}</p>
                        <p className="text-[9px] text-slate-500">Bonus: +{e.bonus}</p>
                      </div>
                      {equippedHero && (
                        <div className="absolute top-0 right-0 bg-slate-700 text-[8px] px-1 rounded-bl text-slate-300">
                           {equippedHero.name.slice(0,4)}..
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="col-span-2 text-slate-600 text-xs italic">所持している装備はありません</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Selector Modal */}
      {equippingState && (
        <EquipmentSelector 
          hero={gameState.heroes.find(h => h.id === equippingState.heroId)!}
          slotIndex={equippingState.slotIndex}
          equipmentList={gameState.equipment}
          allHeroes={gameState.heroes}
          onSelect={handleSelectEquipment}
          onClose={() => { playClick(); setEquippingState(null); }}
        />
      )}

      {/* Party Unlock Confirmation Modal */}
      {unlockingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl transform transition-all scale-100">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                   🔒
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Party {unlockingIndex + 1} を解放</h3>
                <p className="text-slate-400 text-xs mb-6">
                  新しいパーティ編成スロットを解放します。<br/>
                  コスト: <span className="text-yellow-400 font-bold">10,000 $CHH</span>
                </p>

                <div className="flex gap-3">
                   <button 
                     onClick={() => { playClick(); setUnlockingIndex(null); }}
                     className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700"
                   >
                     キャンセル
                   </button>
                   <button 
                     onClick={confirmUnlock}
                     disabled={gameState.tokens < 10000}
                     className={`flex-1 py-3 rounded-xl font-bold text-sm text-slate-900 shadow-lg ${
                       gameState.tokens >= 10000 
                         ? 'bg-yellow-500 hover:bg-yellow-400' 
                         : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                     }`}
                   >
                     {gameState.tokens >= 10000 ? '解放する' : '資金不足'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PartyView;