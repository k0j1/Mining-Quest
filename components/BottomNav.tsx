
import React from 'react';
import { View } from '../types';
import { ICONS } from '../constants';

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
  { 
    view: View.HOME, 
    label: 'HOME', 
    icon: ICONS.HOME, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' 
  },
  { 
    view: View.PARTY, 
    label: '編成', 
    icon: ICONS.PARTY, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' 
  },
  { 
    view: View.DEPART, 
    label: '出発', 
    icon: ICONS.DEPART, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' 
  },
  { 
    view: View.RETURN, 
    label: '帰還', 
    icon: ICONS.RETURN, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' 
  },
  { 
    view: View.GACHA, 
    label: 'ガチャ', 
    icon: ICONS.GACHA, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' 
  },
  { 
    view: View.RECOVERY, 
    label: '回復', 
    icon: ICONS.RECOVERY, 
    imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' 
  },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavClick }) => {
  return (
    <nav className="flex-none bg-slate-950/98 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-[60] pb-[env(safe-area-inset-bottom)] h-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {NAV_ITEMS.map(({ view, label, icon: Icon, imageUrl }) => (
        <button
          key={view}
          onClick={() => onNavClick(view)}
          className={`flex flex-col items-center justify-center transition-all duration-300 w-14 pb-1 group ${
            currentView === view ? 'scale-110' : 'opacity-70 grayscale'
          }`}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Image with SVG Fallback */}
            <img 
              src={imageUrl} 
              alt={label} 
              className={`w-full h-full object-contain transition-all duration-300 ${
                currentView === view ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : ''
              }`}
              onError={(e) => {
                // Fallback to Icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const sibling = target.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }} className="fallback-icon">
               <Icon className={`w-6 h-6 ${currentView === view ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]' : 'text-slate-500'}`} />
            </div>

            {/* Active Indicator bar */}
            {currentView === view && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(129,140,248,1)]"></div>
            )}
          </div>
          <span className={`text-[9px] mt-1 font-black tracking-tighter transition-colors uppercase ${
             currentView === view ? 'text-indigo-300' : 'text-slate-500'
          }`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;