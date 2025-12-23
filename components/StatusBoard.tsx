
import React, { useState, useEffect } from 'react';
import { GameState, View, QuestRank } from '../types';
import { QUEST_CONFIG } from '../constants';
import HeroCard from './HeroCard';
import { playClick } from '../utils/sound';

interface StatusBoardProps {
  state: GameState;
  actionButtonLabel?: string;
  onAction?: () => void;
  title: string;
  view: View;
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

  return (
    <div 
      className={`glass-panel p-4 rounded-xl border-l-4 flex justify-between items-center transition-all duration-500 ${
        isCompleted 
          ? 'border-green-500 bg-green-900/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
          : 'border-orange-500 animate-pulse-slow'
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-black px-1.5 rounded text-white ${
            quest.rank === 'C' ? 'bg-slate-600' :
            quest.rank === 'UC' ? 'bg-green-600' :
            quest.rank === 'R' ? 'bg-blue-600' :
            quest.rank === 'E' ? 'bg-orange-600' :
            'bg-purple-600'
          }`}>{quest.rank}</span>
          <p className={`font-bold text-sm ${isCompleted ? 'text-green-300' : 'text-slate-200'}`}>
            {quest.name}
          </p>
        </div>
        <p className="text-[10px] text-slate-400">
          報酬レンジ: <span className="text-yellow-400 font-bold">{config.minReward} - {config.maxReward}</span> $CHH
        </p>
      </div>
      <div className="text-right">
        {isCompleted ? (
          <div className="flex items-center space-x-1 text-green-400 font-bold animate-bounce">
            <span className="text-lg">✓</span>
            <span className="font-orbitron tracking-wider">COMPLETE</span>
          </div>
        ) : (
          <span className="font-mono text-orange-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
};

const StatusBoard: React.FC<StatusBoardProps> = ({ state, actionButtonLabel, onAction, title, view }) => {
  // Get Main Party (First 3 heroes)
  const mainParty = state.heroes.slice(0, 3);

  const handleAction = () => {
    playClick();
    if (onAction) onAction();
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header Section: Token Balance */}
        <div className="p-6 bg-slate-900/80 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-orbitron font-bold text-indigo-300">{title}</h1>
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <span className="text-yellow-400 text-sm font-black">$CHH:</span>
              <span className="font-orbitron text-lg font-bold">{state.tokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Quests Section */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full mr-2"></span>
              進行中クエスト
            </h2>
            <div className="space-y-2">
              {state.activeQuests.length > 0 ? (
                state.activeQuests.map(q => (
                  <QuestItem key={q.id} quest={q} />
                ))
              ) : (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-slate-500 text-xs">アクティブなクエストはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Party Display for Home Screen */}
          {view === View.HOME && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full mr-2"></span>
                現在の編成
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {mainParty.map((hero, index) => (
                  <div key={hero.id} className="pointer-events-none">
                     <HeroCard 
                        hero={hero} 
                        index={index} 
                        isMainSlot // Keep consistent styling
                        // Interactions disabled for home view summary
                      />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Area - Integrated into the bottom of the panel with sticky position */}
      {actionButtonLabel && (
        <div className="p-6 pb-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent sticky bottom-0 z-30">
          <button 
            onClick={handleAction}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(79,70,229,0.4)] border border-white/10 hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
