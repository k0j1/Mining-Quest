
import React, { useState } from 'react';
import { GameState } from '../../types';
import HeroCard from '../HeroCard';
import EquipmentSelector from '../EquipmentSelector';
import { playClick, playError } from '../../utils/sound';

interface PartyViewProps {
  gameState: GameState;
  onSwapHeroes: (index1: number, index2: number) => void;
  onEquipItem: (heroId: string, slotIndex: number, equipmentId: string | null) => void;
}

const PartyView: React.FC<PartyViewProps> = ({ gameState, onSwapHeroes, onEquipItem }) => {
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null);
  const [equippingState, setEquippingState] = useState<{ heroId: string, slotIndex: number } | null>(null);

  // Check if any quest is active. If so, main party is locked.
  const isQuestActive = gameState.activeQuests.length > 0;

  const handleHeroClick = (index: number) => {
    // If quest is active, main party slots (0-2) are locked and cannot be selected/swapped
    if (isQuestActive && index < 3) {
      playError();
      return;
    }

    playClick();
    if (selectedHeroIndex === null) {
      setSelectedHeroIndex(index);
    } else if (selectedHeroIndex === index) {
      setSelectedHeroIndex(null);
    } else {
      // If trying to swap into a locked slot (though locked slots shouldn't be selectable as first target)
      if (isQuestActive && (selectedHeroIndex < 3 || index < 3)) {
         playError();
         setSelectedHeroIndex(null);
         return;
      }

      onSwapHeroes(selectedHeroIndex, index);
      setSelectedHeroIndex(null);
    }
  };

  const handleEquipClick = (heroId: string, slotIndex: number) => {
    // Already handled by isLocked prop on HeroCard, but double check
    if (isQuestActive) {
      const heroIndex = gameState.heroes.findIndex(h => h.id === heroId);
      if (heroIndex < 3) {
        playError();
        return;
      }
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
      <div className="p-4 h-full overflow-y-auto pb-24">
        <h1 className="text-xl font-orbitron font-bold text-indigo-300 mb-1">パーティ編成</h1>
        
        {isQuestActive ? (
          <p className="text-[10px] text-red-400 mb-6 bg-red-900/30 p-2 rounded border border-red-500/20 inline-block font-bold animate-pulse">
            ⚠️ クエスト進行中は主力メンバー（SLOT 1-3）の変更・装備変更はできません
          </p>
        ) : (
          <p className="text-[10px] text-yellow-400 mb-6 bg-slate-900/60 p-2 rounded border border-yellow-500/20 inline-block">
            ※ ヒーローと装備スロットタップで入れ替えできます
          </p>
        )}
        
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
          {gameState.heroes.slice(0, 3).map((hero, idx) => (
            <div key={hero.id} className="relative">
              <div className="absolute -top-2 left-0 right-0 flex justify-center z-20">
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg border whitespace-nowrap ${
                  isQuestActive 
                    ? 'bg-slate-700 text-slate-400 border-slate-600' 
                    : 'bg-indigo-600 text-white border-indigo-400'
                }`}>
                  SLOT {idx + 1}
                </span>
              </div>
              <HeroCard 
                hero={hero} 
                index={idx}
                isSelected={selectedHeroIndex === idx}
                isLocked={isQuestActive} // Lock if quest active
                onClick={() => handleHeroClick(idx)}
                onEquipClick={handleEquipClick}
                isMainSlot
              />
            </div>
          ))}
        </div>

        <div className="mt-8 mb-8">
          <h2 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
            <span className="w-1 h-3 bg-slate-700 mr-2 rounded-full"></span>
            リザーブ・メンバー
          </h2>
          <div className="grid grid-cols-2 gap-2">
             {gameState.heroes.slice(3).map((hero, idx) => {
               const actualIndex = idx + 3;
               return (
                <HeroCard 
                  key={hero.id} 
                  hero={hero} 
                  index={actualIndex}
                  compact 
                  isSelected={selectedHeroIndex === actualIndex}
                  // Reserves are not locked even during quest, but swapping with main is handled in handler
                  onClick={() => handleHeroClick(actualIndex)} 
                />
              );
             })}
          </div>
        </div>

        <div className="mb-8">
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
                         装備中
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
    </>
  );
};

export default PartyView;
