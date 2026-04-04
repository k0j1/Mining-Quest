import React, { useState, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseAbi, formatUnits, parseUnits, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { sdk } from '@farcaster/frame-sdk';
import { playClick, playConfirm, playError } from '../utils/sound';
import { ITEM_SHOP_CONTRACT_ADDRESS, QUEST_TREASURY_CONTRACT_ADDRESS, QUEST_MANAGER_CONTRACT_ADDRESS, GACHA_PAYMENT_CONTRACT_ADDRESS, REWARD_MANAGER_CONTRACT_ADDRESS } from '../constants';
import { THEME, themeClass } from '../theme';
import TransactionResult from './TransactionResult';
import { supabase } from '../lib/supabase';

// Constants
const REWARD_CONTRACT_ADDRESS = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4" as `0x${string}`;
const REWARD_MANAGER_ADDRESS = REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`;
const CHH_TOKEN_ADDRESS = "0xb0525542E3D818460546332e76E511562dFf9B07" as `0x${string}`;

const REWARD_MANAGER_ABI = parseAbi([
  'struct UserAssets { uint256 chhBalance; uint256 heroCommon; uint256 heroUncommon; uint256 heroRare; uint256 equipCommon; uint256 equipUncommon; uint256 equipRare; uint256 itemPotion; uint256 itemElixir; uint256 itemWhetstone; }',
  'function setKoharuAddress(address _koharu) external',
  'function setTestUsers(address[] calldata _users, bool _status) external',
  'function setClaimStatus(address _user, bool _status) external',
  'function koharuAddress() view returns (address)',
  'function checkIsTestUser(address _user) view returns (bool)',
  'function getClaimStatus(address _user) view returns (bool)',
  'function previewClaimAmount(address _user) view returns (UserAssets)'
]);

const TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) external returns (bool)'
]);

const TREASURY_ABI = parseAbi([
  'function withdraw(address token, address to, uint256 amount) external',
  'function withdrawAll(address token, address to) external'
]);

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: bigint;
  type: 'IN' | 'OUT' | 'EVENT';
  eventName?: string;
  timestamp?: string;
  fromUser?: { username: string, display_name: string, pfp_url?: string };
  toUser?: { username: string, display_name: string, pfp_url?: string };
}

const AdminContractPanel: React.FC = () => {
  const [contractBalance, setContractBalance] = useState<string>('---');
  const [rewardManagerBalance, setRewardManagerBalance] = useState<string>('---');
  const [treasuryBalance, setTreasuryBalance] = useState<string>('---');
  const [userBalance, setUserBalance] = useState<string>('---');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState<{ hash: string, type: 'deposit' | 'withdraw' } | null>(null);

  // History states
  const [questTreasuryHistory, setQuestTreasuryHistory] = useState<Transaction[]>([]);
  const [rewardPoolHistory, setRewardPoolHistory] = useState<Transaction[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const [koharuAddress, setKoharuAddress] = useState('');
  const [testUsers, setTestUsers] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [targetUserStatus, setTargetUserStatus] = useState<any>(null);
  const [targetUserPreview, setTargetUserPreview] = useState<any>(null);

  const executeRewardManagerAction = async (functionName: 'setKoharuAddress' | 'setTestUsers' | 'checkStatus' | 'setClaimStatus' | 'previewClaimAmount', args: any[]) => {
    setIsLoading(true);
    setStatusMsg(`Executing ${functionName}...`);
    try {
      if (!sdk.wallet.ethProvider) throw new Error('Wallet not connected');
      const walletClient = createWalletClient({ chain: base, transport: custom(sdk.wallet.ethProvider) });
      const [account] = await walletClient.requestAddresses();
      
      if (functionName === 'checkStatus') {
        const [isTest, isClaimed] = await Promise.all([
            publicClient.readContract({
                address: REWARD_MANAGER_ADDRESS,
                abi: REWARD_MANAGER_ABI,
                functionName: 'checkIsTestUser',
                args: [args[0] as `0x${string}`]
            }),
            publicClient.readContract({
                address: REWARD_MANAGER_ADDRESS,
                abi: REWARD_MANAGER_ABI,
                functionName: 'getClaimStatus',
                args: [args[0] as `0x${string}`]
            })
        ]);
        setTargetUserStatus({ isTest, isClaimed });
        setStatusMsg(`Fetched status for ${args[0]}`);
      } else if (functionName === 'previewClaimAmount') {
        const preview = await publicClient.readContract({
            address: REWARD_MANAGER_ADDRESS,
            abi: REWARD_MANAGER_ABI,
            functionName: 'previewClaimAmount',
            args: [args[0] as `0x${string}`]
        });
        setTargetUserPreview(preview);
        setStatusMsg(`Fetched preview for ${args[0]}`);
      } else if (functionName === 'setKoharuAddress') {
        const hash = await walletClient.writeContract({
          account,
          address: REWARD_MANAGER_ADDRESS,
          abi: REWARD_MANAGER_ABI,
          functionName,
          args: [args[0] as `0x${string}`]
        });
        setStatusMsg(`Transaction sent: ${hash}`);
      } else if (functionName === 'setTestUsers') {
        const hash = await walletClient.writeContract({
          account,
          address: REWARD_MANAGER_ADDRESS,
          abi: REWARD_MANAGER_ABI,
          functionName,
          args: [args[0] as `0x${string}`[], args[1] as boolean]
        });
        setStatusMsg(`Transaction sent: ${hash}`);
      } else if (functionName === 'setClaimStatus') {
        const hash = await walletClient.writeContract({
          account,
          address: REWARD_MANAGER_ADDRESS,
          abi: REWARD_MANAGER_ABI,
          functionName,
          args: [args[0] as `0x${string}`, args[1] as boolean]
        });
        setStatusMsg(`Transaction sent: ${hash}`);
      }
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    playConfirm();
  };

  const fetchHistory = async (contractAddress: string) => {
    if (!contractAddress) return [];
    try {
      const alchemyUrl = 'https://base-mainnet.g.alchemy.com/v2/Av3SeC2d2fsTlvEdsT9RI';
      
      const fetchTransfers = async (isTo: boolean) => {
        const response = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getAssetTransfers',
            params: [
              {
                fromBlock: '0x0',
                toBlock: 'latest',
                [isTo ? 'toAddress' : 'fromAddress']: contractAddress,
                category: ['external', 'erc20'],
                withMetadata: true,
                excludeZeroValue: true,
                maxCount: '0x14', // 20
                order: 'desc'
              }
            ]
          })
        });
        const data = await response.json();
        return data.result?.transfers || [];
      };

      const [toTransfers, fromTransfers] = await Promise.all([
        fetchTransfers(true),
        fetchTransfers(false)
      ]);

      const allTransfers = [...toTransfers, ...fromTransfers];
      
      // ユーザー情報を取得
      const addresses = Array.from(new Set(allTransfers.map((tx: any) => [tx.from, tx.to]).flat()));
      const { data: users } = await supabase
          .from('farcaster_users')
          .select('address, username, display_name, pfp_url')
          .in('address', addresses);

      const userMap = new Map();
      if (users) {
          users.forEach((u: any) => userMap.set(u.address.toLowerCase(), u));
      }
      
      const transactions: Transaction[] = allTransfers.map((tx: any) => {
        const isIncoming = tx.to?.toLowerCase() === contractAddress.toLowerCase();
        const isCHH = tx.rawContract?.address?.toLowerCase() === CHH_TOKEN_ADDRESS.toLowerCase();
        
        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '0x0000000000000000000000000000000000000000',
          value: tx.value ? tx.value.toString() : '0',
          blockNumber: BigInt(parseInt(tx.blockNum, 16)),
          type: isIncoming ? 'IN' : 'OUT',
          eventName: !isCHH && tx.category === 'external' ? 'External Transfer' : (isCHH ? 'CHH Transfer' : 'Contract Interaction'),
          timestamp: tx.metadata?.blockTimestamp,
          fromUser: userMap.get(tx.from.toLowerCase()),
          toUser: userMap.get(tx.to.toLowerCase())
        };
      });

      // Remove duplicates and sort
      const txMap = new Map<string, Transaction>();
      transactions.forEach(tx => {
        if (!txMap.has(tx.hash)) {
          txMap.set(tx.hash, tx);
        }
      });
      
      return Array.from(txMap.values())
        .sort((a, b) => Number(b.blockNumber - a.blockNumber))
        .slice(0, 10);
    } catch (error) {
      console.error(`Error fetching history for ${contractAddress}:`, error);
      return [];
    }
  };

  const fetchAllHistory = async () => {
    setIsFetchingHistory(true);
    const [treasury, reward] = await Promise.all([
      fetchHistory(QUEST_TREASURY_CONTRACT_ADDRESS),
      fetchHistory(REWARD_CONTRACT_ADDRESS)
    ]);
    setQuestTreasuryHistory(treasury);
    setRewardPoolHistory(reward);
    setIsFetchingHistory(false);
  };

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      // 1. Reward Contract Balance
      const cBal = await publicClient.readContract({
        address: CHH_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [REWARD_CONTRACT_ADDRESS]
      } as any);
      setContractBalance(formatUnits(cBal as bigint, 18));

      // 1b. Reward Manager Balance
      const rmBal = await publicClient.readContract({
        address: CHH_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [REWARD_MANAGER_ADDRESS]
      } as any);
      setRewardManagerBalance(formatUnits(rmBal as bigint, 18));

      // 2. Treasury Contract Balance
      if (QUEST_TREASURY_CONTRACT_ADDRESS) {
        const tBal = await publicClient.readContract({
          address: CHH_TOKEN_ADDRESS,
          abi: TOKEN_ABI,
          functionName: 'balanceOf',
          args: [QUEST_TREASURY_CONTRACT_ADDRESS as `0x${string}`]
        } as any);
        setTreasuryBalance(formatUnits(tBal as bigint, 18));
      }

      // 3. User Balance (Try to fetch if wallet connected)
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
                } as any);
                setUserBalance(formatUnits(uBal as bigint, 18));
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
    fetchAllHistory();
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
      setResult({ hash, type: 'deposit' });
      
      // Wait a bit before refreshing balance
      setTimeout(() => {
        fetchBalances();
        fetchAllHistory();
        setStatusMsg('');
      }, 5000);

    } catch (e: any) {
      console.error(e);
      playError();
      setStatusMsg(`Error: ${e.shortMessage || e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepositToRewardManager = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      playError();
      alert("Invalid amount");
      return;
    }

    if (!confirm(`あなたのウォレットから ${depositAmount} CHH をRewardManagerへ送金しますか？`)) return;

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
        args: [REWARD_MANAGER_ADDRESS, amountWei],
        account: address,
        chain: base
      });

      console.log("Deposit Hash:", hash);
      playConfirm();
      setStatusMsg('Success! Updating balance...');
      setDepositAmount('');
      setResult({ hash, type: 'deposit' });
      
      // Wait a bit before refreshing balance
      setTimeout(() => {
        fetchBalances();
        setStatusMsg('');
      }, 5000);

    } catch (e: any) {
      console.error(e);
      playError();
      setStatusMsg(`Error: ${e.shortMessage || e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      playError();
      alert("Invalid amount");
      return;
    }

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
      if (!address) throw new Error("Could not get wallet address");

      if (!confirm(`トレジャリーから ${withdrawAmount} CHH をあなたのウォレット (${address}) へ引き出しますか？`)) {
        setIsLoading(false);
        setStatusMsg('');
        return;
      }
      
      setStatusMsg('Sending Transaction...');

      const amountWei = parseUnits(withdrawAmount, 18);

      const hash = await walletClient.writeContract({
        address: QUEST_TREASURY_CONTRACT_ADDRESS as `0x${string}`,
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [CHH_TOKEN_ADDRESS, address, amountWei],
        account: address,
        chain: base
      });

      console.log("Withdraw Hash:", hash);
      playConfirm();
      setStatusMsg('Success! Updating balance...');
      setWithdrawAmount('');
      setResult({ hash, type: 'withdraw' });
      
      setTimeout(() => {
        fetchBalances();
        fetchAllHistory();
        setStatusMsg('');
      }, 5000);

    } catch (e: any) {
      console.error(e);
      playError();
      setStatusMsg(`Error: ${e.shortMessage || e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    playClick();
    alert("Copied!");
  };

  const HistoryTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const formatJST = (timestamp?: string) => {
      if (!timestamp) return '---';
      try {
        return new Date(timestamp).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        return timestamp;
      }
    };

    if (isFetchingHistory) {
      return <div className="text-center py-4 text-slate-500 text-xs animate-pulse">Fetching history...</div>;
    }
    if (transactions.length === 0) {
      return <div className="text-center py-4 text-slate-600 text-xs italic">No recent transactions found.</div>;
    }
    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Transactions</h4>
        <div className="space-y-1">
          {transactions.map((tx) => (
            <div key={tx.hash} className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50 text-[10px]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[8px] ${
                    tx.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 
                    tx.type === 'OUT' ? 'bg-rose-500/20 text-rose-400' : 
                    'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {tx.type}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    {tx.fromUser ? (
                      <div className="flex items-center gap-1">
                        <img src={tx.fromUser.pfp_url || ''} className="w-3 h-3 rounded-full" />
                        <span className="text-slate-300">{tx.fromUser.display_name || tx.fromUser.username}</span>
                      </div>
                    ) : (
                      <span>From: {tx.from.slice(0, 6)}...</span>
                    )}
                    <span>→</span>
                    {tx.toUser ? (
                      <div className="flex items-center gap-1">
                        <img src={tx.toUser.pfp_url || ''} className="w-3 h-3 rounded-full" />
                        <span className="text-slate-300">{tx.toUser.display_name || tx.toUser.username}</span>
                      </div>
                    ) : (
                      <span>To: {tx.to.slice(0, 6)}...</span>
                    )}
                  </div>
                </div>
                <a 
                  href={`https://basescan.org/tx/${tx.hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-indigo-400 transition-colors font-mono"
                >
                  {tx.hash.slice(0, 14)}...
                </a>
                {tx.timestamp && (
                  <div className="text-slate-600 text-[8px] mt-0.5">
                    {formatJST(tx.timestamp)}
                  </div>
                )}
              </div>
              <div className="text-right">
                {tx.type !== 'EVENT' && (
                  <div className={`font-bold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{Number(tx.value).toLocaleString()} CHH
                  </div>
                )}
                <div className="text-slate-600 text-[8px]">Block: {tx.blockNumber.toString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-200">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {result && (
          <TransactionResult 
            hash={result.hash} 
            type={result.type} 
            onClose={() => setResult(null)} 
          />
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white tracking-tighter">ADMIN CONTRACTS</h2>
          <button 
            onClick={() => { playClick(); fetchBalances(); fetchAllHistory(); }}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>🔄</span> Refresh All
          </button>
        </div>
        
        {/* Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            報酬コントラクト情報
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">コントラクトアドレス</label>
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
                 <label className="text-[10px] text-slate-500 font-bold block mb-1">プール残高 ($CHH)</label>
                 <div className="text-3xl font-black text-white font-mono tracking-tight">
                    {Number(contractBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-sm text-amber-500 ml-2 font-bold">CHH</span>
                 </div>
               </div>
               <button 
                 onClick={() => { playClick(); fetchBalances(); }}
                 className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                 title="残高を更新"
               >
                 🔄
               </button>
            </div>
            <HistoryTable transactions={rewardPoolHistory} />
          </div>
        </div>

        {/* Item Shop Contract Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            アイテムショップコントラクト情報
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">コントラクトアドレス</label>
              <div 
                onClick={() => copyToClipboard(ITEM_SHOP_CONTRACT_ADDRESS)}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group"
              >
                <code className="text-xs font-mono text-indigo-300 break-all">{ITEM_SHOP_CONTRACT_ADDRESS}</code>
                <span className="text-slate-600 group-hover:text-white text-xs">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gacha Payment Contract Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            ガチャ支払いコントラクト情報
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">コントラクトアドレス</label>
              <div 
                onClick={() => copyToClipboard(GACHA_PAYMENT_CONTRACT_ADDRESS)}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group"
              >
                <code className="text-xs font-mono text-indigo-300 break-all">{GACHA_PAYMENT_CONTRACT_ADDRESS}</code>
                <span className="text-slate-600 group-hover:text-white text-xs">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quest Manager Contract Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            クエストマネージャー情報
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">コントラクトアドレス</label>
              <div 
                onClick={() => copyToClipboard(QUEST_MANAGER_CONTRACT_ADDRESS)}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group"
              >
                <code className="text-xs font-mono text-indigo-300 break-all">{QUEST_MANAGER_CONTRACT_ADDRESS}</code>
                <span className="text-slate-600 group-hover:text-white text-xs">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quest Treasury Contract Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            クエストトレジャリー情報
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">コントラクトアドレス</label>
              <div 
                onClick={() => copyToClipboard(QUEST_TREASURY_CONTRACT_ADDRESS)}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group"
              >
                <code className="text-xs font-mono text-indigo-300 break-all">{QUEST_TREASURY_CONTRACT_ADDRESS}</code>
                <span className="text-slate-600 group-hover:text-white text-xs">📋</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
               <div>
                 <label className="text-[10px] text-slate-500 font-bold block mb-1">トレジャリー残高 ($CHH)</label>
                 <div className="text-3xl font-black text-white font-mono tracking-tight">
                    {Number(treasuryBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-sm text-amber-500 ml-2 font-bold">CHH</span>
                 </div>
               </div>
               <button 
                 onClick={() => { playClick(); fetchBalances(); }}
                 className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                 title="残高を更新"
               >
                 🔄
               </button>
            </div>
            <HistoryTable transactions={questTreasuryHistory} />
          </div>
        </div>

        {/* Action Card: Deposit */}
        <div className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>📥</span> 入金アクション (報酬プールへ)
          </h3>

          <div className="bg-emerald-950/10 p-4 rounded-xl border border-emerald-500/20 mb-4">
             <p className="text-[10px] text-emerald-200/70 mb-4">
               あなたのウォレットから報酬プールへ $CHH を補充します。<br/>
               <span className="text-slate-400">あなたの残高: {Number(userBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} CHH</span>
             </p>
             
             <div className="flex gap-2 mb-2">
               <div className="relative flex-1">
                 <input 
                   type="number" 
                   value={depositAmount}
                   onChange={(e) => setDepositAmount(e.target.value)}
                   placeholder="入金する額"
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
                   {statusMsg || '処理中...'}
                 </>
               ) : (
                 <>
                   <span>💸</span> CHHを入金
                 </>
               )}
             </button>
          </div>
        </div>

        {/* Action Card: Withdraw */}
        <div className="bg-slate-900 border border-rose-900/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>📤</span> 出金アクション (トレジャリーから)
          </h3>

          <div className="bg-rose-950/10 p-4 rounded-xl border border-rose-500/20 mb-4">
             <p className="text-[10px] text-rose-200/70 mb-4">
               トレジャリーから接続中のウォレットへ $CHH を引き出します。<br/>
               <span className="text-slate-400">トレジャリー残高: {Number(treasuryBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} CHH</span>
             </p>
             
             <div className="space-y-3 mb-4">
               <div>
                 <label className="text-[10px] text-slate-500 font-bold block mb-1">出金額</label>
                 <div className="relative">
                   <input 
                     type="number" 
                     value={withdrawAmount}
                     onChange={(e) => setWithdrawAmount(e.target.value)}
                     placeholder="出金する額"
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-rose-500 outline-none"
                   />
                   <button 
                      onClick={() => setWithdrawAmount(treasuryBalance !== '---' ? treasuryBalance : '0')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-800 text-rose-500 px-2 py-1 rounded hover:bg-slate-700"
                   >
                      MAX
                   </button>
                 </div>
               </div>
             </div>

             <button 
               onClick={handleWithdraw}
               disabled={isLoading}
               className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                 isLoading ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
               }`}
             >
               {isLoading ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   {statusMsg || '処理中...'}
                 </>
               ) : (
                 <>
                   <span>💰</span> CHHを引き出す
                 </>
               )}
             </button>
             {statusMsg && !isLoading && <p className="text-center text-xs text-rose-400 mt-2">{statusMsg}</p>}
          </div>
        </div>

        {/* Action Card: Reward Manager */}
        <div className="bg-slate-900 border border-purple-900/30 rounded-2xl p-6 shadow-lg col-span-full">
          <h3 className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>🎁</span> Reward Manager ({REWARD_MANAGER_ADDRESS})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-purple-950/10 p-4 rounded-xl border border-purple-500/20">
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Reward Manager Balance</label>
              <div className="text-lg font-black text-white font-mono tracking-tight mb-2">
                {Number(rewardManagerBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-[10px] text-amber-500 ml-1 font-bold">CHH</span>
              </div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Deposit CHH</label>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" placeholder="Amount" />
              <button onClick={handleDepositToRewardManager} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs">Deposit</button>
            </div>
            <div className="bg-purple-950/10 p-4 rounded-xl border border-purple-500/20">
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Set Koharu Address</label>
              <input type="text" value={koharuAddress} onChange={(e) => setKoharuAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" placeholder="0x..." />
              <button onClick={() => executeRewardManagerAction('setKoharuAddress', [koharuAddress])} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs">Set</button>
            </div>
            <div className="bg-purple-950/10 p-4 rounded-xl border border-purple-500/20">
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Manage Test Users (comma separated)</label>
              <input type="text" value={testUsers} onChange={(e) => setTestUsers(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" placeholder="0x..., 0x..." />
              <div className="flex gap-2">
                <button onClick={() => executeRewardManagerAction('setTestUsers', [testUsers.split(',').map(u => u.trim()), true])} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs">Add</button>
                <button onClick={() => executeRewardManagerAction('setTestUsers', [testUsers.split(',').map(u => u.trim()), false])} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs">Remove</button>
              </div>
            </div>
            <div className="bg-purple-950/10 p-4 rounded-xl border border-purple-500/20">
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Manage Claim Status</label>
              <input type="text" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" placeholder="0x..." />
              <div className="flex gap-2">
                <button onClick={() => executeRewardManagerAction('setClaimStatus', [targetUser, true])} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs">Set Claimed</button>
                <button onClick={() => executeRewardManagerAction('setClaimStatus', [targetUser, false])} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs">Unset Claimed</button>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-purple-950/10 p-4 rounded-xl border border-purple-500/20">
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Check User Status & Preview</label>
              <input type="text" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" placeholder="0x..." />
              <div className="flex gap-2">
                <button onClick={() => executeRewardManagerAction('checkStatus', [targetUser])} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs">Status</button>
                <button onClick={() => executeRewardManagerAction('previewClaimAmount', [targetUser])} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs">Preview</button>
              </div>
          </div>
          {targetUserStatus && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl text-[10px] text-slate-300 font-mono">
              <p>Is Test User: {targetUserStatus.isTest ? 'Yes' : 'No'}</p>
              <p>Has Claimed: {targetUserStatus.isClaimed ? 'Yes' : 'No'}</p>
            </div>
          )}
          {targetUserPreview && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/50 shadow-lg z-20 relative">
              <h3 className="text-white font-bold text-sm mb-2">Claim Your Rewards Preview</h3>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-indigo-200">
                <div className="bg-slate-800/50 p-2 rounded">
                  <span className="block text-slate-400 mb-1">CHH Balance</span>
                  <span className="font-bold text-white text-lg">{Math.round(Number(targetUserPreview.chhBalance || targetUserPreview[0] || 0) / 10**18)} <span className="text-xs text-indigo-300">CHH</span></span>
                </div>

                {(Number(targetUserPreview.heroCommon || targetUserPreview[1] || 0) > 0 || Number(targetUserPreview.heroUncommon || targetUserPreview[2] || 0) > 0 || Number(targetUserPreview.heroRare || targetUserPreview[3] || 0) > 0) && (
                  <div className="bg-slate-800/50 p-2 rounded">
                    <span className="block text-slate-400 mb-1">Heroes</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: Number(targetUserPreview.heroCommon || targetUserPreview[1] || 0) }).map((_, i) => (
                        <div key={`hc-${i}`} className="w-8 h-10 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-slate-300 text-[10px]">C</span>
                        </div>
                      ))}
                      {Array.from({ length: Number(targetUserPreview.heroUncommon || targetUserPreview[2] || 0) }).map((_, i) => (
                        <div key={`huc-${i}`} className="w-8 h-10 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                        </div>
                      ))}
                      {Array.from({ length: Number(targetUserPreview.heroRare || targetUserPreview[3] || 0) }).map((_, i) => (
                        <div key={`hr-${i}`} className="w-8 h-10 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-blue-400 text-[10px]">R</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(Number(targetUserPreview.equipCommon || targetUserPreview[4] || 0) > 0 || Number(targetUserPreview.equipUncommon || targetUserPreview[5] || 0) > 0 || Number(targetUserPreview.equipRare || targetUserPreview[6] || 0) > 0) && (
                  <div className="bg-slate-800/50 p-2 rounded">
                    <span className="block text-slate-400 mb-1">Equipment</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: Number(targetUserPreview.equipCommon || targetUserPreview[4] || 0) }).map((_, i) => (
                        <div key={`ec-${i}`} className="w-8 h-8 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-slate-300 text-[10px]">C</span>
                        </div>
                      ))}
                      {Array.from({ length: Number(targetUserPreview.equipUncommon || targetUserPreview[5] || 0) }).map((_, i) => (
                        <div key={`euc-${i}`} className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                        </div>
                      ))}
                      {Array.from({ length: Number(targetUserPreview.equipRare || targetUserPreview[6] || 0) }).map((_, i) => (
                        <div key={`er-${i}`} className="w-8 h-8 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-blue-400 text-[10px]">R</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(Number(targetUserPreview.itemPotion || targetUserPreview[7] || 0) > 0 || Number(targetUserPreview.itemElixir || targetUserPreview[8] || 0) > 0 || Number(targetUserPreview.itemWhetstone || targetUserPreview[9] || 0) > 0) && (
                  <div className="bg-slate-800/50 p-2 rounded">
                    <span className="block text-slate-400 mb-1">Items</span>
                    <div className="flex flex-col gap-1">
                      {Number(targetUserPreview.itemPotion || targetUserPreview[7] || 0) > 0 && (
                        <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                          <span className="text-slate-300 text-[10px]">Potion</span>
                          <span className="font-bold text-white text-xs">x{Number(targetUserPreview.itemPotion || targetUserPreview[7] || 0)}</span>
                        </div>
                      )}
                      {Number(targetUserPreview.itemElixir || targetUserPreview[8] || 0) > 0 && (
                        <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                          <span className="text-slate-300 text-[10px]">Elixir</span>
                          <span className="font-bold text-white text-xs">x{Number(targetUserPreview.itemElixir || targetUserPreview[8] || 0)}</span>
                        </div>
                      )}
                      {Number(targetUserPreview.itemWhetstone || targetUserPreview[9] || 0) > 0 && (
                        <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                          <span className="text-slate-300 text-[10px]">Whetstone</span>
                          <span className="font-bold text-white text-xs">x{Number(targetUserPreview.itemWhetstone || targetUserPreview[9] || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 text-xs text-slate-400 font-bold">{statusMsg}</div>
        </div>

      </div>
    </div>
  );
};

export default AdminContractPanel;