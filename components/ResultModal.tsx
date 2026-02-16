
import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { playFanfare, playClick } from '../utils/sound';
import gsap from 'gsap';
import { QuestResult } from '../types';

interface ResultModalProps {
  results: QuestResult[];
  totalTokens: number;
  onClose: () => void;
  onConfirm: (results: QuestResult[], closeModal?: boolean) => Promise<void>; // New Confirm Action
  farcasterUser?: any; 
}

const ResultModal: React.FC<ResultModalProps> = ({ results, totalTokens, onClose, onConfirm, farcasterUser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const totalRef = useRef<HTMLDivElement>(null);
  const [isPreparingClaim, setIsPreparingClaim] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    playFanfare();
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Modal Container Pop
      tl.from(containerRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(1.5)"
      });

      // 2. Stagger items
      if (itemsRef.current.length > 0) {
        tl.from(itemsRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.15,
          ease: "power2.out"
        }, "-=0.2");
      }

      // 3. Total Score Boom
      if (totalRef.current) {
        tl.from(totalRef.current, {
          scale: 0.5,
          opacity: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)"
        }, "-=0.2");
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleConfirmClaim = async () => {
      playClick();
      setIsPreparingClaim(true);
      setErrorMsg(null);
      try {
        // Standard Claim (DB Save) and Close
        await onConfirm(results, true);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.message || "エラーが発生しました");
      } finally {
        setIsPreparingClaim(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div ref={containerRef} className="w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-amber-500 mb-1">
            MISSION COMPLETE
          </h2>
          <p className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">Quest Report</p>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2 custom-scrollbar">
          {results.map((res, idx) => (
            <div 
              key={idx}
              ref={el => { if(el) itemsRef.current[idx] = el }}
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
              
              {/* Rewards Breakdown */}
              <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-[10px] text-slate-500 mb-4 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/30">
                <div className="text-slate-400">基本報酬:</div>
                <div className="text-right font-mono font-bold text-slate-300">{res.baseReward}</div>
                
                <div className="text-emerald-400 font-bold mt-1">ボーナス合計:</div>
                <div className="text-right font-mono text-emerald-400 font-bold mt-1">+{res.bonusReward}</div>
                
                <div className="text-[9px] pl-2 border-l border-slate-700 ml-1 text-slate-500">└ ヒーロー特性</div>
                <div className="text-[9px] text-right font-mono text-slate-500">+{res.heroBonus}</div>
                
                <div className="text-[9px] pl-2 border-l border-slate-700 ml-1 text-slate-500">└ 装備品効果</div>
                <div className="text-[9px] text-right font-mono text-slate-500">+{res.equipmentBonus}</div>
              </div>

              {/* Action Logs */}
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
        <div ref={totalRef} className="mt-6 pt-6 border-t border-slate-800 bg-slate-900 rounded-2xl p-6 text-center shadow-xl border border-slate-800 shrink-0">
          <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wide">Total Earnings</p>
          <div className="text-4xl font-black text-white mb-6">
            +{totalTokens.toLocaleString()} <span className="text-lg text-amber-500">$CHH</span>
          </div>

          {/* Error Message Area */}
          {errorMsg && (
            <div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-lg text-left overflow-auto max-h-32">
                <p className="text-red-400 text-xs font-bold mb-1">ERROR</p>
                <p className="text-red-300 text-[10px] font-mono whitespace-pre-wrap">{errorMsg}</p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
             {/* Cancel Button */}
             <button 
                onClick={() => { playClick(); onClose(); }}
                disabled={isPreparingClaim}
                className="flex-1 min-w-[120px] py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 rounded-xl font-bold transition-all active:scale-95"
             >
                キャンセル
             </button>

             {/* Claim Button */}
             <button 
                onClick={handleConfirmClaim}
                disabled={isPreparingClaim}
                className="flex-1 min-w-[120px] py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg border-b-4 border-emerald-900 flex items-center justify-center gap-2"
             >
                {isPreparingClaim ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "報酬を受け取る"
                )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
