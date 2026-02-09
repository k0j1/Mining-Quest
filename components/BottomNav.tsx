
import React, { useRef, useEffect } from 'react';
import { View } from '../types';
import { ICONS } from '../constants';
import gsap from 'gsap';

interface NavItem {
  view: View;
  label: string;
  icon: (props: any) => React.JSX.Element;
  imageUrl: string;
}

interface BottomNavProps {
  currentView: View;
  onNavClick: (view: View) => void;
}

const NAV_ITEMS: NavItem[] = [
  { view: View.HOME, label: 'HOME', icon: ICONS.HOME, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' },
  { view: View.PARTY, label: 'PARTY', icon: ICONS.PARTY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' },
  { view: View.DEPART, label: 'QUEST', icon: ICONS.DEPART, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' },
  { view: View.RETURN, label: 'RESULT', icon: ICONS.RETURN, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' },
  { view: View.GACHA, label: 'GACHA', icon: ICONS.GACHA, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' },
  { view: View.RECOVERY, label: 'RECOVERY', icon: ICONS.RECOVERY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavClick }) => {
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  // Handle active state animations
  useEffect(() => {
    if (!navRef.current || !indicatorRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Move Indicator
      const activeBtn = navRef.current?.querySelector(`button[data-view="${currentView}"]`) as HTMLElement;
      
      if (activeBtn) {
        const { offsetLeft, offsetWidth } = activeBtn;
        
        gsap.to(indicatorRef.current, {
          x: offsetLeft,
          width: offsetWidth,
          duration: 0.5,
          ease: "elastic.out(1, 0.75)",
          opacity: 1
        });
      }

      // 2. Animate Active Icon
      const activeIcon = iconRefs.current[currentView];
      if (activeIcon) {
        gsap.fromTo(activeIcon, 
          { scale: 0.5, y: 10 },
          { scale: 1.2, y: -2, duration: 0.6, ease: "elastic.out(1, 0.5)", onComplete: () => {
             gsap.to(activeIcon, { scale: 1.1, y: 0, duration: 0.2 });
          }}
        );
      }

      // 3. Reset Others
      Object.keys(iconRefs.current).forEach(key => {
        if (key !== currentView && iconRefs.current[key]) {
          gsap.to(iconRefs.current[key], { scale: 0.9, y: 0, duration: 0.3 });
        }
      });

      // 4. Animate Label
      const activeLabel = labelRefs.current[currentView];
      if (activeLabel) {
         gsap.fromTo(activeLabel,
            { y: 5, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, delay: 0.1 }
         );
      }

    }, navRef);

    return () => ctx.revert();
  }, [currentView]);

  const handleClick = (view: View) => {
    if (view === currentView) return;
    
    // Click feedback (sink effect)
    const icon = iconRefs.current[view];
    if (icon) {
        gsap.to(icon, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 });
    }
    
    onNavClick(view);
  };

  return (
    <nav ref={navRef} className="flex-none bg-slate-900 border-t border-slate-800 relative z-[100] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      
      {/* Gliding Indicator Background */}
      <div 
        ref={indicatorRef}
        className="absolute top-0 h-full bg-gradient-to-t from-indigo-900/30 to-transparent pointer-events-none opacity-0"
        style={{ width: 0 }} // Initial width
      >
         {/* Top Highlight Line */}
         <div className="absolute top-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
      </div>

      <div className="flex items-stretch h-16 relative">
        {NAV_ITEMS.map(({ view, label, imageUrl }) => {
          const isActive = currentView === view;
          
          return (
            <button
              key={view}
              data-view={view}
              onClick={() => handleClick(view)}
              className="flex-1 flex flex-col items-center justify-center relative group outline-none"
            >
              {/* Icon Container */}
              <div className="relative w-8 h-8 mb-1">
                {/* Glow Effect behind active icon */}
                <div 
                    className={`absolute inset-0 bg-indigo-500 blur-lg rounded-full transition-opacity duration-500 ${isActive ? 'opacity-40' : 'opacity-0'}`} 
                />
                
                <img 
                  ref={el => { if(el) iconRefs.current[view] = el }}
                  src={imageUrl} 
                  alt={label} 
                  className={`w-full h-full object-contain relative z-10 transition-all duration-300 ${isActive ? 'brightness-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'grayscale opacity-50'}`}
                />
              </div>
              
              <span 
                ref={el => { if(el) labelRefs.current[view] = el }}
                className={`text-[9px] font-black tracking-tight uppercase transition-colors duration-300 leading-none ${
                 isActive ? 'text-indigo-300' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
