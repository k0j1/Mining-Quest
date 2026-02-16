import React, { useState, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseAbi, formatUnits, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { sdk } from '@farcaster/frame-sdk';
import { playClick, playConfirm, playError } from '../utils/sound';

// Constants
const REWARD_CONTRACT_ADDRESS = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4" as `0x${string}`;
const CHH_TOKEN_ADDRESS = "0xb0525542E3D818460546332e76E511562dFf9B07" as `0x${string}`;

const TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) external returns (bool)'
]);

const AdminContractPanel: React.FC = () => {
  const [contractBalance, setContractBalance] = useState<string>('---');
  const [userBalance, setUserBalance] = useState<string>('---');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      // 1. Contract Balance
      const cBal = await publicClient.readContract({
        address: CHH_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [REWARD_CONTRACT_ADDRESS]
      });
      setContractBalance(formatUnits(cBal, 18));

      // 2. User Balance (Try to fetch if wallet connected)
      try {
        if (sdk.wallet.ethProvider) {
            const walletClient = createWalletClient({
                chain: base,
                transport: custom(sdk.wallet.ethProvider)
            });
            // Don't request addresses if not already connected/interacted to avoid popup spam on load
            // But here we assume admin panel user is likely connected or will connect.
            // Let's just try requestAddresses quietly or wait for action.
            // For now, only fetch on load if we can, otherwise skip user balance until interaction.
            const [address] = await walletClient.requestAddresses();
            if (address) {
                const uBal = await publicClient.readContract({
                    address: CHH_TOKEN_ADDRESS,
                    abi: TOKEN_ABI,
                    functionName: 'balanceOf',
                    args: [address]
                });
                setUserBalance(formatUnits(uBal, 18));
            }
        }
      } catch (e) {
          console.log("User wallet not connected yet for balance check");
      }

    } catch (e: any) {
      console.error("Balance fetch error:", e);
      setContractBalance('Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      playError();
      alert("Invalid amount");
      return;
    }

    if (!confirm(`あなたのウォレットから ${depositAmount} CHH を報酬コントラクトへ送金しますか？`)) return;

    setIsLoading(true);
    setStatusMsg('Initializing Wallet...');
    playClick();

    try {
      if (!sdk.wallet.ethProvider) {
        throw new Error("No wallet provider found.");
      }

      const walletClient = createWalletClient({
        chain: base,
        transport: custom(sdk.wallet.ethProvider)
      });

      const [address] = await walletClient.requestAddresses();
      
      setStatusMsg('Sending Transaction...');

      // 18 decimals
      const amountWei = parseUnits(depositAmount, 18);

      const hash = await walletClient.writeContract({
        address: CHH_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [REWARD_CONTRACT_ADDRESS, amountWei],
        account: address,
        chain: base
      });

      console.log("Deposit Hash:", hash);
      playConfirm();
      setStatusMsg('Success! Updating balance...');
      setDepositAmount('');
      
      // Wait a bit before refreshing balance
      setTimeout(() => {
        fetchBalances();
        setStatusMsg('');
      }, 5000);

    } catch (e: any) {
      console.error(e);
      playError();
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    playClick();
    alert("Copied!");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-200">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Reward Contract Info
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">CONTRACT ADDRESS</label>
              <div 
                onClick={() => copyToClipboard(REWARD_CONTRACT_ADDRESS)}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group"
              >
                <code className="text-xs font-mono text-indigo-300 break-all">{REWARD_CONTRACT_ADDRESS}</code>
                <span className="text-slate-600 group-hover:text-white text-xs">📋</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
               <div>
                 <label className="text-[10px] text-slate-500 font-bold block mb-1">POOL BALANCE ($CHH)</label>
                 <div className="text-3xl font-black text-white font-mono tracking-tight">
                    {Number(contractBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-sm text-amber-500 ml-2 font-bold">CHH</span>
                 </div>
               </div>
               <button 
                 onClick={() => { playClick(); fetchBalances(); }}
                 className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                 title="Refresh Balance"
               >
                 🔄
               </button>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>📥</span> Deposit Actions
          </h3>

          <div className="bg-emerald-950/10 p-4 rounded-xl border border-emerald-500/20 mb-4">
             <p className="text-[10px] text-emerald-200/70 mb-4">
               あなたのウォレットから報酬プールへ $CHH を補充します。<br/>
               <span className="text-slate-400">Your Balance: {Number(userBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} CHH</span>
             </p>
             
             <div className="flex gap-2 mb-2">
               <div className="relative flex-1">
                 <input 
                   type="number" 
                   value={depositAmount}
                   onChange={(e) => setDepositAmount(e.target.value)}
                   placeholder="Amount to deposit"
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-emerald-500 outline-none"
                 />
                 <button 
                    onClick={() => setDepositAmount(userBalance !== '---' ? userBalance : '0')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-800 text-emerald-500 px-2 py-1 rounded hover:bg-slate-700"
                 >
                    MAX
                 </button>
               </div>
             </div>

             <button 
               onClick={handleDeposit}
               disabled={isLoading}
               className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                 isLoading ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
               }`}
             >
               {isLoading ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   {statusMsg || 'Processing...'}
                 </>
               ) : (
                 <>
                   <span>💸</span> Deposit CHH
                 </>
               )}
             </button>
             {statusMsg && !isLoading && <p className="text-center text-xs text-emerald-400 mt-2">{statusMsg}</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminContractPanel;