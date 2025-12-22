
import React, { useState, useEffect } from 'react';
import { GameState, View } from '../types';
import HeroCard from './HeroCard';

interface StatusBoardProps {
  state: GameState;
  actionButtonLabel?: string;
  onAction?: () => void;
  title: string;
  view: View;
}

const Timer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="font-mono text-orange-400">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

const StatusBoard: React.FC<StatusBoardProps> = ({ state, actionButtonLabel, onAction, title, view }) => {
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
                  <div key={q.id} className="glass-panel p-4 rounded-xl border-l-4 border-orange-500 flex justify-between items-center animate-pulse-slow">
                    <div>
                      <p className="font-bold text-sm">{q.name}</p>
                      <p className="text-[10px] text-slate-400">報酬: {q.reward} $CHH</p>
                    </div>
                    <div className="text-right">
                      <Timer endTime={q.endTime} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-slate-500 text-xs">アクティブなクエストはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Section */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
               <span className="w-1.5 h-4 bg-indigo-500 rounded-full mr-2"></span>
               装備品
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {state.equipment.length > 0 ? (
                state.equipment.map(e => (
                  <div key={e.id} className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg flex items-center space-x-2">
                    <div className="text-lg">
                      {e.type === 'Pickaxe' ? '⛏️' : e.type === 'Helmet' ? '🪖' : '👢'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate text-indigo-300">{e.name}</p>
                      <p className="text-[9px] text-slate-500">Bonus: +{e.bonus}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-slate-600 text-xs italic">所持している装備はありません</p>
              )}
            </div>
          </div>

          {/* Idle Heroes Section */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-4 bg-green-500 rounded-full mr-2"></span>
              待機中のヒーロー ({state.heroes.length})
            </h2>
            <div className="space-y-2">
              {state.heroes.length > 0 ? (
                state.heroes.map((hero, index) => (
                  <HeroCard key={hero.id} hero={hero} index={index} compact />
                ))
              ) : (
                <p className="text-slate-600 text-xs italic">待機中のヒーローはいません</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Area - Integrated into the bottom of the panel with sticky position */}
      {actionButtonLabel && (
        <div className="p-6 pb-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent sticky bottom-0 z-30">
          <button 
            onClick={onAction}
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
