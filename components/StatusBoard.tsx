
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
    <div className={`relative p-5 glass-panel rounded-3xl overflow-hidden transition-all duration-500 border border-white/5 ${
      isCompleted ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-amber-500/5'
    }`}>
      {/* Amber Scanning Line */}
      {!isCompleted && (
        <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/50 shadow-[0_0_15px_#fbbf24] animate-scan-line"></div>
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
              <div className="flex items-center gap-1.5 text-emerald-400 font-black font-orbitron text-[10px] px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 animate-pulse">
                <span>✓</span>
                <span>COMPLETE</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Feed</span>
              <div className="font-orbitron font-black text-lg text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] tabular-nums">
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

      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
        {/* Banner matching the requested style */}
        <div className="px-5 pt-5 mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-amber-500/20 blur-3xl opacity-30 group-hover:opacity-60 transition-opacity rounded-[3rem]"></div>
            <img 
              src={view === View.RETURN ? "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Result.png" : "https://miningquest.k0j1.v2002.coreserver.jp/images/B_Home.png"} 
              alt="Banner" 
              className="w-full h-auto rounded-[2.5rem] shadow-2xl border border-white/10 relative z-10"
            />
          </div>
        </div>

        <div className="px-6 space-y-14">
          {/* Active Quests */}
          <div>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] flex items-center">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full mr-3 shadow-[0_0_10px_#fbbf24]"></span>
                Ongoing Quests
              </h2>
              {state.activeQuests.length > 0 && (
                <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                  TRACKING
                </span>
              )}
            </div>
            <div className="space-y-4">
              {state.activeQuests.length > 0 ? (
                state.activeQuests.map(q => <QuestItem key={q.id} quest={q} />)
              ) : (
                <div className="bg-black/40 border border-dashed border-white/5 rounded-3xl p-12 text-center shadow-inner">
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em]">Standby in Base</p>
                </div>
              )}
            </div>
          </div>

          {/* Party Presets - Synced with TEAM view */}
          {view === View.HOME && (
            <div className="pb-16">
              <div className="flex justify-between items-center mb-10 px-1">
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full mr-3 shadow-[0_0_10px_#6366f1]"></span>
                  Tactical Teams
                </h2>
                <div className="h-px flex-1 mx-6 bg-white/5"></div>
              </div>
              
              <div className="space-y-20">
                {state.unlockedParties.map((isUnlocked, partyIndex) => {
                  if (!isUnlocked) return null;
                  const presetIds = state.partyPresets[partyIndex];
                  const partyHeroes = presetIds.map(id => state.heroes.find(h => h.id === id)).filter((h): h is any => !!h);
                  const isActive = state.activePartyIndex === partyIndex;
                  const isQuesting = partyHeroes.some(h => state.activeQuests.some(q => q.heroIds.includes(h.id)));

                  return (
                    <div key={partyIndex} className={`relative p-8 pt-12 rounded-[2.5rem] border transition-all duration-500 ${
                      isActive 
                        ? 'bg-indigo-950/10 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.1)]' 
                        : 'bg-black/40 border-white/5 opacity-80'
                    }`}>
                      {/* Unit Header Label */}
                      <div className="absolute -top-5 left-8 flex items-center gap-4">
                        <div className={`px-5 py-2 rounded-full border font-black font-orbitron text-[10px] tracking-[0.2em] shadow-2xl ${
                            isActive ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-slate-900 text-slate-500 border-white/10'
                        }`}>
                            PARTY 0{partyIndex + 1}
                        </div>
                        {isQuesting && (
                          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-lg">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                            <span className="text-[8px] text-emerald-400 font-black tracking-widest uppercase">Live Mission</span>
                          </div>
                        )}
                      </div>

                      {/* Heroes Grid with SLOT labels - Matches PartyView */}
                      <div className="grid grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => {
                          const hero = partyHeroes[i];
                          const isLocked = hero ? state.activeQuests.some(q => q.heroIds.includes(hero.id)) : false;
                          return (
                            <div key={i} className="relative group">
                              <div className="absolute -top-5 left-0 right-0 flex justify-center z-20">
                                  <span className={`text-[7px] font-black px-2 py-0.5 rounded-full shadow-lg border whitespace-nowrap transition-all ${
                                    isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 backdrop-blur-md' : 'bg-black/60 text-slate-600 border-white/5'
                                  }`}>SLOT {i + 1}</span>
                              </div>

                              {hero ? (
                                <HeroCard hero={hero} index={i} isMainSlot isLocked={isLocked} />
                              ) : (
                                <div className="w-full aspect-[4/5] bg-black/40 rounded-[1.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center shadow-inner opacity-40">
                                  <span className="text-[24px] mb-1 opacity-10">＋</span>
                                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">Empty</span>
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
        <div className="p-6 pb-14 bg-gradient-to-t from-black via-black/90 to-transparent sticky bottom-0 z-[40]">
          <button 
            onClick={() => { playClick(); onAction?.(); }}
            className="w-full py-5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 rounded-3xl font-black text-lg text-black shadow-[0_10px_40px_rgba(251,191,36,0.4)] border border-amber-400/30 active:translate-y-1 transition-all uppercase tracking-[0.3em] font-orbitron"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
