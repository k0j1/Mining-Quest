
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
          <h2 className="text-3xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] animate-bounce-small">
            MISSION COMPLETE
          </h2>
          <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase mt-2">Quest Report</p>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2">
          {results.map((res, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 shadow-lg animate-slide-up"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-2">
                <div>
                  <span className="text-[10px] font-black bg-indigo-600 px-1.5 py-0.5 rounded text-white mr-2">{res.rank}</span>
                  <span className="font-bold text-slate-200">{res.questName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-yellow-400 font-bold font-orbitron">+{res.totalReward} $CHH</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-2">
                <div>基本報酬: {res.baseReward}</div>
                <div>装備ボーナス: +{res.bonusReward}</div>
              </div>

              <div className="space-y-1 bg-black/20 p-2 rounded">
                {res.logs.map((log, i) => (
                  <p key={i} className="text-[10px] leading-tight">
                    {log.includes('悲報') ? '💀 ' : log.includes('💥') ? '💥 ' : '• '}
                    <span className={log.includes('悲報') ? 'text-red-400 font-bold' : log.includes('残') ? 'text-orange-300' : 'text-slate-300'}>
                      {log}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Total & Button */}
        <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-900/50 rounded-2xl p-6 text-center shadow-2xl">
          <p className="text-slate-400 text-xs mb-1">TOTAL EARNINGS</p>
          <div className="text-4xl font-orbitron font-black text-yellow-400 drop-shadow-md mb-6">
            +{totalTokens.toLocaleString()} <span className="text-lg text-yellow-600">$CHH</span>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
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
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-small {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; opacity: 0; }
        .animate-bounce-small { animation: bounce-small 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default ResultModal;
