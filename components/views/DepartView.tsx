
import React, { useState } from 'react';
import { GameState, QuestRank, QuestConfig, Hero } from '../../types';
import { calculatePartyStats } from '../../utils/mechanics';
import PartySlotGrid from '../PartySlotGrid';
import { playClick, playError } from '../../utils/sound';
import Header from '../Header';
import { IS_TEST_MODE } from '../../constants';
import { MiningEffect } from '../AmbientEffects';
import { useLanguage } from '../../contexts/LanguageContext';

interface PredictionResult {
    minReward: number;
    maxReward: number;
    estimatedDuration: number;
    rawMinReward: number; // Added
    rawMaxReward: number; // Added
    rawDuration: number;  // Added
    rawMinDmg: number; 
    rawMaxDmg: number; 
    minDmg: number;
    maxDmg: number;
    bonusPercent: number;
    speedBonusPercent: number;
    avgDamageReduction: number;
    breakdown: {
      reward: { hero: number; equip: number; };
      speed: { hero: number; equip: number; };
    };
    heroDamageReductions: { id: string; name: string; totalReduction: number }[];
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

const generateQuestSVG = (name: string, rank: string) => {
  let primaryColor, secondaryColor, accentColor;
  
  switch(rank) {
    case 'C':
      primaryColor = '#334155'; // slate-700
      secondaryColor = '#0f172a'; // slate-900
      accentColor = '#64748b'; // slate-500
      break;
    case 'UC':
      primaryColor = '#065f46'; // emerald-800
      secondaryColor = '#022c22'; // emerald-950
      accentColor = '#10b981'; // emerald-500
      break;
    case 'R':
      primaryColor = '#3730a3'; // indigo-800
      secondaryColor = '#1e1b4b'; // indigo-950
      accentColor = '#6366f1'; // indigo-500
      break;
    case 'E':
      primaryColor = '#9a3412'; // orange-800
      secondaryColor = '#431407'; // orange-950
      accentColor = '#f97316'; // orange-500
      break;
    case 'L':
      primaryColor = '#6b21a8'; // purple-800
      secondaryColor = '#3b0764'; // purple-950
      accentColor = '#a855f7'; // purple-500
      break;
    default:
      primaryColor = '#334155';
      secondaryColor = '#0f172a';
      accentColor = '#64748b';
  }

  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate stalactites and stalagmites
  let pathDTop = "M0,0 ";
  let pathDBottom = "M0,150 ";
  
  for (let i = 0; i <= 10; i++) {
    const x = i * 40;
    const yTop = 10 + ((seed * (i + 1) * 13) % 40);
    const yBottom = 140 - ((seed * (i + 1) * 17) % 40);
    
    pathDTop += `L${x - 20},${yTop} L${x},0 `;
    pathDBottom += `L${x - 20},${yBottom} L${x},150 `;
  }
  pathDTop += "L400,0 Z";
  pathDBottom += "L400,150 Z";

  // Crystals
  const crystals = Array.from({ length: 12 }).map((_, i) => {
    const x = ((seed * (i + 1) * 23) % 380) + 10;
    const y = ((seed * (i + 1) * 29) % 100) + 25;
    const scale = 0.5 + (((seed * (i + 1) * 31) % 50) / 100);
    const opacity = 0.3 + (((seed * (i + 1) * 37) % 40) / 100);
    const rotation = ((seed * (i + 1) * 41) % 360);
    
    return `<polygon points="0,-15 10,15 -10,15" fill="${accentColor}" opacity="${opacity}" transform="translate(${x}, ${y}) scale(${scale}) rotate(${rotation})" />`;
  }).join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad_${rank}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${secondaryColor}" />
          <stop offset="50%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect width="400" height="150" fill="url(#grad_${rank})" />
      ${crystals}
      <path d="${pathDTop}" fill="${secondaryColor}" opacity="0.9"/>
      <path d="${pathDBottom}" fill="${secondaryColor}" opacity="0.9"/>
    </svg>
  `;

  // Encode SVG to base64 safely
  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encodedSvg}`;
};

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
  const { t } = useLanguage();
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

  const partyStats = calculatePartyStats(mainParty, gameState.equipment);

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
  let riskLevel = 0; // 0: Safe, 1-2: Warning, 3: Danger (Wipeout)

  const hasBrokenEquipment = mainParty.some(h => 
    h.equipmentIds.some(eid => {
      if (!eid) return false;
      const eq = gameState.equipment.find(e => e.id === eid);
      return eq && eq.durability <= 0;
    })
  );

  if (currentRankConfig && isPartyFull && getQuestPrediction) {
      prediction = getQuestPrediction(currentRankConfig, mainParty);
      
      // Calculate Risk
      riskLevel = mainParty.reduce((acc, hero) => {
          const heroReduction = prediction?.heroDamageReductions.find(h => h.id === hero.id)?.totalReduction || 0;
          // Calculate max damage specific to this hero
          const maxPotentialDmg = Math.floor(prediction!.rawMaxDmg * (1 - heroReduction / 100));
          
          if (maxPotentialDmg >= hero.hp) return acc + 1;
          return acc;
      }, 0);
  }

  const isDanger = riskLevel === 3;
  const isWarning = riskLevel > 0 && !isDanger;

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
       <MiningEffect />

       <Header 
         title={t('depart.title')} 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
         farcasterUser={farcasterUser}
         onChainBalance={onChainBalance}
         onAccountClick={onAccountClick}
       />

       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 bg-transparent relative z-10">
          
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

          <p className="text-xs text-slate-500 mb-2 font-bold">{t('depart.select_diff')}</p>
          
          {gameState.questConfigs.length === 0 && (
             <div className="text-center py-10 text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                {t('depart.loading')}
             </div>
          )}

          {gameState.questConfigs.map((config) => {
            const rank = config.rank;
            const bgImageUrl = generateQuestSVG(config.name, rank);
            return (
              <button
                key={rank}
                onClick={() => handleSelect(rank)}
                className={`w-full text-left relative group overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98] hover:shadow-md ${rankColors[rank] || rankColors['C']}`}
              >
                {/* Dynamic Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity transition-opacity duration-500 group-hover:opacity-60"
                  style={{ backgroundImage: `url('${bgImageUrl}')` }}
                />
                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent pointer-events-none" />
                
                {/* Content needs to be relative to sit above the absolute backgrounds */}
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center space-x-2">
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${rankBadges[rank] || rankBadges['C']}`}>{rank}</span>
                       <h3 className="font-bold text-slate-100 text-sm drop-shadow-md">{config.name}</h3>
                     </div>
                     <div className="text-right">
                       <span className="block text-[9px] text-slate-400 font-bold mb-0.5 drop-shadow-md">{t('depart.time')}</span>
                       <span className="font-bold text-white text-xs drop-shadow-md">{Math.floor(config.duration / 60)} min</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                     <div className="bg-slate-900/70 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                       <p className="text-slate-400 font-bold mb-0.5 text-[9px]">{t('depart.reward')}</p>
                       <p className="text-amber-400 font-bold">{config.minReward}-{config.maxReward}</p>
                     </div>
                     <div className="bg-slate-900/70 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                       <p className="text-slate-400 font-bold mb-0.5 text-[9px]">{t('depart.damage')}</p>
                       <p className="text-rose-400 font-bold">{config.minDmg}-{config.maxDmg}</p>
                     </div>
                     <div className="bg-slate-900/70 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center text-center">
                       <p className="text-slate-400 font-bold mb-0.5 text-[9px]">{t('depart.cost')}</p>
                       <p className="text-slate-200 font-bold">{config.burnCost} $CHH</p>
                     </div>
                  </div>
                </div>
              </button>
            );
          })}
       </div>

       {/* Confirmation Modal - Adjusted z-index and padding to avoid bottom nav overlap */}
       {selectedRank && currentRankConfig && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pb-[calc(env(safe-area-inset-bottom)+6rem)]">
           <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative">
             <div className="p-4 border-b border-slate-800 bg-slate-900 text-center shrink-0">
               <h2 className="text-lg font-bold text-white">{t('depart.confirm_title')}</h2>
             </div>
             
             {/* DANGER / WARNING BANNER */}
             {(isDanger || isWarning) && (
                <div className={`w-full py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 animate-pulse ${isDanger ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'}`}>
                    <span>{isDanger ? t('depart.wipeout_risk') : t('depart.death_risk')}</span>
                </div>
             )}
             
             <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="text-center mb-6">
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{t('depart.target_dest')}</p>
                 <h3 className="text-xl font-bold text-white mb-3">{currentRankConfig.name}</h3>
                 <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                   <span className={`font-bold mr-2 text-sm ${
                      selectedRank === 'C' ? 'text-slate-400' :
                      selectedRank === 'UC' ? 'text-emerald-400' :
                      selectedRank === 'R' ? 'text-indigo-400' :
                      selectedRank === 'E' ? 'text-orange-400' :
                      'text-purple-400'
                   }`}>{selectedRank} {t('depart.rank')}</span>
                   <span className={`text-xs font-bold border-l border-slate-700 pl-2 ${canAfford ? 'text-slate-400' : 'text-rose-500'}`}>
                     {t('depart.cost')}: {currentRankConfig.burnCost} $CHH
                   </span>
                 </div>
               </div>
               
               {/* --- PREDICTION PANEL --- */}
               {prediction && (
                 <div className={`mb-6 bg-slate-800/50 rounded-xl border p-4 relative overflow-hidden transition-colors ${
                     isDanger ? 'border-red-900/50 bg-red-900/10' : isWarning ? 'border-amber-900/50 bg-amber-900/10' : 'border-slate-700'
                 }`}>
                    {/* Background Overlay Text for Danger */}
                    {isDanger && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <span className="text-6xl font-black text-red-500 -rotate-12 uppercase tracking-widest border-4 border-red-500 px-4">DANGER</span>
                        </div>
                    )}
                    {isWarning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                            <span className="text-5xl font-black text-amber-500 -rotate-12 uppercase tracking-widest">WARNING</span>
                        </div>
                    )}

                    <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🔮</div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 flex justify-between">
                        <span>{t('depart.mission_forecast')}</span>
                        {(isDanger || isWarning) && (
                            <span className={`animate-pulse ${isDanger ? 'text-red-500' : 'text-amber-500'}`}>
                                {isDanger ? t('depart.high_mortality') : t('depart.caution')}
                            </span>
                        )}
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-3 relative z-10">
                        {/* Reward Forecast */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-400 mt-1">{t('depart.reward_forecast')}</span>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 line-through font-mono decoration-slate-600">
                                            Raw: {prediction.rawMinReward}-{prediction.rawMaxReward}
                                        </span>
                                        <span className="text-amber-500 font-bold text-sm">
                                            {prediction.minReward} - {prediction.maxReward}
                                        </span>
                                    </div>
                                    {prediction.bonusPercent !== 0 && (
                                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${prediction.bonusPercent > 0 ? 'text-emerald-400 bg-emerald-900/30' : 'text-rose-400 bg-rose-900/30'}`}>
                                            Bonus {prediction.bonusPercent > 0 ? '+' : ''}{prediction.bonusPercent.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            {prediction.bonusPercent !== 0 && (
                                <div className="text-right text-[8px] text-slate-500 font-bold mt-0.5">
                                    (Hero: {prediction.breakdown?.reward.hero! > 0 ? '+' : ''}{prediction.breakdown?.reward.hero.toFixed(1)}% / Equip: {prediction.breakdown?.reward.equip! > 0 ? '+' : ''}{prediction.breakdown?.reward.equip.toFixed(1)}%)
                                </div>
                            )}
                        </div>

                        {/* Damage Forecast (Updated Layout) */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-400">{t('depart.damage_forecast')}</span>
                            </div>
                            
                            {/* Per Hero Breakdown with Ranges */}
                            <div className="space-y-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                {prediction.heroDamageReductions.map(hero => {
                                    // Calculate individual risk based on reduction
                                    const minDmg = Math.max(0, Math.floor(prediction!.rawMinDmg * (1 - hero.totalReduction / 100)));
                                    const maxDmg = Math.max(0, Math.floor(prediction!.rawMaxDmg * (1 - hero.totalReduction / 100)));
                                    
                                    const heroObj = mainParty.find(h => h.id === hero.id);
                                    const currentHp = heroObj?.hp || 0;
                                    const isAtRisk = maxDmg >= currentHp;

                                    return (
                                    <div key={hero.id} className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {isAtRisk && <span className="text-xs animate-pulse">💀</span>}
                                            <span className={`truncate font-bold ${isAtRisk ? 'text-red-400' : 'text-slate-300'}`}>{hero.name}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`font-mono font-bold ${isAtRisk ? 'text-red-500' : 'text-rose-400'}`}>
                                                {minDmg} ~ {maxDmg}
                                            </span>
                                            <span className="text-[8px] text-slate-500">
                                                ({t('depart.reduction')}: {hero.totalReduction >= 0 ? '+' : ''}{hero.totalReduction.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>

                        {/* Duration Forecast (Speed Logic) */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">{t('depart.duration_forecast')}</span>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 line-through font-mono decoration-slate-600">
                                            Raw: {Math.floor(prediction.rawDuration / 60)}m
                                        </span>
                                        <span className="text-blue-400 font-bold text-sm">
                                            {Math.floor(prediction.estimatedDuration / 60)} min
                                        </span>
                                    </div>
                                    {prediction.speedBonusPercent !== 0 && (
                                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${prediction.speedBonusPercent > 0 ? 'text-emerald-400 bg-emerald-900/30' : 'text-rose-400 bg-rose-900/30'}`}>
                                            Speed {prediction.speedBonusPercent > 0 ? '+' : ''}{prediction.speedBonusPercent.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            {prediction.speedBonusPercent !== 0 && (
                                <div className="text-right text-[8px] text-slate-500 font-bold mt-0.5">
                                    (Hero: {prediction.breakdown?.speed.hero! > 0 ? '+' : ''}{prediction.breakdown?.speed.hero.toFixed(1)}% / Equip: {prediction.breakdown?.speed.equip! > 0 ? '+' : ''}{prediction.breakdown?.speed.equip.toFixed(1)}%)
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
               )}

               <div className="mb-6">
                 <div className="flex justify-between items-end mb-3">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                     {t('depart.select_party')}
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
                          {isUnlocked ? `${t('depart.party')} ${idx + 1}` : '🔒'}
                          {isQuesting && <span className="text-[8px] text-emerald-500">{t('depart.questing')}</span>}
                        </button>
                      );
                    })}
                 </div>

                 {!isPartyFull ? (
                    <div className="text-center p-4 border border-dashed border-rose-800/50 bg-rose-900/10 rounded-xl">
                      <p className="text-rose-400 font-bold text-sm">{t('depart.not_enough_members')}</p>
                      <p className="text-xs text-rose-300/70 mt-1">{t('depart.need_3_heroes')}</p>
                    </div>
                 ) : isCurrentPartyQuesting ? (
                    <div className="text-center p-4 border border-dashed border-emerald-800/50 bg-emerald-900/10 rounded-xl">
                      <p className="text-emerald-400 font-bold text-sm">{t('depart.party_questing')}</p>
                      <p className="text-xs text-emerald-300/70 mt-1">{t('depart.select_another_party')}</p>
                    </div>
                 ) : (
                    <div className={`relative ${partyStats.teamDamageReduction > 0 ? 'rounded-xl ring-2 ring-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.6)]' : ''}`}>
                      {partyStats.teamDamageReduction > 0 && (
                        <>
                          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-xl blur-xl z-0 animate-pulse pointer-events-none"></div>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-xl blur-md z-0 animate-pulse pointer-events-none" style={{ animationDuration: '2s' }}></div>
                          <div className="absolute inset-0 rounded-xl border border-cyan-300/50 z-10 pointer-events-none mix-blend-overlay"></div>
                        </>
                      )}
                      <div className="pointer-events-none transform scale-95 relative z-10">
                        <PartySlotGrid
                          heroIds={activePresetIds}
                          heroes={gameState.heroes}
                          readOnly={true}
                          showSlotLabels={false}
                          className="grid grid-cols-3 gap-3"
                          compactEmpty={true}
                          equipment={gameState.equipment}
                          teamDefBonus={partyStats.teamDamageReduction}
                        />
                      </div>
                    </div>
                 )}
                 {hasDeadHeroes && (
                   <p className="text-rose-400 text-xs text-center mt-4 font-bold">
                     {t('depart.dead_hero_warning')}
                   </p>
                 )}
                 {hasBrokenEquipment && (
                   <p className="text-rose-400 text-xs text-center mt-4 font-bold">
                     耐久値がゼロの装備品があるため出発できません
                   </p>
                 )}
               </div>
             </div>

             <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3 shrink-0">
               <button 
                 onClick={handleCancel}
                 className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold hover:bg-slate-600 transition-all text-sm"
               >
                 {t('depart.cancel')}
               </button>
               <button 
                 onClick={handleConfirm}
                 disabled={!isPartyFull || isProcessing || isCurrentPartyQuesting || hasDeadHeroes || hasBrokenEquipment}
                 className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-all text-sm ${
                    !isPartyFull || isProcessing || isCurrentPartyQuesting || hasDeadHeroes || hasBrokenEquipment
                      ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                      : !canAfford 
                        ? 'bg-rose-600 hover:bg-rose-500' // Red for unaffordable but clickable
                        : isDanger ? 'bg-red-700 hover:bg-red-600 ring-2 ring-red-500 animate-pulse' // Danger styling
                        : isWarning ? 'bg-amber-600 hover:bg-amber-500' // Warning styling
                        : 'bg-indigo-600 hover:bg-indigo-500'
                 }`}
               >
                 {isProcessing ? t('depart.processing') : !isPartyFull ? t('depart.not_enough_members') : isCurrentPartyQuesting ? t('depart.questing') : hasBrokenEquipment ? '装備破損' : (!canAfford ? t('depart.insufficient_funds') : isDanger ? t('depart.force_depart') : t('depart.depart_btn'))}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DepartView;
