
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
          farcasterUser={farcasterUser}
          onChainBalance={onChainBalance}
          onAccountClick={onAccountClick}
        >
          <div className="px-5 pt-4 pb-3">
            <img 
              src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Team.png" 
              alt="Team Banner" 
              className="w-full h-auto rounded-[2.5rem] shadow-2xl border border-white/10"
            />
          </div>

          <div className="px-5 mb-3">
            <p className={`text-[10px] py-2 px-3 rounded-full border text-center font-black tracking-widest uppercase transition-all ${
              isPartyLocked ? 'text-rose-400 bg-rose-950/40 border-rose-500/30' : 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30 shadow-inner'
            }`}>
              {isPartyLocked ? "PARTY LOCKED ON MISSION" : (selectedSlotIndex !== null || selectedHeroId !== null ? "TARGET ACQUIRED: ASSIGNING..." : "SELECT SLOT & UNIT TO DEPLOY")}
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
                  className={`flex-1 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all border ${
                    isActive 
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer'
                      : isUnlocked 
                        ? 'bg-slate-900 text-slate-500 border-white/5 hover:bg-slate-800 cursor-pointer'
                        : 'bg-black text-slate-600 border-white/10 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 shadow-inner'
                  }`}
                  title={!isUnlocked ? "クリックしてこのパーティ枠を解放" : ""}
                >
                  {isUnlocked ? `PARTY 0${idx + 1}` : '🔒 LOCKED'}
                </button>
              );
            })}
          </div>
        </Header>

        <div className="flex-1 overflow-y-auto px-5 pb-32 pt-10">
          
          <div className="grid grid-cols-3 gap-5 mb-16">
            {[0, 1, 2].map(slotIdx => {
              const heroId = currentPreset[slotIdx];
              const h = heroId ? gameState.heroes.find(heroObj => heroObj.id === heroId) : null;
              const isSelected = selectedSlotIndex === slotIdx;

              return (
                <div key={slotIdx} className="relative group">
                  <div className="absolute -top-5 left-0 right-0 flex justify-center z-20">
                      <span className={`text-[8px] font-black px-2.5 py-0.5 rounded-full shadow-xl border whitespace-nowrap transition-all ${
                        isSelected ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_#6366f1]' : 'bg-slate-900 text-slate-500 border-white/10'
                      }`}>SLOT {slotIdx + 1}</span>
                  </div>

                  {h ? (
                    <div className="relative">
                      <HeroCard 
                        hero={h} 
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
                          className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-white/20 shadow-2xl z-30"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSlotClick(slotIdx)}
                      className={`w-full aspect-[4/5] rounded-[1.8rem] border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl' 
                            : 'border-white/10 bg-black/40 hover:bg-black/60'
                      }`}
                    >
                        <span className="text-2xl mb-1 opacity-10">＋</span>
                        <span className="text-[9px] font-black text-slate-700 tracking-tighter uppercase">Vacant</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <h2 className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.4em] flex items-center px-1">
              <span className="w-1.5 h-4 bg-slate-800 mr-4 rounded-full"></span>
              Barracks (Inactive)
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl p-8 animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-[2.5rem] p-10 text-center border border-white/10 shadow-3xl shadow-black/50">
             <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl border border-indigo-500/30 shadow-inner">
                🔒
             </div>
             <h3 className="text-xl font-black text-white mb-3 tracking-widest">DEPLOY PARTY 0{unlockingIndex + 1}</h3>
             <p className="text-slate-500 text-xs mb-10 leading-relaxed">
               コスト: <span className="text-amber-500 font-black">10,000 $CHH</span>
             </p>
             <div className="flex gap-4">
                <button onClick={() => setUnlockingIndex(null)} className="flex-1 py-4 rounded-2xl bg-slate-900 text-slate-400 font-bold text-sm border border-white/5">ABORT</button>
                <button onClick={confirmUnlock} disabled={gameState.tokens < 10000} className={`flex-1 py-4 rounded-2xl font-black text-sm text-white shadow-2xl transition-all ${gameState.tokens >= 10000 ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-800 text-slate-600'}`}>
                  {gameState.tokens >= 10000 ? 'UNLOCK' : 'INSUFFICIENT'}
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PartyView;
