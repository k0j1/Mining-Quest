
import React, { useState, useEffect } from 'react';
import { GameState, View, QuestConfig } from '../types';
import { playClick } from '../utils/sound';
import Header from './Header';
import PartySlotGrid from './PartySlotGrid';
import { IS_TEST_MODE, APP_VERSION } from '../constants';

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
}

const ADMIN_FIDS = [406233];

const QuestItem: React.FC<{ 
    quest: any; 
    config?: QuestConfig; 
    farcasterUser?: any; 
    onDebugComplete?: (id: string) => void;
    onClick?: () => void;
}> = ({ quest, config, farcasterUser, onDebugComplete, onClick }) => {
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
            予想報酬: <span className="text-amber-500 font-bold">{minReward}-{maxReward}</span> $CHH
          </p>
        </div>

        <div className="text-right select-none" onClick={handleDebugClick}>
          {isCompleted ? (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Status</span>
              <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span>✓</span>
                <span>完了</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">残り時間</span>
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
  state, actionButtonLabel, onAction, title, view, isSoundOn, onToggleSound, onDebugAddTokens, farcasterUser, onChainBalance, onAccountClick, onShowLightpaper, onDebugCompleteQuest, onToggleDebug, onNavigate, isFrameAdded, onAddApp
}) => {
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
            {IS_TEST_MODE && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/10">
                  <span className="text-3xl font-black text-white/30 -rotate-12 border-4 border-white/30 px-4 py-2 rounded-xl uppercase tracking-widest backdrop-blur-[1px]">
                     TEST MODE
                  </span>
               </div>
            )}
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
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">View Lightpaper</span>
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
                  <span className="text-[10px] font-bold text-white tracking-wide">アプリを登録</span>
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
                Ongoing Quests
              </h2>
              {state.activeQuests.length > 0 && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded-full">
                  進行中
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
                  <p className="text-slate-500 text-xs font-bold tracking-wider">クエスト待機中</p>
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
                  Tactical Teams
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

                  return (
                    <div key={partyIndex} className={`relative p-6 pt-10 rounded-3xl border transition-all ${
                      isActive 
                        ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm' 
                        : 'bg-slate-800/40 border-slate-700 opacity-90'
                    }`}>
                      {/* Unit Header Label */}
                      <div className="absolute -top-4 left-6 flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full border font-bold text-[10px] tracking-wider shadow-sm ${
                            isActive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}>
                            PARTY 0{partyIndex + 1}
                        </div>
                        {isQuesting && (
                          <div className="flex items-center gap-2 bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span className="text-[9px] text-emerald-400 font-bold tracking-wide">任務中</span>
                          </div>
                        )}
                      </div>

                      <PartySlotGrid
                        heroIds={presetIds}
                        heroes={state.heroes}
                        activeQuestHeroIds={state.activeQuests.flatMap(q => q.heroIds)}
                        readOnly={true}
                        showSlotLabels={true}
                        className="grid grid-cols-3 gap-4"
                        equipment={state.equipment}
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
