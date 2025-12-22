
import React from 'react';
import { GameState, Hero, Equipment, Quest } from '../types';
import HeroCard from './HeroCard';

interface StatusBoardProps {
  state: GameState;
  actionButtonLabel?: string;
  onAction?: () => void;
  title: string;
}

const StatusBoard: React.FC<StatusBoardProps> = ({ state, actionButtonLabel, onAction, title }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-32">
      {/* Header Section */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-orbitron font-bold text-indigo-300">{title}</h1>
          <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-yellow-500/50">
            <span className="text-yellow-400 text-lg font-bold">CHIWA:</span>
            <span className="font-orbitron text-xl">{state.tokens.toLocaleString()}</span>
          </div>
        </div>

        {/* Content Tabs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Quests */}
          <div className="glass-panel p-4 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">進行中のクエスト</h2>
            <div className="space-y-3">
              {state.activeQuests.length > 0 ? (
                state.activeQuests.map(q => (
                  <div key={q.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{q.name}</p>
                      <p className="text-xs text-slate-500">報酬: {q.reward} CHIWA</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-mono text-sm">タイマー終了待機中</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic">現在実行中のクエストはありません</p>
              )}
            </div>
          </div>

          {/* Equipment */}
          <div className="glass-panel p-4 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">装備品</h2>
            <div className="flex flex-wrap gap-2">
              {state.equipment.map(e => (
                <div key={e.id} className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-1 rounded text-xs flex items-center space-x-2">
                  <span>⚒️</span>
                  <span>{e.name} (+{e.bonus})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Idle Heroes */}
        <div className="mt-4">
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">待機中のヒーロー</h2>
          <div className="grid grid-cols-1 gap-3">
            {state.heroes.map(hero => (
              <HeroCard key={hero.id} hero={hero} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Button (Fixed-ish above nav) */}
      {actionButtonLabel && (
        <div className="px-6 mt-4">
          <button 
            onClick={onAction}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
