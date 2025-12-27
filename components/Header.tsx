
import React, { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface HeaderProps {
  title: string;
  tokens: number;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  children?: React.ReactNode;
}

const CHH_CONTRACT_ADDRESS = '0xb0525542E3D818460546332e76E511562dFf9B07';
const BASE_RPC_URL = 'https://mainnet.base.org';

const Header: React.FC<HeaderProps> = ({ title, tokens, isSoundOn, onToggleSound, onDebugAddTokens, children }) => {
  const [tapCount, setTapCount] = useState(0);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalance, setOnChainBalance] = useState<string | null>(null);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setFarcasterUser(context.user);
          const address = (context.user as any).address || (context.user as any).custodyAddress;
          if (address) {
            fetchBalance(address);
          }
        }
      } catch (e) {
        console.error("Farcaster SDK error", e);
      }
    };
    initFarcaster();
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: CHH_CONTRACT_ADDRESS,
            data: '0x70a08231' + address.replace('0x', '').padStart(64, '0')
          }, 'latest']
        })
      });
      const result = await response.json();
      if (result.result) {
        const balanceBigInt = BigInt(result.result);
        const formatted = (Number(balanceBigInt) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 });
        setOnChainBalance(formatted);
      }
    } catch (e) {
      console.error("Balance fetch error", e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setTapCount(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleTokenClick = () => {
    // Farcaster接続時はデバッグ機能を無効化
    if (farcasterUser) {
      console.log("Farcaster connected: Debug feature disabled.");
      return;
    }
    
    if (!onDebugAddTokens) return;
    
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        onDebugAddTokens();
        return 0;
      }
      return newCount;
    });
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md flex-none shadow-lg pt-[env(safe-area-inset-top)]">
      <div className="px-4 py-3 flex justify-between items-center h-14">
        <h1 className="text-lg font-orbitron font-bold text-indigo-300 tracking-wide truncate mr-2">{title}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={onToggleSound}
            className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-600 text-slate-400 transition-all active:scale-95"
            aria-label="Toggle Sound"
          >
            {isSoundOn ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            )}
          </button>
          
          {farcasterUser ? (
            /* Farcaster接続時：アイコンとオンチェーン残高を表示（デバッグ機能は無効） */
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] select-none">
              {farcasterUser.pfpUrl && (
                <img src={farcasterUser.pfpUrl} alt="User" className="w-5 h-5 rounded-full border border-white/20" />
              )}
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] text-indigo-300 font-black uppercase tracking-tighter">On-chain</span>
                <span className="font-orbitron text-[10px] font-bold text-white">{onChainBalance || '...'} <span className="text-[8px]">$CHH</span></span>
              </div>
            </div>
          ) : (
            /* 未接続時：ゲーム内トークンを通常表示（5クリックでデバッグ機能有効） */
            <div 
              onClick={handleTokenClick}
              className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="text-yellow-500 text-sm">🪙</span>
              <div className="flex items-baseline gap-1">
                <span className="font-orbitron text-sm font-bold text-yellow-500">{tokens.toLocaleString()}</span>
                <span className="text-[8px] font-black text-yellow-600">$CHH</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default Header;
