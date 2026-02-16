
import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { playFanfare, playClick, playConfirm } from '../utils/sound';
import gsap from 'gsap';
import { QuestResult } from '../types';
import { createWalletClient, custom, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { sdk } from '@farcaster/frame-sdk';
import { supabase } from '../lib/supabase';

// Contract Address
const REWARD_CONTRACT_ADDRESS = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

// API Endpoint
const SIGN_API_ENDPOINT = "/api/sign_claim.php"; 

const CLAIM_ABI = parseAbi([
  'function claimReward(uint256 fid, uint256 questPid, uint256 questId, uint256 questReward, uint256 reward, uint256 totalReward, bytes signature) external'
]);

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
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Success State
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    playFanfare();
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current || claimSuccess) return;

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
  }, [claimSuccess]);

  const handleConfirmClaim = async () => {
      playClick();
      setIsPreparingClaim(true);
      setErrorMsg(null);
      setStatusMsg('Saving...');

      try {
        // 1. DB Save First (Always required)
        // Pass closeModal=false because we might proceed to on-chain claim
        await onConfirm(results, false);

        // 2. Check if we should proceed to On-Chain Claim
        let hash: string | null = null;
        if (farcasterUser?.fid && totalTokens > 0 && sdk.wallet.ethProvider) {
            
            // Find valid result to claim (Currently claims one quest at a time or aggregates)
            const targetResult = results.find(r => r.totalReward > 0 && r.questId && r.questMasterId);
            
            if (targetResult) {
                setStatusMsg('Verifying...');
                
                // Fetch Updated Stats (Important: onConfirm just updated the DB, we need the new total_reward)
                const { data: stats, error } = await supabase
                    .from('quest_player_stats')
                    .select('total_reward')
                    .eq('fid', farcasterUser.fid)
                    .single();

                if (error || !stats) {
                    throw new Error("Failed to fetch player stats for claim verification.");
                }

                // Prepare Params
                const params = {
                    fid: farcasterUser.fid,
                    questPid: parseInt(targetResult.questId || "0"),
                    questId: targetResult.questMasterId || 0,
                    questReward: targetResult.baseReward, 
                    reward: targetResult.totalReward,
                    totalReward: stats.total_reward || 0
                };

                // Request Signature
                setStatusMsg('Signing...');
                const apiResponse = await fetch(SIGN_API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params)
                });

                if (!apiResponse.ok) {
                    throw new Error(`Sign API Error: ${apiResponse.statusText}`);
                }

                const { signature, error: apiErr } = await apiResponse.json();
                if (apiErr) throw new Error(`API Error: ${apiErr}`);
                
                // Submit Transaction
                setStatusMsg('Confirm in Wallet...');
                const walletClient = createWalletClient({
                    chain: base,
                    transport: custom(sdk.wallet.ethProvider)
                });

                const [address] = await walletClient.requestAddresses();

                hash = await walletClient.writeContract({
                    address: REWARD_CONTRACT_ADDRESS as `0x${string}`,
                    abi: CLAIM_ABI,
                    functionName: 'claimReward',
                    args: [
                        BigInt(params.fid),
                        BigInt(params.questPid),
                        BigInt(params.questId),
                        BigInt(params.questReward),
                        BigInt(params.reward),
                        BigInt(params.totalReward),
                        signature
                    ],
                    account: address,
                    chain: base
                });
                
                console.log("Claim Tx:", hash);
                setTxHash(hash);
                setStatusMsg('Success!');
            }
        }
        
        // Switch to Success View
        setClaimSuccess(true);
        playConfirm();

      } catch (e: any) {
        console.error("Claim Error:", e);
        // Even if on-chain fails, DB is updated, so we show error but allow close
        setErrorMsg(e.message || "エラーが発生しました");
        // If DB save succeeded but chain failed, user still "claimed" locally.
        // But for now let's just show error on the result screen so they can try again or close.
      } finally {
        setIsPreparingClaim(false);
        setStatusMsg('');
      }
  };

  if (claimSuccess) {
      return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="text-6xl mb-6 animate-bounce drop-shadow-lg">💎</div>
                      <h2 className="text-2xl font-black text-white mb-2 font-orbitron tracking-wider drop-shadow-md">GET REWARD</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Mission Accomplished</p>
                      
                      <div className="text-4xl font-black text-amber-400 mb-8 drop-shadow-md bg-slate-800/50 py-4 px-6 rounded-2xl border border-amber-500/20 w-full">
                          +{totalTokens.toLocaleString()} <span className="text-lg text-amber-500">$CHH</span>
                      </div>
                      
                      {txHash && (
                          <a 
                            href={`https://basescan.org/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 mb-8 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-900/20 py-2 px-4 rounded-full border border-indigo-500/30"
                          >
                              <span>🔗</span> View Transaction on BaseScan
                          </a>
                      )}

                      <button 
                          onClick={() => { playClick(); onClose(); }}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95 border-b-4 border-emerald-800"
                      >
                          確認 (CLOSE)
                      </button>
                  </div>
              </div>
              <style>{`
                @keyframes fade-in {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              `}</style>
          </div>
      );
  }

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
                <p className="text-red-400 text-xs font-bold mb-1">CLAIM ERROR (Progress Saved)</p>
                <p className="text-red-300 text-[10px] font-mono whitespace-pre-wrap">{errorMsg}</p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
             {/* Cancel Button */}
             <button 
                onClick={() => { playClick(); onClose(); }}
                disabled={isPreparingClaim}
                className="flex-1 min-w-[100px] py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 rounded-xl font-bold transition-all active:scale-95"
             >
                閉じる
             </button>

             {/* Claim Button */}
             <button 
                onClick={handleConfirmClaim}
                disabled={isPreparingClaim}
                className="flex-[2] py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg border-b-4 border-emerald-900 flex items-center justify-center gap-2"
             >
                {isPreparingClaim ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                    <span>{statusMsg}</span>
                  </span>
                ) : (
                  <span>報酬を受け取る</span>
                )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
