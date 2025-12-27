
import React, { useState, useEffect } from 'react';
import { GameState, View, QuestRank } from '../types';
import { QUEST_CONFIG } from '../constants';
import HeroCard from './HeroCard';
import { playClick } from '../utils/sound';
import Header from './Header';

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
}

const QuestItem: React.FC<{ quest: any }> = ({ quest }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((quest.endTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((quest.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [quest.endTime]);

  const isCompleted = timeLeft <= 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const config = QUEST_CONFIG[quest.rank as QuestRank];

  const rankColors: Record<string, string> = {
    C: 'text-zinc-400', UC: 'text-emerald-400', R: 'text-indigo-400', E: 'text-fuchsia-400', L: 'text-amber-400'
  };

  return (
    <div className={`relative p-5 glass-panel rounded-2xl overflow-hidden transition-all duration-500 border border-white/5 ${
      isCompleted ? 'bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'bg-amber-500/5 ring-1 ring-amber-500/20'
    }`}>
      {/* Scanning Line Animation */}
      {!isCompleted && (
        <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/50 blur-[1px] shadow-[0_0_10px_#fbbf24] animate-scan-line"></div>
      )}

      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black font-orbitron ${rankColors[quest.rank]}`}>[{quest.rank} RANK]</span>
            <h3 className="font-bold text-sm text-white">{quest.name}</h3>
          </div>
          <p className="text-[10px] text-slate-500 tracking-wider">
            EXPECTED: <span className="text-amber-400 font-bold">{config.minReward}-{config.maxReward}</span> $CHH
          </p>
        </div>

        <div className="text-right">
          {isCompleted ? (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-1 text-emerald-400 font-black font-orbitron text-sm animate-pulse">
                <span>✓</span>
                <span>COMPLETE</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Time Remaining</span>
              <div className="font-orbitron font-black text-lg text-amber-500 tabular-nums">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line { animation: scan-line 4s linear infinite; }
      `}</style>
    </div>
  );
};

const StatusBoard: React.FC<StatusBoardProps> = ({ 
  state, actionButtonLabel, onAction, title, view, isSoundOn, onToggleSound, onDebugAddTokens, farcasterUser, onChainBalance, onAccountClick
}) => {
  return (
    <div className="flex flex-col h-full relative">
      <Header 
        title={title} tokens={state.tokens} isSoundOn={isSoundOn} onToggleSound={onToggleSound} onDebugAddTokens={onDebugAddTokens}
        farcasterUser={farcasterUser} onChainBalance={onChainBalance} onAccountClick={onAccountClick}
      />

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        {/* Banner with high-end shadow */}
        <div className="px-5 pt-5 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-amber-500/20 blur-xl opacity-30 group-hover:opacity-50 transition-opacity rounded-3xl"></div>
            <img 
              src={view === View.RETURN ? "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Result.png" : "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Home.png"} 
              alt="Banner" 
              className="w-full h-auto rounded-[2rem] shadow-2xl border border-white/10 relative z-10"
            />
          </div>
        </div>

        <div className="px-6 space-y-10">
          {/* Active Quests */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.4em] flex items-center">
                <span className="w-1 h-3 bg-amber-500 rounded-full mr-3 shadow-[0_0_8px_#fbbf24]"></span>
                Ongoing Missions
              </h2>
              {state.activeQuests.length > 0 && (
                <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                  SYSTEM ACTIVE
                </span>
              )}
            </div>
            <div className="space-y-3">
              {state.activeQuests.length > 0 ? (
                state.activeQuests.map(q => <QuestItem key={q.id} quest={q} />)
              ) : (
                <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-10 text-center">
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">No Active Operations</p>
                </div>
              )}
            </div>
          </div>

          {/* Party Presets - Home View */}
          {view === View.HOME && (
            <div className="pb-10">
              <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.4em] flex items-center">
                  <span className="w-1 h-3 bg-indigo-500 rounded-full mr-3 shadow-[0_0_8px_#6366f1]"></span>
                  Deployed Teams
                </h2>
                <div className="h-px flex-1 mx-4 bg-white/5"></div>
              </div>
              
              <div className="space-y-8">
                {state.unlockedParties.map((isUnlocked, partyIndex) => {
                  if (!isUnlocked) return null;
                  const presetIds = state.partyPresets[partyIndex];
                  const partyHeroes = presetIds.map(id => state.heroes.find(h => h.id === id)).filter((h): h is any => !!h);
                  const isActive = state.activePartyIndex === partyIndex;
                  const isQuesting = partyHeroes.some(h => state.activeQuests.some(q => q.heroIds.includes(h.id)));

                  return (
                    <div key={partyIndex} className={`relative p-6 rounded-[2rem] border transition-all duration-500 ${
                      isActive 
                        ? 'bg-indigo-900/10 border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.1)]' 
                        : 'bg-black/40 border-white/5'
                    }`}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <h3 className={`text-xs font-black font-orbitron tracking-widest uppercase ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                            Unit-0{partyIndex + 1}
                          </h3>
                        </div>
                        {isQuesting && (
                          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                            <span className="text-[8px] text-amber-500 font-black tracking-widest uppercase">Mission Live</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => {
                          const hero = partyHeroes[i];
                          return (
                            <div key={i}>
                              {hero ? (
                                <HeroCard hero={hero} index={i} isMainSlot isLocked={state.activeQuests.some(q => q.heroIds.includes(hero.id))} />
                              ) : (
                                <div className="w-full aspect-[4/5] bg-black/40 rounded-2xl border border-dashed border-white/10 flex items-center justify-center">
                                  <span className="text-[8px] font-black text-slate-700 tracking-tighter uppercase">Vacant</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {actionButtonLabel && (
        <div className="p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent sticky bottom-0 z-30">
          <button 
            onClick={() => { playClick(); onAction?.(); }}
            className="w-full py-5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-2xl font-black text-lg text-black shadow-[0_10px_40px_rgba(251,191,36,0.4)] border border-white/20 active:translate-y-1 transition-all uppercase tracking-widest font-orbitron"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
