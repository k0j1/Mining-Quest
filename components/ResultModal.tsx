
import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { playFanfare, playClick } from '../utils/sound';
import gsap from 'gsap';
import { MINING_QUEST_REWARD_SOL } from '../utils/contractTemplate';
import { supabase } from '../lib/supabase';
import { createWalletClient, custom, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { sdk } from '@farcaster/frame-sdk';

// Contract Address
const REWARD_CONTRACT_ADDRESS = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

// API Endpoint
const SIGN_API_ENDPOINT = "/api/sign_claim.php"; 

const CLAIM_ABI = parseAbi([
  'function claimReward(uint256 fid, uint256 questPid, uint256 questId, uint256 questReward, uint256 reward, uint256 totalReward, bytes signature) external'
]);

interface QuestResult {
  questName: string;
  rank: string;
  questMasterId?: number; 
  questId?: string; // unique ID (pid)
  totalReward: number;
  baseReward: number;
  bonusReward: number;
  heroBonus: number;
  equipmentBonus: number;
  logs: string[];
}

interface ResultModalProps {
  results: QuestResult[];
  totalTokens: number;
  onClose: () => void;
  farcasterUser?: any; // Added to get FID
}

const ResultModal: React.FC<ResultModalProps> = ({ results, totalTokens, onClose, farcasterUser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const totalRef = useRef<HTMLDivElement>(null);
  const [isPreparingClaim, setIsPreparingClaim] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

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

  const handleOnChainClaim = async () => {
    if (!farcasterUser?.fid) {
      alert("Farcaster user not found. Cannot claim on-chain.");
      return;
    }
    
    playClick();
    setIsPreparingClaim(true);
    setStatusMsg('Initializing...');

    try {
      // 1. Check if we have a valid provider
      if (!sdk.wallet.ethProvider) {
        throw new Error("No wallet provider found. Are you using a compatible Farcaster client?");
      }

      // 2. Find valid result to claim (Currently claims one quest at a time)
      const targetResult = results.find(r => r.totalReward > 0 && r.questId && r.questMasterId);
      if (!targetResult) {
        alert("No claimable reward found in this result set.");
        setIsPreparingClaim(false);
        return;
      }

      // 3. Fetch User Total Reward Stats (Required for Contract Validation)
      setStatusMsg('Fetching stats...');
      const { data: stats, error } = await supabase
        .from('quest_player_stats')
        .select('total_reward')
        .eq('fid', farcasterUser.fid)
        .single();

      if (error || !stats) {
        throw new Error("Failed to fetch player stats for claim verification.");
      }

      // Calculate parameters based on user request
      const claimAmount = targetResult.totalReward;
      
      // FIX: totalReward sent to contract should be the value STORED in DB (which acts as the cap).
      // Since `returnFromQuest` already updated the DB with the new reward, `stats.total_reward` includes `claimAmount`.
      // Therefore, we pass `stats.total_reward` as is.
      const totalRewardForContract = stats.total_reward || 0;

      const params = {
        fid: farcasterUser.fid,
        questPid: parseInt(targetResult.questId || "0"),
        questId: targetResult.questMasterId || 0,
        questReward: targetResult.baseReward, // Use baseReward for contract range check
        reward: claimAmount,                  // Actual payout amount
        totalReward: totalRewardForContract   // Cumulative limit check
      };

      // 4. Request Signature from Backend
      setStatusMsg('Requesting signature...');
      console.log("Requesting signature with:", params);
      
      const apiResponse = await fetch(SIGN_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!apiResponse.ok) {
         const errorText = apiResponse.statusText || `Status ${apiResponse.status}`;
         let bodyText = '';
         try { 
             bodyText = await apiResponse.text();
             // Try to parse JSON error if possible
             try {
                 const jsonError = JSON.parse(bodyText);
                 if (jsonError.error) bodyText = jsonError.error;
             } catch {}
         } catch {}
         
         throw new Error(`API Error: ${errorText}\nDetails: ${bodyText}`);
      }

      const { signature, error: apiErr } = await apiResponse.json();
      
      if (apiErr) throw new Error(`Sign API Error: ${apiErr}`);
      if (!signature) throw new Error("No signature returned from API");

      // 5. Submit Transaction using Viem
      setStatusMsg('Submitting transaction...');
      
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(sdk.wallet.ethProvider)
      });

      const [address] = await walletClient.requestAddresses();

      const hash = await walletClient.writeContract({
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

      console.log("Transaction Hash:", hash);
      alert(`Transaction Submitted!\nHash: ${hash}`);
      
      // Close modal on success to update local state
      onClose();

    } catch (e: any) {
      console.error(e);
      alert(`Claim Error: ${e.message}`);
    } finally {
      setIsPreparingClaim(false);
      setStatusMsg('');
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

          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl font-bold transition-all active:scale-95"
             >
                閉じる (DB保存)
             </button>

             {farcasterUser && totalTokens > 0 && (
                 <button 
                    onClick={handleOnChainClaim}
                    disabled={isPreparingClaim}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden"
                 >
                    {isPreparingClaim ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                        {statusMsg || 'Processing...'}
                      </span>
                    ) : (
                        <>
                           <span>⛓️</span> Claim On-Chain
                        </>
                    )}
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
