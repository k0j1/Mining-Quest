
import React, { useState } from 'react';
import { GameState } from '../../types';
import HeroCard from '../HeroCard';
import EquipmentSelector from '../EquipmentSelector';
import PartySlotGrid from '../PartySlotGrid';
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
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

const PartyView: React.FC<PartyViewProps> = ({ 
  gameState, 
  onEquipItem, 
  onSwitchParty, 
  onUnlockParty,
  onAssignHero,
  isSoundOn,
  onToggleSound,
  onDebugAddTokens,
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [equippingState, setEquippingState] = useState<{ heroId: string, slotIndex: number } | null>(null);
  const [unlockingIndex, setUnlockingIndex] = useState<number | null>(null);

  const activePartyIndex = gameState.activePartyIndex;
  const currentPreset = gameState.partyPresets[activePartyIndex];
  
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);
  const isPartyLocked = currentPreset.some(id => id && activeQuestHeroIds.includes(id));

  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  const handleTabClick = (idx: number) => {
    const isUnlocked = gameState.unlockedParties[idx];
    if (isUnlocked) {
      playClick();
      onSwitchParty(idx);
      setSelectedSlotIndex(null);
      setSelectedHeroId(null);
    } else {
      playClick();
      setUnlockingIndex(idx);
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
    
    if (selectedHeroId) {
      if (activeQuestHeroIds.includes(selectedHeroId)) {
        playError();
        setSelectedHeroId(null);
        return;
      }
      onAssignHero(slotIdx, selectedHeroId);
      setSelectedHeroId(null);
      setSelectedSlotIndex(null);
      return;
    }

    if (selectedSlotIndex === slotIdx) {
      setSelectedSlotIndex(null);
    } else {
      setSelectedSlotIndex(slotIdx);
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
      return;
    }

    playClick();

    if (selectedSlotIndex !== null) {
      onAssignHero(selectedSlotIndex, heroId);
      setSelectedSlotIndex(null);
      setSelectedHeroId(null);
      return;
    }

    if (selectedHeroId === heroId) {
      setSelectedHeroId(null);
    } else {
      setSelectedHeroId(heroId);
      setSelectedSlotIndex(null);
    }
  };

  const handleRemoveHero = (slotIndex: number) => {
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
      <div className="flex flex-col h-full relative bg-slate-900">
        <Header 
          title="パーティ編成" 
          tokens={gameState.tokens} 
          isSoundOn={isSoundOn} 
          onToggleSound={onToggleSound}
          onDebugAddTokens={onDebugAddTokens}
          farcasterUser={farcasterUser}
          onChainBalance={onChainBalance}
          onAccountClick={onAccountClick}
        >
          <div className="px-5 pt-4 pb-3">
            <img 
              src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Team.png" 
              alt="Team Banner" 
              className="w-full h-auto rounded-2xl shadow-md border border-slate-700"
            />
          </div>

          <div className="px-5 mb-3">
            <p className={`text-[10px] py-2 px-3 rounded-lg border text-center font-bold tracking-widest uppercase transition-all ${
              isPartyLocked ? 'text-rose-400 bg-rose-900/20 border-rose-800' : 'text-indigo-400 bg-indigo-900/20 border-indigo-800'
            }`}>
              {isPartyLocked ? "PARTY LOCKED ON MISSION" : (selectedSlotIndex !== null || selectedHeroId !== null ? "ASSIGNING UNIT..." : "SELECT SLOT & UNIT")}
            </p>
          </div>

          <div className="flex px-5 gap-3 pb-4">
            {[0, 1, 2].map(idx => {
              const isUnlocked = gameState.unlockedParties[idx];
              const isActive = activePartyIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleTabClick(idx)}
                  className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all border ${
                    isActive 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm cursor-pointer'
                      : isUnlocked 
                        ? 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 cursor-pointer'
                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-pointer hover:bg-slate-800/50 hover:text-amber-500/80'
                  }`}
                  title={!isUnlocked ? "クリックしてこのパーティ枠を解放" : ""}
                >
                  {isUnlocked ? `PARTY 0${idx + 1}` : '🔒 LOCKED'}
                </button>
              );
            })}
          </div>
        </Header>

        <div className="flex-1 overflow-y-auto px-5 pb-32 pt-6 bg-slate-900">
          
          <div className="mb-12">
            <PartySlotGrid
              heroIds={currentPreset}
              heroes={gameState.heroes}
              activeQuestHeroIds={activeQuestHeroIds}
              selectedIndex={selectedSlotIndex}
              isPartyLocked={isPartyLocked}
              readOnly={false}
              showSlotLabels={true}
              onSlotClick={handleSlotClick}
              onRemoveClick={handleRemoveHero}
              onEquipClick={handleEquipClick}
            />
          </div>

          <div className="mt-4 border-t border-slate-800 pt-6">
            <h2 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest flex items-center px-1">
              <span className="w-1 h-4 bg-slate-700 mr-4 rounded-full"></span>
              Barracks
            </h2>
            <div className="grid grid-cols-2 gap-4 pb-12">
                {gameState.heroes
                  .filter(h => !allAssignedHeroIds.includes(h.id))
                  .map((hero, idx) => {
                    const isQuesting = activeQuestHeroIds.includes(hero.id);
                    const isHeroSelected = selectedHeroId === hero.id;

                    return (
                    <div key={hero.id} className="relative">
                      <HeroCard 
                        hero={hero} 
                        index={idx}
                        compact 
                        isLocked={isQuesting}
                        isSelected={isHeroSelected}
                        onClick={() => handleHeroListClick(hero.id)} 
                      />
                    </div>
                  );
                })}
            </div>
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

      {unlockingIndex !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-8">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-8 text-center border border-slate-700 shadow-xl">
             <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl border border-slate-700 text-slate-400">
                🔒
             </div>
             <h3 className="text-lg font-bold text-white mb-2 tracking-wide">DEPLOY PARTY 0{unlockingIndex + 1}</h3>
             <p className="text-slate-400 text-xs mb-8 leading-relaxed">
               コスト: <span className="text-amber-500 font-bold">10,000 $CHH</span>
             </p>
             <div className="flex gap-3">
                <button onClick={() => setUnlockingIndex(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700">キャンセル</button>
                <button onClick={confirmUnlock} disabled={gameState.tokens < 10000} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all ${gameState.tokens >= 10000 ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 text-slate-500'}`}>
                  {gameState.tokens >= 10000 ? '解放する' : '不足'}
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PartyView;
