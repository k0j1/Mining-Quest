
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  tokens: number;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
  children?: React.ReactNode;
}

const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

const Header: React.FC<HeaderProps> = ({ 
  title, 
  tokens, 
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens, 
  farcasterUser, 
  onChainBalance, 
  onAccountClick,
  children 
}) => {
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTapCount(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleTokenClick = () => {
    // Farcaster接続時はアカウントモーダルを開く
    if (farcasterUser && onAccountClick) {
      onAccountClick();
      return;
    }
    
    // 未接続時はデバッグ用タップカウント
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

  // 表示する数値の決定
  const displayTokens = farcasterUser 
    ? (onChainBalance !== null ? formatCompactNumber(onChainBalance) : '...')
    : formatCompactNumber(tokens);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md flex-none shadow-lg pt-[env(safe-area-inset-top)]">
      <div className="px-4 py-3 flex justify-between items-center h-14">
        <h1 className="text-lg font-orbitron font-bold text-indigo-300 tracking-wide truncate mr-2">
          {title}
        </h1>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* サウンド設定ボタン */}
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
          
          {/* トークン/アカウント表示エリア */}
          <div 
            onClick={handleTokenClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border active:scale-95 transition-all cursor-pointer h-9 flex-shrink-0 ${
              farcasterUser 
                ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.2)]' 
                : 'bg-slate-800/80 border-slate-700 shadow-inner'
            }`}
          >
            {farcasterUser && farcasterUser.pfpUrl ? (
              <div className="relative">
                <img 
                  src={farcasterUser.pfpUrl} 
                  alt="User" 
                  className="w-5 h-5 rounded-full border border-indigo-400 shadow-sm object-cover" 
                />
                <div className="absolute -inset-1 bg-indigo-500/20 blur-sm rounded-full -z-10 animate-pulse"></div>
              </div>
            ) : (
              <span className="text-yellow-500 text-sm drop-shadow-sm">🪙</span>
            )}
            
            <div className="flex items-baseline gap-1">
              <span className={`font-orbitron text-sm font-bold leading-none ${
                farcasterUser ? 'text-indigo-200' : 'text-yellow-500'
              }`}>
                {displayTokens}
              </span>
              <span className={`text-[8px] font-black leading-none ${
                farcasterUser ? 'text-indigo-400' : 'text-yellow-600'
              }`}>
                $CHH
              </span>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Header;
