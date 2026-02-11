
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { GameState, Hero, QuestRank } from '../../types';
import HeroCard from '../HeroCard';
import EquipmentSelector from '../EquipmentSelector';
import PartySlotGrid from '../PartySlotGrid';
import HeroDetailModal from '../HeroDetailModal';
import TeamStatusModal from '../TeamStatusModal';
import { playClick, playError, playConfirm } from '../../utils/sound';
import Header from '../Header';
import { IS_TEST_MODE } from '../../constants';
import { calculatePartyStats } from '../../utils/mechanics';
import { gsap } from 'gsap';
import { getHeroImageUrl } from '../../utils/heroUtils';

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

type SortMode = 'RARITY' | 'HP_ASC' | 'HP_DESC';

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
  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null);
  const [showTeamStatus, setShowTeamStatus] = useState(false);
  
  // Filter & Sort State
  const [filterRarity, setFilterRarity] = useState<'ALL' | QuestRank>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('RARITY');
  
  // Intersection Observer State
  const [isMainPartyVisible, setIsMainPartyVisible] = useState(true);
  const mainPartyRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const activePartyIndex = gameState.activePartyIndex;
  const currentPreset = gameState.partyPresets[activePartyIndex];
  
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);
  const isPartyLocked = currentPreset.some(id => id && activeQuestHeroIds.includes(id));

  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  // --- Scroll Detection ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show float if the main party grid is NOT intersecting (scrolled out of view)
        // AND the bounding box is above the viewport (scrolled down), not below (scrolled up before reaching it)
        const isAbove = entry.boundingClientRect.top < 0;
        setIsMainPartyVisible(entry.isIntersecting || !isAbove);
      },
      { threshold: 0, rootMargin: "-60px 0px 0px 0px" } // Offset for header
    );

    if (mainPartyRef.current) {
      observer.observe(mainPartyRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // GSAP: Float Animation Entrance
  useLayoutEffect(() => {
    if (!isMainPartyVisible && floatRef.current) {
       gsap.fromTo(floatRef.current, 
         { x: 50, opacity: 0, scale: 0.8 },
         { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
       );
    }
  }, [isMainPartyVisible]);

  // --- Stats Calculation ---
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
        setSelectedSlotIndex(null);
      } else {
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
      playConfirm();
      setInspectingHero(hero);
    }
  };

  const handleToggleSort = () => {
    playClick();
    setSortMode(prev => {
      if (prev === 'RARITY') return 'HP_ASC';
      if (prev === 'HP_ASC') return 'HP_DESC';
      return 'RARITY';
    });
  };

  const filteredHeroes = useMemo(() => {
    let result = gameState.heroes.filter(h => !allAssignedHeroIds.includes(h.id));

    // Filter by Rarity
    if (filterRarity !== 'ALL') {
      result = result.filter(h => h.rarity === filterRarity);
    }

    // Sort
    result.sort((a, b) => {
      if (sortMode === 'RARITY') {
        const priority = { L: 5, E: 4, R: 3, UC: 2, C: 1 };
        const diff = priority[b.rarity] - priority[a.rarity];
        if (diff !== 0) return diff;
        return b.hp - a.hp; // Secondary sort by HP (High to Low)
      }
      if (sortMode === 'HP_ASC') {
        return a.hp - b.hp;
      }
      if (sortMode === 'HP_DESC') {
        return b.hp - a.hp;
      }
      return 0;
    });

    return result;
  }, [gameState.heroes, allAssignedHeroIds, filterRarity, sortMode]);

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900">
        
        <Header 
          title="PARTY" 
          tokens={gameState.tokens} 
          isSoundOn={isSoundOn} 
          onToggleSound={onToggleSound}
          onDebugAddTokens={onDebugAddTokens}
          farcasterUser={farcasterUser}
          onChainBalance={onChainBalance}
          onAccountClick={onAccountClick}
        />

        {/* --- SCROLLABLE CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 custom-scrollbar">
          
            {/* Banner */}
            <div className="mb-4">
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

            {/* Main Party Editor (Normal Position) */}
            <div ref={mainPartyRef} className="mb-4">
                {/* Tabs */}
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                    {[0, 1, 2].map(idx => {
                        const isUnlocked = gameState.unlockedParties[idx];
                        const isActive = activePartyIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleTabClick(idx)}
                                className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border whitespace-nowrap flex-1 ${
                                    isActive 
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                    : isUnlocked 
                                        ? 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                                        : 'bg-slate-900 text-slate-700 border-slate-700'
                                }`}
                            >
                                {isUnlocked ? `Party 0${idx + 1}` : '🔒 LOCK'}
                            </button>
                        );
                    })}
                </div>

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
                    className="grid grid-cols-3 gap-2"
                />
            </div>

            {/* Team Status Dashboard (Moved Below Party Grid) */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3 shadow-sm relative overflow-hidden mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                    Team Status
                    </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Reward */}
                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <div className="flex items-center gap-2">
                        <div className="text-lg">⛏️</div>
                        <div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase">Reward</div>
                            <div className="text-xs font-black text-amber-500">+{partyStats.rewardBonus}%</div>
                        </div>
                        </div>
                    </div>
                    
                    {/* Speed */}
                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <div className="flex items-center gap-2">
                        <div className="text-lg">👢</div>
                        <div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase">Speed</div>
                            <div className="text-xs font-black text-emerald-400">+{partyStats.speedBonus}%</div>
                        </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => { playClick(); setShowTeamStatus(true); }}
                    className="w-full text-[9px] text-slate-500 bg-slate-900/30 hover:bg-slate-900/50 py-1.5 rounded font-bold transition-colors"
                >
                    詳細ステータスを表示
                </button>
            </div>

            {/* Barracks List */}
            <div>
              <div className="sticky top-0 bg-slate-900/95 pt-2 pb-3 backdrop-blur-sm z-10 border-b border-slate-800/50 mb-4">
                  <div className="flex items-center justify-between mb-3">
                     <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <span className="w-1 h-3 bg-slate-600 mr-2 rounded-full"></span>
                        Barracks
                     </h2>
                     {selectedSlotIndex !== null && (
                        <span className="text-[9px] text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded animate-pulse">
                            Select Hero for Slot {selectedSlotIndex + 1}
                        </span>
                     )}
                  </div>

                  <div className="flex items-center gap-2">
                      {/* Filter Buttons */}
                      <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        {(['ALL', 'L', 'E', 'R', 'UC', 'C'] as const).map(rarity => (
                            <button
                              key={rarity}
                              onClick={() => { playClick(); setFilterRarity(rarity); }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-colors whitespace-nowrap ${
                                  filterRarity === rarity 
                                    ? 'bg-slate-200 text-slate-900 border-white shadow-sm' 
                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-750'
                              }`}
                            >
                              {rarity}
                            </button>
                        ))}
                      </div>

                      {/* Sort Button */}
                      <button 
                        onClick={handleToggleSort}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 font-bold text-[9px] hover:bg-indigo-900/50 transition-colors"
                      >
                        <span className="text-xs">
                            {sortMode === 'RARITY' ? '⭐' : sortMode === 'HP_ASC' ? '💓' : '💪'}
                        </span>
                        <span>
                            {sortMode === 'RARITY' ? 'レア度順' : sortMode === 'HP_ASC' ? 'HP低い順' : 'HP高い順'}
                        </span>
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  {filteredHeroes.map((hero, idx) => {
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
                  {filteredHeroes.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-slate-600 text-xs font-bold">
                          {gameState.heroes.length === 0 ? "NO HEROES IN BARRACKS" : "NO HEROES MATCH FILTER"}
                      </div>
                  )}
              </div>
            </div>
        </div>

        {/* --- FLOATING MINI PARTY PANEL (Shows only when Main Party is scrolled out) --- */}
        {!isMainPartyVisible && (
            <div 
                ref={floatRef}
                className="fixed top-20 right-3 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-2 shadow-2xl flex flex-col gap-2"
            >
                <div className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest border-b border-slate-700/50 pb-1">
                    Party {activePartyIndex + 1}
                </div>
                <div className="flex gap-2">
                    {[0, 1, 2].map(slotIdx => {
                        const heroId = currentPreset[slotIdx];
                        const hero = heroId ? gameState.heroes.find(h => h.id === heroId) : null;
                        const isSelected = selectedSlotIndex === slotIdx;
                        
                        return (
                            <button
                                key={slotIdx}
                                onClick={() => handleSlotClick(slotIdx)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden transition-all border-2 ${
                                    isSelected 
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110 z-10' 
                                    : 'border-slate-600 hover:border-slate-400'
                                } bg-slate-800`}
                            >
                                {hero ? (
                                    <img 
                                        src={getHeroImageUrl(hero.name, 's')} 
                                        className="w-full h-full object-cover" 
                                        alt={hero.name} 
                                    />
                                ) : (
                                    <span className="text-slate-500 text-lg">+</span>
                                )}
                                
                                {/* Slot Number Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-black/70 text-[8px] font-bold text-white w-4 h-4 flex items-center justify-center rounded-full border border-slate-700">
                                    {slotIdx + 1}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

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
