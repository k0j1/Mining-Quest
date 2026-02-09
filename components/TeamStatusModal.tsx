
import React from 'react';
import { playClick } from '../utils/sound';

interface TeamStatusModalProps {
  stats: {
    totalHp: number;
    maxHp: number;
    rewardBonus: number;
    rewardHero: number;
    rewardEquip: number;
    speedBonus: number;
    speedHero: number;
    speedEquip: number;
    teamDefBonus: number;
  };
  onClose: () => void;
}

const TeamStatusModal: React.FC<TeamStatusModalProps> = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide uppercase">
            <span className="text-2xl">📊</span> Team Status
          </h2>
          <button 
            onClick={() => { playClick(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-900/50">
            
            {/* HP Status */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total HP</span>
                    <span className="text-xl font-black text-white">{stats.totalHp} <span className="text-sm text-slate-500">/ {stats.maxHp}</span></span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${stats.totalHp < stats.maxHp * 0.3 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(stats.totalHp / (stats.maxHp || 1)) * 100}%` }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* Reward Bonus */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-2xl border border-amber-500/30">
                            ⛏️
                        </div>
                        <div>
                            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Reward Bonus</div>
                            <div className="text-2xl font-black text-white">+{stats.rewardBonus}%</div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Hero Skills</span>
                            <span className="font-bold text-amber-400">+{stats.rewardHero}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Equipment</span>
                            <span className="font-bold text-amber-400">+{stats.rewardEquip}%</span>
                        </div>
                    </div>
                </div>

                {/* Speed Bonus */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">
                            👢
                        </div>
                        <div>
                            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Speed Boost</div>
                            <div className="text-2xl font-black text-white">+{stats.speedBonus}%</div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Hero Skills</span>
                            <span className="font-bold text-emerald-400">+{stats.speedHero}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Equipment</span>
                            <span className="font-bold text-emerald-400">+{stats.speedEquip}%</span>
                        </div>
                    </div>
                </div>

                {/* Defense Bonus */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-2xl border border-indigo-500/30">
                            🛡️
                        </div>
                        <div>
                            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Team Defense</div>
                            <div className="text-2xl font-black text-white">+{stats.teamDefBonus}%</div>
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 pl-1">
                        *チーム全体に適用されるダメージ軽減効果です。<br/>個別の装備(Helmet)効果はここには含まれません。
                    </p>
                </div>

            </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default TeamStatusModal;
