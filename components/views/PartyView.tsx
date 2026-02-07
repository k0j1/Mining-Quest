
import React, { useState, useMemo } from 'react';
import { GameState, Hero } from '../../types';
import HeroCard from '../HeroCard';
import EquipmentSelector from '../EquipmentSelector';
import PartySlotGrid from '../PartySlotGrid';
import HeroDetailModal from '../HeroDetailModal';
import TeamStatusModal from '../TeamStatusModal';
import { playClick, playError, playConfirm } from '../../utils/sound';
import Header from '../Header';
import { IS_TEST_MODE } from '../../constants';
import { calculatePartyStats } from '../../utils/mechanics';

interface PartyViewProps {
  gameState: GameState;
  onEquipItem: (heroId: string, slotIndex: number, equipmentId: string | null) => void;
  onSwitchParty: (index: number) => void;
  onUnlockParty: (index: number) => void;
  onAssignHero: (slotIndex: number, heroId: string | null) => void;
  onSwapSlots: (index1: number, index2: number) => void;
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
  onSwapSlots,
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
  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null); // State for detailed view
  const [showTeamStatus, setShowTeamStatus] = useState(false); // State for team status modal

  const activePartyIndex = gameState.activePartyIndex;
  const currentPreset = gameState.partyPresets[activePartyIndex];
  
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);
  const isPartyLocked = currentPreset.some(id => id && activeQuestHeroIds.includes(id));

  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  // --- Stats Calculation Logic using Centralized Utility ---
  const partyStats = useMemo(() => {
    const activeHeroes = currentPreset
      .map(id => gameState.heroes.find(h => h.id === id))
      .filter((h): h is Hero => !!h);

    const stats = calculatePartyStats(activeHeroes, gameState.equipment);

    return { 
        totalHp: stats.totalHp,
        maxHp: stats.maxHp, 
        rewardBonus: stats.totalRewardBonus,
        rewardHero: stats.breakdown.reward.hero,
        rewardEquip: stats.breakdown.reward.equip, 
        speedBonus: stats.totalSpeedBonus,
        speedHero: stats.breakdown.speed.hero,
        speedEquip: stats.breakdown.speed.equip,
        teamDefBonus: stats.teamDamageReduction 
    };
  }, [currentPreset, gameState.heroes, gameState.equipment]);


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
    
    // Case 1: A hero from barracks is selected -> Assign to clicked slot
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

    // Case 2: A party slot is already selected
    if (selectedSlotIndex !== null) {
      if (selectedSlotIndex === slotIdx) {
        // Clicked same slot -> Deselect
        setSelectedSlotIndex(null);
      } else {
        // Clicked different slot -> Swap
        onSwapSlots(selectedSlotIndex, slotIdx);
        setSelectedSlotIndex(null);
      }
    } else {
      // Case 3: No slot selected -> Select this slot
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

  const handleHeroLongPress = (heroId: string) => {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (hero) {
      playConfirm(); // Sound effect for opening detail
      setInspectingHero(hero);
    }
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
        />

        <div className="flex-1 overflow-y-auto pb-32 pt-4 bg-slate-900 custom-scrollbar">
          
          {/* Banner (Scrollable) */}
          <div className="px-5 pb-3">
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-700">
                <img 
                src="https://miningquest.k0j1.v2002.coreserver.jp/images/B_Team.png" 
                alt="Team Banner" 
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
          </div>

          {/* Status Message (Scrollable) */}
          <div className="px-5 mb-3">
            <p className={`text-[10px] py-2 px-3 rounded-lg border text-center font-bold tracking-widest uppercase transition-all ${
              isPartyLocked ? 'text-rose-400 bg-rose-900/20 border-rose-800' : 'text-indigo-400 bg-indigo-900/20 border-indigo-800'
            }`}>
              {isPartyLocked ? "PARTY LOCKED ON MISSION" : (selectedSlotIndex !== null ? "SELECT TARGET SLOT TO SWAP" : selectedHeroId !== null ? "ASSIGNING UNIT..." : "SELECT SLOT TO EDIT / HOLD FOR INFO")}
            </p>
          </div>

          {/* Tabs (Scrollable) */}
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

          {/* Main Content Area */}
          <div className="px-5">
            <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest mb-3 opacity-70">
              Long press hero to view details
            </p>

            <div className="mb-6">
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
                onLongPress={handleHeroLongPress} 
                equipment={gameState.equipment}
              />
            </div>

            {/* Team Status Dashboard */}
            <div className="mb-8 bg-slate-800/60 rounded-xl border border-slate-700 p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5 text-4xl pointer-events-none">📊</div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                  Team Status
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                 {/* Reward */}
                 <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">⛏️</div>
                      <div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase">Reward Bonus</div>
                          <div className="text-sm font-black text-amber-500">+{partyStats.rewardBonus}%</div>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between text-[8px] text-slate-500 font-bold bg-black/20 px-1.5 py-0.5 rounded">
                      <span>Hero: +{partyStats.rewardHero}%</span>
                      <span>Equip: +{partyStats.rewardEquip}%</span>
                    </div>
                 </div>
                 
                 {/* Speed */}
                 <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">👢</div>
                      <div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase">Speed Boost</div>
                          <div className="text-sm font-black text-emerald-400">+{partyStats.speedBonus}%</div>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between text-[8px] text-slate-500 font-bold bg-black/20 px-1.5 py-0.5 rounded">
                      <span>Hero: +{partyStats.speedHero}%</span>
                      <span>Equip: +{partyStats.speedEquip}%</span>
                    </div>
                 </div>
              </div>
              
              <p className="text-[9px] text-slate-500 text-right opacity-70">
                * Based on active skills & equipment
              </p>
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
                          equipment={gameState.equipment}
                          onLongPress={() => handleHeroLongPress(hero.id)} 
                        />
                      </div>
                    );
                  })}
              </div>
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

      {inspectingHero && (
        <HeroDetailModal 
          hero={inspectingHero}
          equipment={gameState.equipment}
          onClose={() => { playClick(); setInspectingHero(null); }}
        />
      )}

      {showTeamStatus && (
        <TeamStatusModal 
          stats={partyStats}
          onClose={() => { playClick(); setShowTeamStatus(false); }}
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
                <button onClick={confirmUnlock} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all ${gameState.tokens >= 10000 ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 text-slate-500'}`}>
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
