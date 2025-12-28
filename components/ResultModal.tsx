
import React, { useEffect } from 'react';
import { playFanfare } from '../utils/sound';

interface QuestResult {
  questName: string;
  rank: string;
  totalReward: number;
  baseReward: number;
  bonusReward: number;
  logs: string[];
}

interface ResultModalProps {
  results: QuestResult[];
  totalTokens: number;
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ results, totalTokens, onClose }) => {
  
  useEffect(() => {
    playFanfare();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-amber-500 mb-1">
            MISSION COMPLETE
          </h2>
          <p className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">Quest Report</p>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2">
          {results.map((res, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold bg-indigo-600 px-1.5 py-0.5 rounded text-white mr-2">{res.rank}</span>
                  <span className="font-bold text-slate-200 text-sm">{res.questName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-amber-500 font-bold">+{res.totalReward} $CHH</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 mb-3">
                <div>基本報酬: {res.baseReward}</div>
                <div>装備ボーナス: +{res.bonusReward}</div>
              </div>

              <div className="space-y-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                {res.logs.map((log, i) => (
                  <p key={i} className="text-[10px] leading-relaxed">
                    {log.includes('悲報') ? '💀 ' : log.includes('💥') ? '💥 ' : '• '}
                    <span className={log.includes('悲報') ? 'text-red-400 font-bold' : log.includes('残') ? 'text-orange-300' : 'text-slate-400'}>
                      {log}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Total & Button */}
        <div className="mt-6 pt-6 border-t border-slate-800 bg-slate-900 rounded-2xl p-6 text-center shadow-xl border border-slate-800">
          <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wide">Total Earnings</p>
          <div className="text-4xl font-black text-white mb-6">
            +{totalTokens.toLocaleString()} <span className="text-lg text-amber-500">$CHH</span>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
          >
            報酬を受け取る
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ResultModal;
