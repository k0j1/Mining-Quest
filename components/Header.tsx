
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

const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  // 10,000以上の場合は K で省略表示（表示崩れ防止のため）
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  // 10,000未満は全桁表示
  return num.toLocaleString();
};

const Header: React.FC<HeaderProps> = ({ title, tokens, isSoundOn, onToggleSound, onDebugAddTokens, children }) => {
  const [tapCount, setTapCount] = useState(0);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalanceRaw, setOnChainBalanceRaw] = useState<number | null>(null);

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
        const numericBalance = Number(balanceBigInt) / 1e18;
        setOnChainBalanceRaw(numericBalance);
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

  const displayTokens = farcasterUser 
    ? (onChainBalanceRaw !== null ? formatCompactNumber(onChainBalanceRaw) : '---')
    : formatCompactNumber(tokens);

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
          
          <div 
            onClick={handleTokenClick}
            className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 active:scale-95 transition-transform cursor-pointer h-9 flex-shrink-0"
          >
            {farcasterUser && farcasterUser.pfpUrl ? (
              <img src={farcasterUser.pfpUrl} alt="User" className="w-5 h-5 rounded-full border border-white/20" />
            ) : (
              <span className="text-yellow-500 text-sm">🪙</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="font-orbitron text-sm font-bold text-yellow-500 leading-none">{displayTokens}</span>
              <span className="text-[8px] font-black text-yellow-600 leading-none">$CHH</span>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Header;
