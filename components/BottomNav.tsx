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
  { view: View.HOME, label: 'HOME', icon: ICONS.HOME, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' },
  { view: View.PARTY, label: 'TEAM', icon: ICONS.PARTY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' },
  { view: View.DEPART, label: 'QUEST', icon: ICONS.DEPART, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' },
  { view: View.RETURN, label: 'RESULT', icon: ICONS.RETURN, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' },
  { view: View.GACHA, label: 'GACHA', icon: ICONS.GACHA, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' },
  { view: View.RECOVERY, label: 'REST', icon: ICONS.RECOVERY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavClick }) => {
  return (
    <nav className="flex-none bg-slate-900 border-t border-slate-800 flex items-center justify-around px-1 z-[100] pb-[env(safe-area-inset-bottom)] h-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      {NAV_ITEMS.map(({ view, label, imageUrl }) => (
        <button
          key={view}
          onClick={() => onNavClick(view)}
          className={`flex flex-col items-center justify-center transition-all duration-200 w-1/6 pb-1 group relative ${
            currentView === view ? 'opacity-100' : 'opacity-50 grayscale'
          }`}
        >
          {/* Active Indicator Line */}
          {currentView === view && (
            <div className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
          )}

          <div className="relative w-10 h-10 flex items-center justify-center mb-1 mt-1">
            <img 
              src={imageUrl} 
              alt={label} 
              className={`w-full h-full object-contain relative z-10 transition-transform duration-300 ${
                currentView === view ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'scale-90'
              }`}
            />
          </div>
          <span className={`text-[10px] font-bold tracking-tight transition-colors leading-none ${
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