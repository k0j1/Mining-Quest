
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
    if (farcasterUser && onAccountClick) {
      onAccountClick();
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
    ? (typeof onChainBalance === 'number' ? formatCompactNumber(onChainBalance) : '...')
    : formatCompactNumber(tokens);

  // トークン表示と同じ色をタイトルにも適用
  const themeColorClass = farcasterUser ? 'text-indigo-400' : 'text-amber-400';
  const glowClass = farcasterUser ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';

  return (
    <div className="sticky top-0 z-[60] pt-[env(safe-area-inset-top)] bg-black/80 backdrop-blur-3xl border-b border-white/5">
      <div className="px-5 py-4 flex justify-between items-center h-16">
        <div className="flex flex-col">
          <h1 className={`text-sm font-orbitron font-black tracking-[0.2em] uppercase transition-colors ${themeColorClass} ${glowClass}`}>
            {title}
          </h1>
          <div className={`h-0.5 w-8 rounded-full mt-1.5 transition-colors ${farcasterUser ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'}`}></div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSound}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-slate-300 transition-all active:scale-90"
          >
            {isSoundOn ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25-2.25M19.5 12l-2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            )}
          </button>
          
          <div 
            onClick={handleTokenClick}
            className={`flex items-center gap-2.5 px-4 h-11 rounded-2xl border transition-all cursor-pointer shadow-xl ${
              farcasterUser 
                ? 'bg-indigo-600/10 border-indigo-500/40 shadow-indigo-500/5' 
                : 'bg-black border-amber-500/30'
            }`}
          >
            {farcasterUser?.pfpUrl ? (
              <img 
                src={farcasterUser.pfpUrl} 
                alt="User" 
                className="w-7 h-7 rounded-full border border-indigo-500/50 object-cover" 
              />
            ) : (
              <span className="text-amber-400 text-sm">🪙</span>
            )}
            
            <div className="flex items-center gap-1.5">
              <span className={`font-orbitron text-sm font-black transition-colors ${themeColorClass}`}>
                {displayTokens}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${farcasterUser ? 'text-indigo-600' : 'text-amber-600'}`}>
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
