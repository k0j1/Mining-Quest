
import React, { useState, useEffect, useRef } from 'react';
import { playClick } from '../utils/sound';
import gsap from 'gsap';

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
  
  // Refs for animation
  const tokenRef = useRef<HTMLSpanElement>(null);
  const previousTokenValue = useRef<number>(tokens);
  
  // Farcasterユーザーかつオンチェーン残高が取得できている場合はそちらを表示
  // そうでない場合はゲーム内トークンを表示
  const currentTokenValue = (farcasterUser && onChainBalance !== null && onChainBalance !== undefined) 
    ? onChainBalance 
    : tokens;

  // GSAP Token Counting Animation
  useEffect(() => {
    if (!tokenRef.current) return;
    
    // Create a proxy object to animate
    const proxy = { value: previousTokenValue.current };
    
    gsap.to(proxy, {
      value: currentTokenValue,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (tokenRef.current) {
          // Format based on magnitude
          tokenRef.current.innerText = formatCompactNumber(Math.floor(proxy.value));
        }
      },
      onComplete: () => {
        previousTokenValue.current = currentTokenValue;
      }
    });
    
    // Scale bump effect when tokens change significantly
    if (Math.abs(currentTokenValue - previousTokenValue.current) > 0) {
       gsap.fromTo(tokenRef.current, 
         { scale: 1.5, color: '#fff' }, 
         { scale: 1, color: farcasterUser ? '#818cf8' : '#fbbf24', duration: 0.3, ease: "back.out(1.7)" }
       );
    }

  }, [currentTokenValue, farcasterUser]);

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

  const handleReload = () => {
    playClick();
    window.location.reload();
  };

  const displayTokens = formatCompactNumber(currentTokenValue);

  // Farcasterユーザーの場合はテーマカラーを変える
  const themeColorClass = farcasterUser ? 'text-indigo-400' : 'text-amber-400';

  return (
    <div className="sticky top-0 z-[60] bg-slate-900 border-b border-slate-700 shadow-sm">
      <div className="px-5 py-4 flex justify-between items-center h-16">
        <div className="flex flex-col">
          <h1 className={`text-sm font-bold tracking-wider uppercase ${themeColorClass}`}>
            {title}
          </h1>
          <div className={`h-1 w-8 rounded-full mt-1.5 ${farcasterUser ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReload}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 text-slate-300 transition-all active:scale-95"
            title="再読み込み"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          <button 
            onClick={onToggleSound}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 text-slate-300 transition-all active:scale-95"
          >
            {isSoundOn ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
               </svg>
            )}
          </button>
          
          <div 
            onClick={handleTokenClick}
            className={`flex items-center gap-2.5 px-4 h-11 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 ${
              farcasterUser 
                ? 'bg-slate-800 border-indigo-500/50' 
                : 'bg-slate-800 border-amber-500/50'
            }`}
          >
            {farcasterUser?.pfpUrl ? (
              <img 
                src={farcasterUser.pfpUrl} 
                alt="User" 
                className="w-7 h-7 rounded-full border border-slate-600 object-cover" 
              />
            ) : (
              <span className="text-amber-400 text-sm">🪙</span>
            )}
            
            <div className="flex items-center gap-1.5">
              <span 
                ref={tokenRef} 
                className={`text-sm font-black tabular-nums ${themeColorClass}`}
              >
                {/* Initial Render fallback */}
                {displayTokens}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${farcasterUser ? 'text-indigo-400' : 'text-amber-500'}`}>
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
