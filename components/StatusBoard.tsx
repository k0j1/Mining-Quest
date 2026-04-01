
import React, { useState, useEffect, useRef } from 'react';
import { GameState, View, QuestConfig } from '../types';
import { playClick } from '../utils/sound';
import Header from './Header';
import PartySlotGrid from './PartySlotGrid';
import { IS_TEST_MODE, APP_VERSION } from '../constants';
import { calculatePartyStats } from '../utils/mechanics';
import { useLanguage } from '../contexts/LanguageContext';
import { useReward } from '../hooks/actions/useReward';

interface StatusBoardProps {
  state: GameState;
  actionButtonLabel?: string;
  onAction?: () => void;
  title: string;
  view: View;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
  onShowLightpaper?: () => void;
  onDebugCompleteQuest?: (questId: string) => void;
  onToggleDebug?: () => void;
  onNavigate?: (view: View) => void;
  isFrameAdded?: boolean;
  onAddApp?: () => void;
  onClaimSuccess?: () => void;
}

const ADMIN_FIDS = [406233];

const QuestItem: React.FC<{ 
    quest: any; 
    config?: QuestConfig; 
    farcasterUser?: any; 
    onDebugComplete?: (id: string) => void;
    onClick?: () => void;
}> = ({ quest, config, farcasterUser, onDebugComplete, onClick }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((quest.endTime - Date.now()) / 1000)));
  const [debugClicks, setDebugClicks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((quest.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [quest.endTime]);

  const handleDebugClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to parent onClick
    
    if (farcasterUser) return;
    
    // Only allow if onDebugComplete is provided
    if (!onDebugComplete) return;

    if (timeLeft <= 0) return;

    const newClicks = debugClicks + 1;
    setDebugClicks(newClicks);
    
    if (newClicks >= 10) {
      onDebugComplete(quest.id);
      setDebugClicks(0);
      playClick();
    }
  };

  const isCompleted = timeLeft <= 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const rankColors: Record<string, string> = {
    C: 'text-slate-400', UC: 'text-emerald-50', R: 'text-indigo-400', E: 'text-fuchsia-400', L: 'text-amber-500'
  };

  // Fallback display if config not found (shouldn't happen if loaded)
  const minReward = config ? config.minReward : '?';
  const maxReward = config ? config.maxReward : '?';

  return (
    <div 
        onClick={() => {
            if (onClick) {
                playClick();
                onClick();
            }
        }}
        className={`relative p-4 rounded-2xl border transition-all cursor-pointer hover:bg-slate-800/80 active:scale-[0.98] ${
            isCompleted ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'
        }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black ${rankColors[quest.rank]}`}>[{quest.rank}]</span>
            <h3 className="font-bold text-sm text-slate-100">{quest.name}</h3>
          </div>
          <p className="text-[10px] text-slate-500">
            {t('status.expected_reward')} <span className="text-amber-500 font-bold">{minReward}-{maxReward}</span> $CHH
          </p>
        </div>

        <div className="text-right select-none" onClick={handleDebugClick}>
          {isCompleted ? (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mb-1">{t('status.status')}</span>
              <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span>✓</span>
                <span>{t('status.completed')}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('status.time_left')}</span>
              <div className="font-bold text-lg text-slate-200 tabular-nums">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBoard: React.FC<StatusBoardProps> = ({ 
  state, actionButtonLabel, onAction, title, view, isSoundOn, onToggleSound, onDebugAddTokens, farcasterUser, onChainBalance, onAccountClick, onShowLightpaper, onDebugCompleteQuest, onToggleDebug, onNavigate, isFrameAdded, onAddApp, onClaimSuccess
}) => {
  const { t } = useLanguage();
  const { isClaiming, checkGetClaimStatus, getPreviewClaimAmount, claimReward } = useReward();
  const [canClaim, setCanClaim] = useState(false);
  const [previewAssets, setPreviewAssets] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const hasCheckedClaim = useRef(false);
  const lastAddress = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (farcasterUser?.address) {
      if (lastAddress.current !== farcasterUser.address) {
        hasCheckedClaim.current = false;
        lastAddress.current = farcasterUser.address;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      
      if (!hasCheckedClaim.current && !timerRef.current) {
        console.log('Starting claim status check in 3 seconds...');
        timerRef.current = setTimeout(() => {
          console.log('Checking claim status...');
          checkGetClaimStatus(farcasterUser.address!).then(status => {
            console.log('Claim status:', status);
            setCanClaim(!status);
            hasCheckedClaim.current = true;
            timerRef.current = null;
          });
        }, 3000);
      }
    }
  }, [farcasterUser?.address, checkGetClaimStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handlePreviewClick = async () => {
    if (!farcasterUser?.address) return;
    setIsPreviewing(true);
    try {
      const assets = await getPreviewClaimAmount(farcasterUser.address);
      setPreviewAssets(assets);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to preview claim", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmClaim = async () => {
    if (!farcasterUser?.address || !farcasterUser?.fid || isClaiming) return;
    
    const result = await claimReward(farcasterUser.address, farcasterUser.fid);
    if (result.success) {
      setCanClaim(false);
      setShowPreview(false);
      alert('Rewards claimed successfully! The page will now reload to update your assets.');
      if (onClaimSuccess) {
        onClaimSuccess();
      } else {
        window.location.reload();
      }
    } else {
      alert('Failed to claim rewards: ' + ((result.error as Error)?.message || 'Unknown error'));
    }
  };

  const isAdmin = farcasterUser && ADMIN_FIDS.includes(farcasterUser.fid);

  return (
    <div className="flex flex-col h-full relative bg-slate-900">
      
      <Header 
        title={title} tokens={state.tokens} isSoundOn={isSoundOn} onToggleSound={onToggleSound} onDebugAddTokens={onDebugAddTokens}
        farcasterUser={farcasterUser} onChainBalance={onChainBalance} onAccountClick={onAccountClick}
      />



      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar bg-transparent relative z-10">
        <div className="px-5 pt-5 mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-700">
            <img 
              src={view === View.RETURN ? "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Result.png" : "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Home.png"} 
              alt="Banner" 
              className="w-full h-auto"
            />
          </div>
          
          {/* Changed Layout: Version on right (top-aligned), Buttons on left */}
          <div className="mt-3 flex items-start justify-between gap-2 flex-wrap min-h-[32px]">
            
            {/* Action Buttons (Left) */}
            <div className="flex gap-2 justify-start flex-wrap">
              {view === View.HOME && onShowLightpaper && (
                <button 
                  onClick={() => { playClick(); onShowLightpaper(); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all active:scale-95 group"
                >
                  <span className="text-lg">📜</span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">{t('status.view_lightpaper')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-slate-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}

              {/* Add App Button - Only if not added */}
              {view === View.HOME && !isFrameAdded && onAddApp && (
                <button 
                  onClick={() => { playClick(); onAddApp(); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-full border border-emerald-400/50 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 group animate-pulse"
                >
                  <span className="text-sm">📱</span>
                  <span className="text-[10px] font-bold text-white tracking-wide">{t('status.add_app')}</span>
                </button>
              )}

              {isAdmin && onToggleDebug && view === View.HOME && (
                <button 
                  onClick={() => { playClick(); onToggleDebug(); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-900/30 hover:bg-rose-900/50 rounded-full border border-rose-800 transition-all active:scale-95 group"
                >
                  <span className="text-lg">🐛</span>
                  <span className="text-[10px] font-bold text-rose-300 group-hover:text-rose-200">DEBUG</span>
                </button>
              )}
            </div>

            {farcasterUser?.address && canClaim && !showPreview && (
              <div className="w-full mt-4 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/50 shadow-lg flex items-center justify-between z-20 relative">
                <div>
                  <h3 className="text-white font-bold text-sm">Welcome Reward Available!</h3>
                  <p className="text-indigo-200 text-xs">Claim your initial assets to start playing.</p>
                </div>
                <button
                  onClick={handlePreviewClick}
                  disabled={isPreviewing}
                  className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                    isPreviewing ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95'
                  }`}
                >
                  {isPreviewing ? 'Loading...' : 'Claim'}
                </button>
              </div>
            )}

            {showPreview && previewAssets && (
              <div className="w-full mt-4 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/50 shadow-lg z-20 relative">
                <h3 className="text-white font-bold text-sm mb-2">Claim Your Rewards</h3>
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-indigo-200">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <span className="block text-slate-400 mb-1">CHH Balance</span>
                    <span className="font-bold text-white text-lg">{Math.round(Number(previewAssets.chhBalance) / 10**18)} <span className="text-xs text-indigo-300">CHH</span></span>
                  </div>

                  {(Number(previewAssets.heroCommon) > 0 || Number(previewAssets.heroUncommon) > 0 || Number(previewAssets.heroRare) > 0) && (
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="block text-slate-400 mb-1">Heroes</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: Number(previewAssets.heroCommon) }).map((_, i) => (
                          <div key={`hc-${i}`} className="w-8 h-10 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-slate-300 text-[10px]">C</span>
                          </div>
                        ))}
                        {Array.from({ length: Number(previewAssets.heroUncommon) }).map((_, i) => (
                          <div key={`huc-${i}`} className="w-8 h-10 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                          </div>
                        ))}
                        {Array.from({ length: Number(previewAssets.heroRare) }).map((_, i) => (
                          <div key={`hr-${i}`} className="w-8 h-10 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-blue-400 text-[10px]">R</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Number(previewAssets.equipCommon) > 0 || Number(previewAssets.equipUncommon) > 0 || Number(previewAssets.equipRare) > 0) && (
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="block text-slate-400 mb-1">Equipment</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: Number(previewAssets.equipCommon) }).map((_, i) => (
                          <div key={`ec-${i}`} className="w-8 h-8 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-slate-300 text-[10px]">C</span>
                          </div>
                        ))}
                        {Array.from({ length: Number(previewAssets.equipUncommon) }).map((_, i) => (
                          <div key={`euc-${i}`} className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                          </div>
                        ))}
                        {Array.from({ length: Number(previewAssets.equipRare) }).map((_, i) => (
                          <div key={`er-${i}`} className="w-8 h-8 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-blue-400 text-[10px]">R</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Number(previewAssets.itemPotion) > 0 || Number(previewAssets.itemElixir) > 0 || Number(previewAssets.itemWhetstone) > 0) && (
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="block text-slate-400 mb-1">Items</span>
                      <div className="flex flex-wrap gap-2">
                        {Number(previewAssets.itemPotion) > 0 && (
                          <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700">
                            <span className="text-sm">🧪</span>
                            <span className="font-bold text-white text-[10px]">x{Number(previewAssets.itemPotion)}</span>
                          </div>
                        )}
                        {Number(previewAssets.itemElixir) > 0 && (
                          <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700">
                            <span className="text-sm">🍷</span>
                            <span className="font-bold text-white text-[10px]">x{Number(previewAssets.itemElixir)}</span>
                          </div>
                        )}
                        {Number(previewAssets.itemWhetstone) > 0 && (
                          <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700">
                            <span className="text-sm">🪨</span>
                            <span className="font-bold text-white text-[10px]">x{Number(previewAssets.itemWhetstone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    disabled={isClaiming}
                    className="flex-1 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all bg-slate-700 text-white hover:bg-slate-600 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClaim}
                    disabled={isClaiming}
                    className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                      isClaiming ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95'
                    }`}
                  >
                    {isClaiming ? 'Claiming...' : 'Confirm Claim'}
                  </button>
                </div>
              </div>
            )}

            {/* Version Display (Right) */}
            {view === View.HOME ? (
               <span className="text-[10px] text-slate-600 font-mono font-bold pt-1 opacity-70">
                 Ver.{APP_VERSION}
               </span>
            ) : (
               <div></div>
            )}
          </div>
        </div>

        <div className="px-6 space-y-12">
          {/* Active Quests */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <span className="w-1 h-4 bg-amber-500 rounded-full mr-3"></span>
                {t('status.ongoing_quests')}
              </h2>
              {state.activeQuests.length > 0 && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded-full">
                  {t('status.in_progress')}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {state.activeQuests.length > 0 ? (
                state.activeQuests.map(q => (
                  <QuestItem 
                    key={q.id} 
                    quest={q} 
                    config={state.questConfigs.find(c => c.rank === q.rank)}
                    farcasterUser={farcasterUser} 
                    onDebugComplete={onDebugCompleteQuest} // Always pass it if provided
                    onClick={() => view === View.HOME && onNavigate?.(View.RETURN)}
                  />
                ))
              ) : (
                <div className="bg-slate-800 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
                  <p className="text-slate-500 text-xs font-bold tracking-wider">{t('status.waiting_quest')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Party Presets */}
          {view === View.HOME && (
            <div className="pb-16">
              <div className="flex justify-between items-center mb-8 px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="w-1 h-4 bg-indigo-500 rounded-full mr-3"></span>
                  {t('status.tactical_teams')}
                </h2>
                <div className="h-px flex-1 mx-6 bg-slate-800"></div>
              </div>
              
              <div className="space-y-16">
                {state.unlockedParties.map((isUnlocked, partyIndex) => {
                  if (!isUnlocked) return null;
                  const presetIds = state.partyPresets[partyIndex];
                  const partyHeroes = presetIds.map(id => state.heroes.find(h => h.id === id)).filter((h): h is any => !!h);
                  const isActive = state.activePartyIndex === partyIndex;
                  const isQuesting = partyHeroes.some(h => state.activeQuests.some(q => q.heroIds.includes(h.id)));
                  const partyStats = calculatePartyStats(partyHeroes, state.equipment);

                  return (
                    <div key={partyIndex} className={`relative p-6 pt-10 rounded-3xl border transition-all ${
                      isActive 
                        ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm' 
                        : 'bg-slate-800/40 border-slate-700 opacity-90'
                    } ${partyStats.teamDamageReduction > 0 ? 'ring-2 ring-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.6)]' : ''}`}>
                      {partyStats.teamDamageReduction > 0 && (
                        <>
                          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-xl z-0 animate-pulse pointer-events-none"></div>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-md z-0 animate-pulse pointer-events-none" style={{ animationDuration: '2s' }}></div>
                          <div className="absolute inset-0 rounded-3xl border border-cyan-300/50 z-10 pointer-events-none mix-blend-overlay"></div>
                        </>
                      )}
                      {/* Unit Header Label */}
                      <div className="absolute -top-4 left-6 flex items-center gap-3 z-10">
                        <div className={`px-4 py-1.5 rounded-full border font-bold text-[10px] tracking-wider shadow-sm ${
                            isActive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}>
                            {t('status.party')} 0{partyIndex + 1}
                        </div>
                        {isQuesting && (
                          <div className="flex items-center gap-2 bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span className="text-[9px] text-emerald-400 font-bold tracking-wide">{t('status.questing')}</span>
                          </div>
                        )}
                      </div>

                      <PartySlotGrid
                        heroIds={presetIds}
                        heroes={state.heroes}
                        activeQuestHeroIds={state.activeQuests.flatMap(q => q.heroIds)}
                        readOnly={true}
                        showSlotLabels={true}
                        className="grid grid-cols-3 gap-4 relative z-10"
                        equipment={state.equipment}
                        teamDefBonus={partyStats.teamDamageReduction}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {actionButtonLabel && (
        <div className="p-5 pb-10 bg-slate-900 border-t border-slate-800 sticky bottom-0 z-[40]">
          <button 
            onClick={() => { playClick(); onAction?.(); }}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-lg text-white shadow-md transition-all tracking-wider"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
